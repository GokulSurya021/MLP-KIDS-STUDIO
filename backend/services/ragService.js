const pdfParse = require('pdf-parse');
const { ChromaClient } = require('chromadb');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8001';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'mlp_rag_documents';
const NOT_FOUND_MSG = "I couldn't find this information in the uploaded documents.";

// Initialize Chroma client
let chromaClient = null;
let chromaCollection = null;
let indexedDocuments = []; // In-memory metadata cache of uploaded docs

const getChromaClient = () => {
  if (!chromaClient) {
    try {
      const url = new URL(CHROMA_URL);
      chromaClient = new ChromaClient({
        path: CHROMA_URL
      });
    } catch (err) {
      console.warn('ChromaClient init warning:', err.message);
    }
  }
  return chromaClient;
};

const customEmbeddingFunction = {
  generate: async (texts) => {
    return Promise.all(texts.map(t => generateEmbedding(t)));
  }
};

const getCollection = async () => {
  if (chromaCollection) return chromaCollection;
  const client = getChromaClient();
  if (!client) return null;
  try {
    chromaCollection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: customEmbeddingFunction
    });
    return chromaCollection;
  } catch (err) {
    console.error('Failed to get/create ChromaDB collection:', err.message);
    return null;
  }
};

/**
 * Generate normalized embedding vector (128 dimensions).
 * Uses OpenAI if OPENAI_API_KEY is configured, otherwise uses high-entropy semantic vector hashing.
 */
const generateEmbedding = async (text) => {
  if (process.env.OPENAI_API_KEY && process.env.EMBEDDING_PROVIDER !== 'local') {
    try {
      const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const res = await axios.post(
        `${baseURL}/embeddings`,
        {
          input: text.slice(0, 8000),
          model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      if (res.data?.data?.[0]?.embedding) {
        return res.data.data[0].embedding;
      }
    } catch (err) {
      console.warn('OpenAI embedding failed, falling back to local vector generator:', err.message);
    }
  }

  // Local deterministic 128-dimensional dense vector generator
  const dims = 128;
  const vector = new Array(dims).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dims;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[idx] += sign * (1 + 1 / (i + 1));

    // Bigram context
    if (i < words.length - 1) {
      const biWord = word + '_' + words[i + 1];
      let biHash = 0;
      for (let k = 0; k < biWord.length; k++) {
        biHash = (biHash << 5) - biHash + biWord.charCodeAt(k);
        biHash |= 0;
      }
      const biIdx = Math.abs(biHash) % dims;
      vector[biIdx] += (biHash % 2 === 0 ? 0.75 : -0.75);
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) vector[i] /= norm;
  }
  return vector;
};

/**
 * Split raw text into overlapping chunks
 */
const splitTextIntoChunks = (text, chunkSize = 500, overlap = 100) => {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim().replace(/\s+/g, ' ');
    if (!cleanPara) continue;

    if (currentChunk.length + cleanPara.length + 1 <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + cleanPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // Keep overlap from end of currentChunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.min(words.length, Math.floor(overlap / 6))).join(' ');
        currentChunk = overlapWords + '\n\n' + cleanPara;
      } else {
        // Paragraph itself is larger than chunkSize, split into slices
        let remaining = cleanPara;
        while (remaining.length > chunkSize) {
          chunks.push(remaining.slice(0, chunkSize));
          remaining = remaining.slice(chunkSize - overlap);
        }
        currentChunk = remaining;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Process uploaded PDF buffer, extract text, chunk, embed, and store in ChromaDB
 */
const processPdfDocument = async (fileBuffer, originalName) => {
  try {
    // 1. Extract text
    let rawText = '';
    let numPages = 1;

    if (typeof pdfParse === 'function') {
      const parsed = await pdfParse(fileBuffer);
      rawText = parsed.text || '';
      numPages = parsed.numpages || 1;
    } else if (pdfParse?.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: fileBuffer });
      await parser.load();
      const res = await parser.getText();
      rawText = (typeof res === 'string' ? res : res?.text) || '';
      numPages = res?.total || res?.pages?.length || 1;
    } else {
      throw new Error('PDF parsing library could not be initialized.');
    }

    if (!rawText.trim()) {
      throw new Error('No readable text found in the PDF document.');
    }

    // 2. Split into chunks
    const textChunks = splitTextIntoChunks(rawText, 500, 100);
    if (textChunks.length === 0) {
      throw new Error('Document content could not be chunked.');
    }

    // 3. Generate embeddings
    const embeddings = [];
    const ids = [];
    const metadatas = [];
    const documents = [];

    const fileId = Buffer.from(originalName).toString('hex').slice(0, 16) + '_' + Date.now();

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const embedding = await generateEmbedding(chunk);
      embeddings.push(embedding);
      ids.push(`${fileId}_chunk_${i}`);
      documents.push(chunk);
      metadatas.push({
        source: originalName,
        fileId,
        chunkIndex: i,
        totalChunks: textChunks.length,
        totalPages: numPages
      });
    }

    // 4. Store in ChromaDB
    const collection = await getCollection();
    if (collection) {
      await collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });
    }

    // 5. Track in indexed documents list
    const docEntry = {
      fileId,
      filename: originalName,
      chunksCount: textChunks.length,
      pagesCount: numPages,
      uploadedAt: new Date().toISOString()
    };
    indexedDocuments.push(docEntry);

    return {
      success: true,
      filename: originalName,
      chunksIndexed: textChunks.length,
      pages: numPages,
      fileId
    };
  } catch (err) {
    console.error('PDF processing error in RAG service:', err);
    throw err;
  }
};

/**
 * Query the vector database and generate response via AI model
 */
const queryRag = async (question) => {
  if (!question || !question.trim()) {
    throw new Error('Question is required');
  }

  // 1. Check if documents have been uploaded
  if (indexedDocuments.length === 0) {
    return {
      answer: NOT_FOUND_MSG,
      sources: []
    };
  }

  // 2. Generate embedding for user query
  const queryVector = await generateEmbedding(question);

  // 3. Search ChromaDB
  const collection = await getCollection();
  let retrievedChunks = [];

  if (collection) {
    try {
      const results = await collection.query({
        queryEmbeddings: [queryVector],
        nResults: Math.min(4, Math.max(1, indexedDocuments.reduce((acc, d) => acc + d.chunksCount, 0)))
      });

      if (results?.documents?.[0] && results.documents[0].length > 0) {
        for (let i = 0; i < results.documents[0].length; i++) {
          retrievedChunks.push({
            content: results.documents[0][i],
            metadata: results.metadatas?.[0]?.[i] || {},
            distance: results.distances?.[0]?.[i] ?? 0.5
          });
        }
      }
    } catch (err) {
      console.error('ChromaDB query error:', err.message);
    }
  }

  if (retrievedChunks.length === 0) {
    return {
      answer: NOT_FOUND_MSG,
      sources: []
    };
  }

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'had', 'him',
  'his', 'how', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'who',
  'what', 'when', 'where', 'which', 'whom', 'whose', 'why',
  'this', 'that', 'these', 'those', 'there', 'here',
  'about', 'above', 'after', 'again', 'against', 'along', 'among',
  'have', 'having', 'been', 'were', 'with', 'from',
  'does', 'doing', 'done', 'would', 'could', 'should', 'will', 'shall',
  'tell', 'give', 'show', 'know', 'find', 'make', 'like', 'some', 'many',
  'much', 'more', 'most', 'other', 'into', 'only', 'very', 'also', 'just'
]);

  // 4. Check keyword relevance with stop-word filtering
  const allWords = question.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  const substantiveWords = allWords.filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  const contextText = retrievedChunks.map(c => c.content).join('\n\n');
  const contextLower = contextText.toLowerCase();

  const matchingWords = substantiveWords.filter(w => {
    const reg = new RegExp('\\b' + w, 'i');
    return reg.test(contextLower);
  });

  // If question has substantive keywords and NONE are in the document context, strictly refuse
  if (substantiveWords.length > 0 && matchingWords.length === 0) {
    return {
      answer: NOT_FOUND_MSG,
      sources: []
    };
  }

  // If ratio of matching substantive keywords is too low, refuse
  if (substantiveWords.length >= 2 && (matchingWords.length / substantiveWords.length) < 0.35) {
    return {
      answer: NOT_FOUND_MSG,
      sources: []
    };
  }

  // 5. Query AI Model with strict prompt
  const sources = retrievedChunks.map(c => ({
    document: c.metadata.source || 'Uploaded Document',
    chunk: (c.metadata.chunkIndex ?? 0) + 1,
    snippet: c.content.slice(0, 150) + '...'
  }));

  // Unique sources by document name
  const uniqueSources = Array.from(new Set(sources.map(s => s.document)))
    .map(doc => sources.find(s => s.document === doc));

  const promptSystem = `You are an AI assistant that answers questions based ONLY on the provided context extracted from uploaded PDF documents.
Strict Rules:
1. Answer the question using ONLY the facts explicitly mentioned in the Context below.
2. If the answer cannot be found in the provided context, reply EXACTLY with:
"${NOT_FOUND_MSG}"
3. Do NOT extrapolate, speculate, or include knowledge outside the Context.
4. Keep your answer concise, accurate, and professional.`;

  const promptUser = `Context:
${contextText}

Question:
${question}

Answer:`;

  // Try external LLM API if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const res = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model,
          messages: [
            { role: 'system', content: promptSystem },
            { role: 'user', content: promptUser }
          ],
          temperature: 0.1
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiReply = res.data?.choices?.[0]?.message?.content?.trim();
      if (aiReply) {
        if (aiReply.includes("couldn't find this information") || aiReply.includes("cannot find this information")) {
          return { answer: NOT_FOUND_MSG, sources: [] };
        }
        return { answer: aiReply, sources: uniqueSources };
      }
    } catch (err) {
      console.warn('OpenAI chat completion error, utilizing local factual synthesis:', err.message);
    }
  }

  // If Gemini API is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const res = await axios.post(
        url,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${promptSystem}\n\n${promptUser}` }]
            }
          ]
        },
        { timeout: 30000 }
      );

      const geminiReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (geminiReply) {
        if (geminiReply.includes("couldn't find this information") || geminiReply.includes("cannot find this information")) {
          return { answer: NOT_FOUND_MSG, sources: [] };
        }
        return { answer: geminiReply, sources: uniqueSources };
      }
    } catch (err) {
      console.warn('Gemini chat error:', err.message);
    }
  }

  // Local Factual Extraction Synthesis (Works 100% offline without external API keys)
  const sentences = contextText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const matchedSentences = sentences.filter(s => {
    const sLower = s.toLowerCase();
    const targetTokens = substantiveWords.length > 0 ? substantiveWords : allWords;
    return targetTokens.some(w => {
      const reg = new RegExp('\\b' + w, 'i');
      return reg.test(sLower);
    });
  });

  if (matchedSentences.length === 0) {
    return {
      answer: NOT_FOUND_MSG,
      sources: []
    };
  }

  const answer = matchedSentences.slice(0, 3).join(' ');
  return {
    answer,
    sources: uniqueSources
  };
};

/**
 * Get all indexed documents
 */
const getIndexedDocuments = () => {
  return indexedDocuments;
};

/**
 * Clear/reset the collection
 */
const clearIndexedDocuments = async () => {
  try {
    const collection = await getCollection();
    if (collection) {
      const client = getChromaClient();
      await client.deleteCollection({ name: COLLECTION_NAME });
      chromaCollection = null;
    }
  } catch (err) {
    console.warn('Error clearing Chroma collection:', err.message);
  }
  indexedDocuments = [];
  return { success: true, message: 'All indexed documents cleared.' };
};

module.exports = {
  processPdfDocument,
  queryRag,
  getIndexedDocuments,
  clearIndexedDocuments
};
