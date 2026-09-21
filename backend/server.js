require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mlp-kids-studio.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook route FIRST (needs raw body before express.json parses it)
app.use('/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
      try { req.body = JSON.parse(req.body.toString()); } catch(_) {}
    }
    next();
  },
  require('./routes/payment')
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/data'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/rag', require('./routes/rag'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MLP Kids Studio API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MLP Kids Studio API running on port ${PORT}`);
});

module.exports = app;
