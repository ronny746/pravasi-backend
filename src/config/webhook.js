// routes/webhook.js (or in app.js)
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const crypto = require('crypto');

router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body; // Buffer
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (expected !== signature) {
    console.warn('Webhook signature mismatch');
    return res.status(400).send('invalid signature');
  }

  const payload = JSON.parse(body.toString());
  // Example: handle payment.captured
  if (payload.event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount; // in paise

    const user = await User.findOne({ 'paymentInfo.orderId': orderId });
    if (user) {
      user.paymentInfo.status = 'paid';
      user.paymentInfo.paymentId = paymentId;
      user.paymentInfo.purchasedAt = new Date();
      // update history
      const idx = (user.paymentInfo.paymentHistory || []).findIndex(h => h.orderId === orderId);
      if (idx !== -1) {
        user.paymentInfo.paymentHistory[idx].status = 'paid';
        user.paymentInfo.paymentHistory[idx].paymentId = paymentId;
        user.paymentInfo.paymentHistory[idx].updatedAt = new Date();
      }
      user.isPaid = true;
      await user.save();
    }
  }

  // respond quickly
  res.json({ status: 'ok' });
});

module.exports = router;
