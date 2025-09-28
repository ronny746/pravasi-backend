const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Create order
router.post('/create-order', paymentController.createOrder);

// Verify webhook from Cashfree
router.post('/webhook', paymentController.webhookHandler);

// Get user payment history
router.get('/history/:userId', paymentController.getPaymentHistory);

module.exports = router;
