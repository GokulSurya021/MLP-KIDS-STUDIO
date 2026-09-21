"""
MLP Kids Studio - Production RAG AI Service
============================================
100% offline, zero API keys required.
Uses:
  - sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings
  - ChromaDB for vector storage & cosine similarity search
  - BM25 keyword scoring for re-ranking
  - Extractive + template-based answer synthesis

Endpoints:
  POST /chat          - SmartBook chatbot (studio knowledge base)
  POST /rag/upload    - Upload and index a PDF
  POST /rag/query     - Ask a question grounded strictly in uploaded PDFs
  GET  /rag/documents - List indexed PDF documents
  DELETE /rag/documents - Clear all indexed documents
  GET  /health        - Health check
"""

import json
import os
import re
import io
import math
import hashlib
import time
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ─── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MLP Kids Studio RAG AI",
    description="Production RAG-powered AI assistant for MLP Kids Studio",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Paths ─────────────────────────────────────────────────────────────────
DATA_DIR  = Path(__file__).parent.parent / "data"
CHROMA_DIR = Path(__file__).parent / "chroma_main_db"

def load_json(filename):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)

business      = load_json("business.json")
services      = load_json("services.json")
packages      = load_json("packages.json")
photographers = load_json("photographers.json")
booking_rules = load_json("booking_rules.json")

# ─── Embedding Model Setup ──────────────────────────────────────────────────────
print("[INFO] Loading sentence-transformer model (all-MiniLM-L6-v2)...", flush=True)
try:
    from sentence_transformers import SentenceTransformer
    _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    EMBED_DIM = 384
    EMBED_AVAILABLE = True
    print("[OK] Embedding model loaded successfully.", flush=True)
except Exception as e:
    print(f"[WARN] Embedding model unavailable: {e}. Falling back to local hash-based vectors.", flush=True)
    EMBED_AVAILABLE = False
    EMBED_DIM = 256

def local_hash_embedding(text: str) -> List[float]:
    """Deterministic dense vector from text using character n-gram hashing (fallback)."""
    vec = [0.0] * EMBED_DIM
    tokens = re.sub(r"[^a-z0-9]", " ", text.lower()).split()
    for i, tok in enumerate(tokens):
        h = int(hashlib.sha256(tok.encode()).hexdigest(), 16)
        idx = h % EMBED_DIM
        sign = 1 if h % 2 == 0 else -1
        vec[idx] += sign * (1 + 1 / (i + 1))
        if i < len(tokens) - 1:
            bigram = tok + "_" + tokens[i + 1]
            bh = int(hashlib.sha256(bigram.encode()).hexdigest(), 16)
            vec[bh % EMBED_DIM] += (1 if bh % 2 == 0 else -1) * 0.75
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]

def embed(text: str) -> List[float]:
    if EMBED_AVAILABLE:
        return _embed_model.encode(text, normalize_embeddings=True).tolist()
    return local_hash_embedding(text)

def embed_batch(texts: List[str]) -> List[List[float]]:
    if EMBED_AVAILABLE:
        return _embed_model.encode(texts, normalize_embeddings=True, batch_size=32).tolist()
    return [local_hash_embedding(t) for t in texts]

# ─── ChromaDB Setup ─────────────────────────────────────────────────────────────
print("[INFO] Initializing ChromaDB...", flush=True)
try:
    import chromadb
    from chromadb.config import Settings

    _chroma_client = chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False)
    )
    CHROMA_AVAILABLE = True
    print("[OK] ChromaDB initialized.", flush=True)
except Exception as e:
    print(f"[WARN] ChromaDB unavailable: {e}. Using in-memory vector store.", flush=True)
    CHROMA_AVAILABLE = False
    _chroma_client = None

def get_collection(name: str):
    if not CHROMA_AVAILABLE:
        return None
    try:
        return _chroma_client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        print(f"Collection error: {e}")
        return None

# ─── In-Memory Fallback Vector Store ────────────────────────────────────────────
_mem_store: Dict[str, List[Dict]] = {}   # { collection_name: [{ id, text, embedding, meta }] }

def cosine_sim(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (na * nb)

def mem_add(coll: str, ids, texts, embeddings, metadatas):
    if coll not in _mem_store:
        _mem_store[coll] = []
    for idx, (i, t, e, m) in enumerate(zip(ids, texts, embeddings, metadatas)):
        _mem_store[coll].append({"id": i, "text": t, "embedding": e, "meta": m})

def mem_query(coll: str, query_emb: List[float], n: int) -> List[Dict]:
    items = _mem_store.get(coll, [])
    scored = [(cosine_sim(query_emb, item["embedding"]), item) for item in items]
    scored.sort(key=lambda x: -x[0])
    return [{"text": item["text"], "meta": item["meta"], "score": score} for score, item in scored[:n]]

def mem_clear(coll: str):
    _mem_store[coll] = []

# ─── BM25 Scoring ───────────────────────────────────────────────────────────────
def bm25_score(query: str, text: str, k1=1.5, b=0.75, avg_len=200) -> float:
    tokens = re.sub(r"[^a-z0-9]", " ", query.lower()).split()
    words = re.sub(r"[^a-z0-9]", " ", text.lower()).split()
    tf = {}
    for w in words:
        tf[w] = tf.get(w, 0) + 1
    score = 0.0
    dl = len(words)
    for tok in tokens:
        freq = tf.get(tok, 0)
        if freq == 0:
            continue
        idf = math.log(1 + (1 / (0.5 + 0.5 / (freq + 1))))
        score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * dl / avg_len))
    return score

# ─── Knowledge Base Builder ──────────────────────────────────────────────────────
def build_kb_chunks() -> List[Dict]:
    """Build structured knowledge chunks from all data files."""
    chunks = []

    # Studio basics
    chunks.append({
        "id": "studio_info",
        "text": (
            f"MLP Kids Studio — Studio Overview\n"
            f"Name: {business['name']}\n"
            f"Tagline: {business['tagline']}\n"
            f"Description: {business['description']}\n"
            f"Location / Address: {business['address']}\n"
            f"Phone Number: {business['phone']}\n"
            f"Instagram: @{business['instagram']}\n"
            f"Google Maps: {business['google_maps']}\n"
            f"Business Hours: {business['hours']['display']}\n"
            f"Open Days: {business['hours']['days']}\n"
            f"Opening time: {business['hours']['open']} (10:00 AM)\n"
            f"Closing time: {business['hours']['close']} (7:00 PM)\n"
        ),
        "meta": {"topic": "studio", "subtopic": "info"}
    })

    # Each service as a separate chunk
    for svc in services:
        pkg_list = [
            p for p in packages
            if p.get("service_id") in (None, svc["id"])
       ]
        pkg_text = "\n".join(
            f"  - {p['name']}: ₹{p['price']} | Features: {', '.join(p['features'])}"
            for p in pkg_list
        )
        chunks.append({
            "id": f"service_{svc['id']}",
            "text": (
                f"Service: {svc['name']}\n"
                f"Description: {svc['description']}\n"
                f"Typical Duration: {svc['duration_hours']} hours\n"
                f"Packages Available:\n{pkg_text}\n"
            ),
            "meta": {"topic": "service", "service_id": svc["id"], "service_name": svc["name"]}
        })

    # Packages overview
    pkg_overview = "All Packages — Pricing Summary:\n"
    for svc in services:
        pkgs = [
            p for p in packages
            if p.get("service_id") in (None, svc["id"])
        ]
        if pkgs:
            pkg_overview += f"\n{svc['name']}:\n"
            for p in pkgs:
                pkg_overview += f"  • {p['name']}: ₹{p['price']}"
                if p.get("popular"):
                    pkg_overview += " ⭐ (Popular)"
                pkg_overview += "\n"
    chunks.append({
        "id": "packages_overview",
        "text": pkg_overview,
        "meta": {"topic": "pricing"}
    })

    # Each package as its own chunk
    for p in packages:
        svc_name = next(
            (s["name"] for s in services if s["id"] == p.get("service_id")),
            p.get("service_name", "All Services")
        )
        chunks.append({
            "id": f"pkg_{p['id']}",
            "text": (
                f"Package: {p['name']}\n"
                f"Service: {svc_name}\n"
                f"Price: ₹{p['price']} (Rs {p['price']})\n"
                f"Popular: {'Yes' if p.get('popular') else 'No'}\n"
                f"Includes / Features:\n" + "\n".join(f"  - {f}" for f in p["features"])
            ),
            "meta": {"topic": "package", "service": svc_name, "package_name": p["name"], "price": p["price"]}
        })

    # Booking rules
    chunks.append({
        "id": "booking_rules",
        "text": (
            f"Booking Rules & Policies at MLP Kids Studio:\n"
            f"- Advance payment required to confirm booking: ₹{booking_rules['advance_payment']} (Rs 3000)\n"
            f"- Cancellation fee: ₹{booking_rules['cancellation_fee']} (Rs 1000)\n"
            f"- Refund after cancellation: ₹{booking_rules['refund_after_cancellation']} (Rs 2000)\n"
            f"- Rescheduling: {'Allowed without extra charge' if booking_rules['rescheduling_allowed'] else 'Not allowed'}\n"
            f"- Maximum advance booking: {booking_rules['max_advance_booking_days']} days before shoot date\n"
            f"- Minimum buffer between shoots: {booking_rules['min_buffer_between_shoots_hours']} hours\n"
            f"- Business hours: {booking_rules['business_hours']['open']} to {booking_rules['business_hours']['close']}\n"
            f"- Open: {booking_rules['business_hours']['days']}\n"
            f"- Photographer selection: {booking_rules['photographer_options']}\n"
        ),
        "meta": {"topic": "booking"}
    })

    # Photographers
    photogs_text = "Lead Photographer at MLP Kids Studio:\n"
    for p in photographers:
        photogs_text += (
            f"- Name: {p['name']} | Phone: {p['phone']} | "
            f"Specialization: {p['specialization']} | Location: {p['location']} | "
            f"Available: {'Yes' if p.get('available') else 'No'}\n"
        )
    chunks.append({
        "id": "photographers",
        "text": photogs_text,
        "meta": {"topic": "photographers"}
    })

    return chunks

# ─── SmartBook Knowledge Base Collection ─────────────────────────────────────────
KB_COLLECTION = "mlp_smartbook_kb"
_kb_initialized = False

def init_knowledge_base():
    global _kb_initialized
    if _kb_initialized:
        return
    _kb_initialized = True

    chunks = build_kb_chunks()
    texts = [c["text"] for c in chunks]
    ids = [c["id"] for c in chunks]
    metas = [c["meta"] for c in chunks]

    print(f"[INFO] Embedding {len(chunks)} knowledge base chunks...", flush=True)
    embeddings = embed_batch(texts)

    if CHROMA_AVAILABLE:
        coll = get_collection(KB_COLLECTION)
        if coll is not None:
            try:
                existing = coll.count()
                if existing > 0:
                    coll.delete(ids=[c["id"] for c in chunks])
            except Exception:
                pass
            try:
                coll.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metas)
                print(f"[OK] Knowledge base indexed into ChromaDB ({len(chunks)} chunks).", flush=True)
                return
            except Exception as e:
                print(f"[WARN] ChromaDB add error: {e}, falling back to in-memory.", flush=True)

    # Fallback in-memory
    mem_add(KB_COLLECTION, ids, texts, embeddings, metas)
    print(f"[OK] Knowledge base indexed in-memory ({len(chunks)} chunks).", flush=True)

# Run on startup
init_knowledge_base()

# ─── RAG PDF Document Store ──────────────────────────────────────────────────────
RAG_COLLECTION = "mlp_rag_pdfs"
_indexed_docs: List[Dict] = []
NOT_FOUND = "I couldn't find this information in the uploaded documents."

# ─── PDF Text Extraction ─────────────────────────────────────────────────────────
def extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        return "\n\n".join(pages)
    except Exception as e:
        raise ValueError(f"PDF text extraction failed: {e}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = (current + "\n\n" + para).strip()
        else:
            if current:
                chunks.append(current)
                # Overlap: keep tail of current
                words = current.split()
                keep = " ".join(words[-max(1, overlap // 6):])
                current = (keep + "\n\n" + para).strip()
            else:
                # Large paragraph: slice
                while len(para) > chunk_size:
                    chunks.append(para[:chunk_size])
                    para = para[chunk_size - overlap:]
                current = para
    if current.strip():
        chunks.append(current.strip())
    return chunks

# ─── Retrieval & Answer Synthesis ─────────────────────────────────────────────────
STOP_WORDS = {
    "the","and","for","are","but","not","you","all","any","can","how",
    "what","when","where","which","who","why","this","that","these","those",
    "there","here","with","from","have","been","were","will","would","could",
    "should","does","done","tell","give","show","know","find","some","much",
    "more","most","other","into","only","very","also","just","than","then",
    "its","his","her","our","your","they","them","their","was","has","had",
    "say","get","use","one","two","may","might","each","both","own"
}

def substantive_tokens(text: str) -> List[str]:
    tokens = re.sub(r"[^a-z0-9]", " ", text.lower()).split()
    return [t for t in tokens if len(t) >= 3 and t not in STOP_WORDS]

def is_relevant(question: str, context: str, threshold: float = 0.35) -> bool:
    stokens = substantive_tokens(question)
    if not stokens:
        return True  # Short/generic question — allow
    ctx_lower = context.lower()
    matched = [t for t in stokens if re.search(r"\b" + re.escape(t), ctx_lower)]
    if len(stokens) <= 1:
        return len(matched) > 0
    ratio = len(matched) / len(stokens)
    return ratio >= threshold

def retrieve(question: str, collection_name: str, n: int = 5) -> List[Dict]:
    q_emb = embed(question)
    results = []

    if CHROMA_AVAILABLE:
        coll = get_collection(collection_name)
        if coll and coll.count() > 0:
            try:
                res = coll.query(query_embeddings=[q_emb], n_results=min(n, coll.count()))
                for i, doc in enumerate(res.get("documents", [[]])[0]):
                    results.append({
                        "text": doc,
                        "meta": (res.get("metadatas", [[]])[0][i] if res.get("metadatas") else {}),
                        "distance": (res.get("distances", [[]])[0][i] if res.get("distances") else 0.5)
                    })
                return results
            except Exception as e:
                print(f"ChromaDB query error: {e}")

    # Fallback in-memory
    raw = mem_query(collection_name, q_emb, n)
    return [{"text": r["text"], "meta": r["meta"], "distance": 1 - r["score"]} for r in raw]

def rerank(question: str, results: List[Dict]) -> List[Dict]:
    """Re-rank by combining cosine score with BM25 keyword overlap."""
    for r in results:
        semantic_score = 1 - r.get("distance", 0.5)
        keyword_score = bm25_score(question, r["text"])
        r["final_score"] = 0.65 * semantic_score + 0.35 * (keyword_score / (keyword_score + 10))
    results.sort(key=lambda x: -x.get("final_score", 0))
    return results

def extract_best_sentences(question: str, context: str, max_sentences: int = 4) -> str:
    """Find and extract the most relevant sentences from context for a given question."""
    tokens = substantive_tokens(question)
    sentences = re.split(r"(?<=[.!?])\s+", context)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

    scored = []
    for sent in sentences:
        s_lower = sent.lower()
        matches = sum(1 for t in tokens if re.search(r"\b" + re.escape(t), s_lower))
        bm = bm25_score(question, sent)
        scored.append((matches + bm / 5, sent))

    scored.sort(key=lambda x: -x[0])
    top = [s for _, s in scored[:max_sentences] if _ > 0]
    return " ".join(top) if top else ""

def smart_answer(question: str, collection: str) -> Dict:
    """Main RAG answer function."""
    results = retrieve(question, collection, n=6)
    if not results:
        return {"answer": NOT_FOUND, "sources": []}

    results = rerank(question, results)
    context_text = "\n\n---\n\n".join(r["text"] for r in results[:4])

    if not is_relevant(question, context_text):
        return {"answer": NOT_FOUND, "sources": []}

    answer = extract_best_sentences(question, context_text)

    if not answer.strip():
        return {"answer": NOT_FOUND, "sources": []}

    sources = []
    for r in results[:3]:
        meta = r.get("meta", {})
        doc_name = meta.get("source", meta.get("service_name", meta.get("topic", "Knowledge Base")))
        snippet = r["text"][:140].rstrip() + "..."
        sources.append({"document": doc_name, "snippet": snippet})

    unique_sources = list({s["document"]: s for s in sources}.values())
    return {"answer": answer, "sources": unique_sources}

# ─── SmartBook Chat ───────────────────────────────────────────────────────────────
def rag_chat_answer(question: str) -> str:
    """Answer studio questions using RAG over the knowledge base."""
    q = question.strip()

    # Direct exact-match shortcuts for ultra-fast answers
    ql = q.lower()
    if any(w in ql for w in ["hour", "timing", "open", "close", "schedule", "time"]):
        return (f"🕐 **MLP Kids Studio is open every day from 10:00 AM to 7:00 PM.**\n\n"
                f"📍 Visit us at Radham Center, near Bank of India, Sriramnagar, Samalkot, AP 533440\n"
                f"📞 Call: **9515651718**")

    if any(w in ql for w in ["location", "address", "where", "map", "find"]):
        return (f"📍 **Address:** Radham Center, near Bank of India, Sriramnagar, Samalkot, Andhra Pradesh 533440\n\n"
                f"🗺️ [Open in Google Maps](https://maps.app.goo.gl/pEBoWw23bfaqc32s8)\n"
                f"📞 Phone: **9515651718**")

    if any(w in ql for w in ["phone", "contact", "call", "number"]):
        return (f"📞 **Phone:** 9515651718\n"
                f"📸 **Instagram:** [@mlp_kids_studio_samalkot](https://instagram.com/mlp_kids_studio_samalkot)\n"
                f"🗺️ [Google Maps](https://maps.app.goo.gl/pEBoWw23bfaqc32s8)")

    if "cancel" in ql:
        return (f"❌ **Cancellation Policy:**\n\n"
                f"- Cancellation fee: **₹1,000**\n"
                f"- Refund: **₹2,000** returned to you\n"
                f"- Rescheduling: **Free** (no extra charge)\n\n"
                f"📞 For help: **9515651718**")

    if any(w in ql for w in ["book", "appointment", "session", "advance", "deposit"]):
        return (f"📅 **How to Book:**\n\n"
                f"1. Go to our website → click **'Book a Shoot'**\n"
                f"2. Choose your service & package\n"
                f"3. Studio photographer: **Lokesh**\n"
                f"4. Pick your date & time\n\n"
                f"**Rules:**\n"
                f"- Advance payment: ₹3,000\n"
                f"- Max 7 days advance booking\n"
                f"- Hours: 10 AM – 7 PM, every day\n"
                f"- 2-hour buffer between sessions\n\n"
                f"📞 Or call: **9515651718**")

    # RAG retrieval over knowledge base
    result = smart_answer(q, KB_COLLECTION)
    answer = result["answer"]

    if answer == NOT_FOUND or not answer.strip():
        return (f"Hello! I'm MLP SmartBook 🎨\n\n"
                f"I can help you with:\n"
                f"• 📸 Services & packages\n"
                f"• 💰 Pricing details\n"
                f"• 📅 Booking information\n"
                f"• 📍 Location & hours\n"
                f"• 📞 Contact details\n\n"
                f"What would you like to know? Or call **9515651718** directly.")

    return answer


# ─── Pydantic Models ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: List[Dict] = []

class ChatResponse(BaseModel):
    reply: str

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    success: bool
    answer: str
    sources: List[Dict] = []

# ─── Routes ──────────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        reply = rag_chat_answer(req.message)
        return ChatResponse(reply=reply)
    except Exception as e:
        print(f"Chat error: {e}")
        return ChatResponse(reply="I'm having trouble right now. Please call **9515651718**.")

@app.post("/rag/upload")
async def rag_upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 25MB limit.")

    try:
        text = extract_pdf_text(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the PDF.")

    chunks = chunk_text(text, chunk_size=500, overlap=80)
    if not chunks:
        raise HTTPException(status_code=422, detail="Document could not be chunked.")

    file_id = hashlib.md5(file.filename.encode()).hexdigest()[:12] + "_" + str(int(time.time()))
    ids = [f"{file_id}_c{i}" for i in range(len(chunks))]
    metas = [{"source": file.filename, "file_id": file_id, "chunk_index": i, "total_chunks": len(chunks)} for i in range(len(chunks))]

    print(f"Embedding {len(chunks)} chunks from '{file.filename}'...")
    embeddings = embed_batch(chunks)

    if CHROMA_AVAILABLE:
        coll = get_collection(RAG_COLLECTION)
        if coll:
            try:
                coll.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metas)
            except Exception as e:
                print(f"ChromaDB add error: {e}")
                mem_add(RAG_COLLECTION, ids, chunks, embeddings, metas)
        else:
            mem_add(RAG_COLLECTION, ids, chunks, embeddings, metas)
    else:
        mem_add(RAG_COLLECTION, ids, chunks, embeddings, metas)

    doc_entry = {
        "file_id": file_id,
        "filename": file.filename,
        "chunks_count": len(chunks),
        "pages_count": text.count("\f") + 1,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    _indexed_docs.append(doc_entry)

    return JSONResponse({
        "success": True,
        "message": f'Successfully indexed "{file.filename}" ({len(chunks)} chunks)',
        "data": doc_entry
    })

@app.post("/rag/query", response_model=QueryResponse)
async def rag_query(req: QueryRequest):
    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question is required.")

    if not _indexed_docs:
        return QueryResponse(success=True, answer=NOT_FOUND, sources=[])

    result = smart_answer(q, RAG_COLLECTION)
    return QueryResponse(success=True, answer=result["answer"], sources=result["sources"])

@app.get("/rag/documents")
async def rag_documents():
    return {"success": True, "documents": _indexed_docs}

@app.delete("/rag/documents")
async def rag_clear():
    _indexed_docs.clear()
    if CHROMA_AVAILABLE:
        try:
            _chroma_client.delete_collection(RAG_COLLECTION)
        except Exception:
            pass
    mem_clear(RAG_COLLECTION)
    return {"success": True, "message": "All indexed documents cleared."}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "embed_model": "sentence-transformers/all-MiniLM-L6-v2" if EMBED_AVAILABLE else "local-hash-fallback",
        "chroma": CHROMA_AVAILABLE,
        "kb_chunks": len(build_kb_chunks()),
        "rag_docs": len(_indexed_docs)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
