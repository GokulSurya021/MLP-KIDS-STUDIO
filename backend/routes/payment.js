const express = require('express');
const router  = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getConfig
} = require('../controllers/paymentController');

// ── Public ────────────────────────────────────────────────────────────────
// Returns Razorpay key_id (safe to expose — it's a public identifier)
router.get('/config', getConfig);

// ── Webhook (raw body — MUST come before express.json middleware) ──────────
// Razorpay signs the raw request body, so we need it unparsed.
// Registered in: Razorpay Dashboard → Settings → Webhooks
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // raw body for signature check
  (req, res, next) => {
    // Re-parse body so controller can read it as object
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
      req.body    = JSON.parse(req.body.toString());
    }
    next();
  },
  handleWebhook
);

// ── Payment order creation & verification (supports logged-in & guest checkout) ──
router.post('/create-order', optionalAuth, createOrder);
router.post('/verify',       optionalAuth, verifyPayment);

module.exports = router;
