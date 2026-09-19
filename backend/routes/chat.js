const express = require('express');
const router = express.Router();
const axios = require('axios').default;

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const response = await axios.post(`${process.env.AI_API_URL}/chat`, {
      message: message.trim(),
      history: history || []
    }, { timeout: 30000 });

    res.json({ success: true, reply: response.data.reply });
  } catch (error) {
    console.error('Chat proxy error:', error.message);
    // Graceful fallback if AI service is unavailable
    res.json({
      success: true,
      reply: "I'm currently unavailable. Please contact us at 9515651718 or visit us at Radham Center, near Bank of India, Sriramnagar, Samalkot, Andhra Pradesh. We're open every day from 10 AM to 7 PM."
    });
  }
});

module.exports = router;
