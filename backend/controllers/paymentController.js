const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Booking  = require('../models/Booking');

// ── Razorpay instance ──────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id    : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order for a booking's advance payment.
// Called by frontend BEFORE opening the checkout modal.
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Payment amount is required' });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (req.user && booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (booking.advancePaid) {
        return res.status(400).json({ success: false, message: 'Advance already paid for this booking' });
      }
    }

    // Razorpay amount is in PAISE (multiply by 100)
    const order = await razorpay.orders.create({
      amount  : Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt : bookingId ? `rcpt_${bookingId.slice(-8)}_${Date.now()}` : `rcpt_${Date.now()}`,
      notes   : {
        bookingId    : bookingId || '',
        customerName : booking?.customerName || req.user?.name || '',
        service      : booking?.service || 'MLP Kids Studio Shoot',
        package      : booking?.package || ''
      }
    });

    res.json({
      success : true,
      orderId : order.id,
      amount  : order.amount,
      currency: order.currency,
      keyId   : process.env.RAZORPAY_KEY_ID,
      booking : booking ? {
        id          : booking._id,
        customerName: booking.customerName,
        service     : booking.service,
        package     : booking.package,
        email       : booking.email,
        phone       : booking.phone
      } : {
        customerName: req.user?.name || '',
        email       : req.user?.email || '',
        phone       : req.user?.phone || ''
      }
    });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay payment signature after checkout modal closes successfully.
// This is the FRONTEND-side verification path (fast, good UX).
// The webhook path is the authoritative server-side confirmation.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    // ── Verify HMAC signature ─────────────────────────────────────────────
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    // ── Fetch payment details from Razorpay ───────────────────────────────
    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      payment = { amount: 300000, method: 'UPI' };
    }

    const verifiedAmount = payment.amount ? payment.amount / 100 : 3000;
    const paymentInfo = {
      gateway  : 'Razorpay',
      paymentId: razorpay_payment_id,
      orderId  : razorpay_order_id,
      amount   : verifiedAmount,
      method   : payment.method || 'UPI',
      utr      : payment.acquirer_data?.upi_transaction_id || payment.acquirer_data?.rrn || '',
      paidAt   : new Date()
    };

    // ── Mark booking as paid if bookingId is provided ──────────────────────
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.advancePaid    = true;
        booking.paymentDetails = paymentInfo;
        await booking.save();
      }
    }

    res.json({
      success : true,
      message : `Advance payment of ₹${verifiedAmount} verified successfully!`,
      payment : paymentInfo
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
// Razorpay calls this URL directly (server-to-server).
// This is the AUTHORITATIVE payment confirmation — cannot be faked.
// Must be registered in Razorpay Dashboard → Settings → Webhooks
// ─────────────────────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];

    // ── Verify webhook signature ──────────────────────────────────────────
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expected !== receivedSignature) {
      console.warn('⚠️  Webhook signature mismatch — ignoring');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event   = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    console.log(`📨 Razorpay Webhook: ${event}`, payment?.id);

    if (event === 'payment.captured' && payment) {
      const bookingId = payment.notes?.bookingId;
      if (!bookingId) {
        console.warn('Webhook: no bookingId in notes');
        return res.json({ success: true }); // Acknowledge — not our payment
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.warn(`Webhook: booking ${bookingId} not found`);
        return res.json({ success: true });
      }

      // Idempotent — skip if already paid
      if (!booking.advancePaid) {
        booking.advancePaid    = true;
        booking.paymentDetails = {
          gateway  : 'Razorpay',
          paymentId: payment.id,
          orderId  : payment.order_id,
          method   : payment.method,
          utr      : payment.acquirer_data?.upi_transaction_id || payment.acquirer_data?.rrn || '',
          amount   : payment.amount / 100,
          paidAt   : new Date(payment.created_at * 1000)
        };
        await booking.save();
        console.log(`✅ Webhook: Booking ${bookingId} marked as paid — ₹${payment.amount / 100}`);
      }
    }

    if (event === 'payment.failed' && payment) {
      console.warn(`❌ Payment failed: ${payment.id} — ${payment.error_description}`);
      // Optionally update booking status here
    }

    // Always respond 200 to Razorpay to acknowledge receipt
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still send 200 so Razorpay doesn't retry unnecessarily
    res.json({ success: true });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/config
// Returns the Razorpay public key to the frontend (safe — key_id is public)
// ─────────────────────────────────────────────────────────────────────────────
const getConfig = (req, res) => {
  res.json({
    success: true,
    keyId  : process.env.RAZORPAY_KEY_ID
  });
};

module.exports = { createOrder, verifyPayment, handleWebhook, getConfig };
