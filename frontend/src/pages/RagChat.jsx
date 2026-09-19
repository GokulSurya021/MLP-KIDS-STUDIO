import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  FileText, 
  UploadCloud, 
  Bot, 
  User, 
  Send, 
  Trash2, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RefreshCw,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import './RagChat.css';

const NOT_FOUND_MSG = "I couldn't find this information in the uploaded documents.";

export default function RagChat() {
  // State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your RAG (Retrieval-Augmented Generation) AI assistant. Upload any PDF document on the left, and I will answer your questions based **strictly on the contents of your uploaded documents**.",
      sources: [],
      timestamp: new Date()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

  // Voice Search (Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Voice Speech (Text-to-Speech)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const cleanTextForSpeech = (text) => {
    return text
      .replace(/[*#_`~[\]()]/g, ' ')
      .replace(/•/g, ', ')
      .replace(/₹(\d+)/g, '$1 rupees')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = (text, msgId = null) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId && msgId !== null) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    stopSpeech();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening to query...', { icon: '🎙️', duration: 2500 });
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Load indexed documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, querying]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/rag/documents');
      if (res.data?.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const toastId = toast.loading(`Processing & indexing "${file.name}"...`);

    try {
      const res = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success(`"${file.name}" indexed successfully! (${res.data.data.chunksIndexed} chunks)`, { id: toastId });
        await fetchDocuments();
        
        // Add notification into chat
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            role: 'system',
            content: `📄 **"${file.name}"** was uploaded and chunked into **${res.data.data.chunksIndexed} vectors** in ChromaDB. You can now ask any question about it!`,
            timestamp: new Date()
          }
        ]);
      } else {
        toast.error(res.data?.message || 'Failed to process document', { id: toastId });
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'Error processing document', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearDocuments = async () => {
    if (!window.confirm('Are you sure you want to clear all indexed documents from ChromaDB?')) {
      return;
    }

    try {
      const res = await api.delete('/rag/documents');
      if (res.data?.success) {
        toast.success('All documents cleared from ChromaDB.');
        setDocuments([]);
        setMessages([
          {
            id: 'welcome-reset',
            role: 'assistant',
            content: "The document index has been cleared. Upload a new PDF to begin asking questions.",
            sources: [],
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      toast.error('Failed to clear documents.');
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const q = inputQuery.trim();
    if (!q || querying) return;

    // Check if documents are uploaded
    if (documents.length === 0) {
      toast.error('Please upload at least one PDF document first!');
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: q,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setQuerying(true);

    try {
      const res = await api.post('/rag/query', { question: q });
      
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data?.answer || NOT_FOUND_MSG,
        sources: res.data?.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      if (voiceEnabled) {
        speakText(res.data?.answer || NOT_FOUND_MSG, botMessage.id);
      }
    } catch (err) {
      console.error('Query error:', err);
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: NOT_FOUND_MSG,
        sources: [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
      if (voiceEnabled) {
        speakText(NOT_FOUND_MSG, errMsg.id);
      }
    } finally {
      setQuerying(false);
    }
  };

  const toggleSource = (msgId) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunksCount || 0), 0);

  return (
    <div className="rag-page">
      {/* Hero / Header */}
      <section className="rag-header">
        <div className="container">
          <div className="rag-badge">
            <Sparkles size={14} />
            <span>RAG Document Intelligence</span>
          </div>
          <h1 className="rag-title">
            Ask Questions <span className="text-gold">From Your Documents</span>
          </h1>
          <p className="rag-subtitle">
            Upload any PDF brochure, contract, or policy. Our vector search engine chunks and embeds the text into ChromaDB, providing strictly grounded, cited answers.
          </p>
        </div>
      </section>

      {/* Main Content Workspace */}
      <section className="rag-workspace container">
        <div className="rag-grid">
          
          {/* Left Column: PDF Upload & Indexed Documents */}
          <div className="rag-sidebar">
            <div className="rag-card upload-box">
              <div className="rag-card-header">
                <div className="card-title-group">
                  <UploadCloud className="card-icon gold" size={20} />
                  <h3>Upload Documents</h3>
                </div>
                <span className="file-format-tag">PDF only</span>
              </div>

              {/* Drag & Drop Zone */}
              <div 
                className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${uploading ? 'dropzone-uploading' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="application/pdf"
                  style={{ display: 'none' }}
                />

                {uploading ? (
                  <div className="upload-progress">
                    <RefreshCw className="spin-icon gold" size={32} />
                    <p className="upload-title">Processing & Chunking Document...</p>
                    <p className="upload-desc">Extracting text & generating ChromaDB vector embeddings</p>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="upload-icon-circle">
                      <FileText size={26} className="gold" />
                    </div>
                    <p className="upload-title">Click to upload or drag & drop</p>
                    <p className="upload-desc">Supports PDF up to 25MB</p>
                  </div>
                )}
              </div>

              {/* Vector DB Stats */}
              <div className="vector-stats-row">
                <div className="stat-pill">
                  <Database size={13} className="gold" />
                  <span>ChromaDB Vector Store</span>
                </div>
                <div className="stat-pill">
                  <Layers size={13} className="gold" />
                  <span>{totalChunks} Chunks Indexed</span>
                </div>
              </div>
            </div>

            {/* Indexed Documents List */}
            <div className="rag-card doc-list-card">
              <div className="rag-card-header">
                <div className="card-title-group">
                  <BookOpen className="card-icon gold" size={18} />
                  <h3>Indexed Documents ({documents.length})</h3>
                </div>
                {documents.length > 0 && (
                  <button 
                    className="clear-btn" 
                    onClick={handleClearDocuments}
                    title="Clear all indexed documents"
                  >
                    <Trash2 size={14} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="doc-list">
                {loadingDocs ? (
                  <div className="doc-empty">
                    <RefreshCw className="spin-icon" size={18} />
                    <span>Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="doc-empty">
                    <Info size={18} />
                    <p>No documents indexed yet.</p>
                    <small>Upload a PDF above to begin asking questions.</small>
                  </div>
                ) : (
                  documents.map((doc, idx) => (
                    <div key={doc.fileId || idx} className="doc-item">
                      <div className="doc-item-icon">
                        <FileText size={18} className="gold" />
                      </div>
                      <div className="doc-item-info">
                        <span className="doc-filename" title={doc.filename}>{doc.filename}</span>
                        <div className="doc-meta">
                          <span>{doc.pagesCount || 1} {doc.pagesCount === 1 ? 'page' : 'pages'}</span>
                          <span>•</span>
                          <span>{doc.chunksCount} chunks</span>
                          <span>•</span>
                          <span className="badge-indexed">Indexed</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* RAG Guarantee Notice */}
              <div className="rag-notice">
                <AlertCircle size={14} className="gold" />
                <p>
                  <strong>Grounded Answers:</strong> The AI responds strictly using content from your uploaded PDFs. If facts are absent, it replies: <em>"{NOT_FOUND_MSG}"</em>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive RAG Chat */}
          <div className="rag-main">
            <div className="rag-chat-container">
              
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="bot-avatar">
                    <Bot size={20} className="gold" />
                  </div>
                  <div>
                    <h4 className="bot-name">RAG Knowledge Assistant</h4>
                    <span className="bot-status">
                      <span className="status-dot"></span>
                      Connected to ChromaDB & Vector Store
                    </span>
                  </div>
                </div>

                <div className="chat-actions">
                  <button 
                    className="chat-action-btn"
                    onClick={() => {
                      setMessages([
                        {
                          id: Date.now(),
                          role: 'assistant',
                          content: "Chat history cleared. How can I assist you with your uploaded documents?",
                          sources: [],
                          timestamp: new Date()
                        }
                      ]);
                    }}
                    title="Clear chat history"
                  >
                    Reset Chat
                  </button>

                  {/* Voice Toggle */}
                  <button
                    type="button"
                    className={`chat-action-btn ${voiceEnabled ? 'gold' : ''}`}
                    onClick={() => {
                      if (voiceEnabled) stopSpeech();
                      setVoiceEnabled(!voiceEnabled);
                      toast(voiceEnabled ? 'Voice responses muted' : 'Voice responses enabled', {
                        icon: voiceEnabled ? '🔇' : '🔊',
                        duration: 1500
                      });
                    }}
                    title={voiceEnabled ? 'Voice Speech: ON' : 'Voice Speech: OFF'}
                  >
                    {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    <span>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message-row ${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="message-avatar bot">
                        <Bot size={16} />
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="message-avatar user">
                        <User size={16} />
                      </div>
                    )}

                    <div className={`message-bubble ${msg.role} ${msg.content === NOT_FOUND_MSG ? 'not-found' : ''}`}>
                      <div className="message-text">
                        {msg.content}
                      </div>

                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.content, msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: speakingMsgId === msg.id ? '#fbbf24' : '#8c8c9a',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            marginTop: '6px',
                            padding: '2px 0'
                          }}
                          title={speakingMsgId === msg.id ? 'Stop speaking' : 'Read aloud'}
                        >
                          {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          <span>{speakingMsgId === msg.id ? 'Speaking...' : 'Listen'}</span>
                        </button>
                      )}

                      {/* Sources / References accordion */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="sources-container">
                          <button 
                            className="sources-toggle-btn"
                            onClick={() => toggleSource(msg.id)}
                          >
                            <CheckCircle2 size={13} className="gold" />
                            <span>Sources from Document ({msg.sources.length})</span>
                            {expandedSources[msg.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          {expandedSources[msg.id] && (
                            <div className="sources-list">
                              {msg.sources.map((src, sIdx) => (
                                <div key={sIdx} className="source-item">
                                  <div className="source-header">
                                    <span className="source-doc-name">{src.document}</span>
                                    <span className="source-chunk-tag">Chunk #{src.chunk}</span>
                                  </div>
                                  <p className="source-snippet">"{src.snippet}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {querying && (
                  <div className="chat-message-row assistant">
                    <div className="message-avatar bot">
                      <Bot size={16} />
                    </div>
                    <div className="message-bubble assistant typing">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-label">Searching ChromaDB & generating grounded response...</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input 
                  type="text"
                  className="chat-input"
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : documents.length > 0
                      ? "Ask or speak any question about your uploaded documents..."
                      : "Upload a PDF document first to ask questions..."
                  }
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={querying || documents.length === 0}
                  style={isListening ? { borderColor: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)' } : {}}
                />

                {/* Voice Search Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className="chat-mic-btn"
                  title={isListening ? 'Stop listening' : 'Voice Search (Click & Speak)'}
                  style={{
                    background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isListening ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isListening ? '#ef4444' : '#D4AF37',
                    borderRadius: '10px',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>

                <button 
                  type="submit" 
                  className="chat-send-btn"
                  disabled={!inputQuery.trim() || querying || documents.length === 0}
                >
                  <Send size={16} />
                </button>
              </form>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
