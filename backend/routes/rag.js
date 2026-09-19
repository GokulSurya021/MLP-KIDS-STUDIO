/**
 * RAG Document AI Routes
 * ======================
 * Proxies all RAG operations to the Python AI service (port 8000)
 * which uses sentence-transformers + ChromaDB + BM25 re-ranking.
 * Falls back to the Node.js ragService if Python AI is unavailable.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const AI_URL = process.env.AI_API_URL || 'http://localhost:8000';

// Multer in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are supported'));
    }
  }
});

// Helper: check Python AI service availability
let _aiAvailable = null;
let _lastCheck = 0;
async function isPyAIAvailable() {
  const now = Date.now();
  if (now - _lastCheck < 10000) return _aiAvailable; // cache for 10s
  _lastCheck = now;
  try {
    await axios.get(`${AI_URL}/health`, { timeout: 3000 });
    _aiAvailable = true;
  } catch {
    _aiAvailable = false;
  }
  return _aiAvailable;
}

// Fallback Node.js RAG service
const nodeFallback = require('../services/ragService');

// ─── POST /api/rag/upload ────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const pyAvailable = await isPyAIAvailable();

    if (pyAvailable) {
      // Forward to Python AI service
      const form = new FormData();
      form.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: 'application/pdf'
      });

      const pyRes = await axios.post(`${AI_URL}/rag/upload`, form, {
        headers: form.getHeaders(),
        timeout: 120000,
        maxContentLength: 30 * 1024 * 1024
      });

      return res.status(200).json(pyRes.data);
    }

    // Fallback to Node.js RAG
    const result = await nodeFallback.processPdfDocument(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      success: true,
      message: `Successfully indexed "${req.file.originalname}" (Node.js fallback)`,
      data: result
    });

  } catch (err) {
    console.error('RAG upload error:', err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.detail || err.message || 'Error processing PDF'
    });
  }
});

// ─── POST /api/rag/query ────────────────────────────────────────────────────
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const pyAvailable = await isPyAIAvailable();

    if (pyAvailable) {
      const pyRes = await axios.post(`${AI_URL}/rag/query`, { question: question.trim() }, { timeout: 30000 });
      return res.status(200).json(pyRes.data);
    }

    // Fallback to Node.js RAG
    const result = await nodeFallback.queryRag(question.trim());
    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources || []
    });

  } catch (err) {
    console.error('RAG query error:', err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.detail || err.message || 'Error executing RAG search'
    });
  }
});

// ─── GET /api/rag/documents ────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const pyAvailable = await isPyAIAvailable();

    if (pyAvailable) {
      const pyRes = await axios.get(`${AI_URL}/rag/documents`, { timeout: 5000 });
      return res.status(200).json(pyRes.data);
    }

    const docs = nodeFallback.getIndexedDocuments();
    return res.status(200).json({ success: true, documents: docs });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving documents' });
  }
});

// ─── DELETE /api/rag/documents ─────────────────────────────────────────────
router.delete('/documents', async (req, res) => {
  try {
    const pyAvailable = await isPyAIAvailable();

    if (pyAvailable) {
      const pyRes = await axios.delete(`${AI_URL}/rag/documents`, { timeout: 10000 });
      return res.status(200).json(pyRes.data);
    }

    const result = await nodeFallback.clearIndexedDocuments();
    return res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ success: false, message: 'Error clearing documents' });
  }
});

module.exports = router;
