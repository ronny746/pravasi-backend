const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Create order
router.post('/create-order', paymentController.createOrder);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Get payment history
router.get('/history/:userId', paymentController.getPaymentHistory);

// Check payment status
router.get('/status/:orderId', paymentController.checkPaymentStatus);

// Handle payment failure
router.post('/failure', paymentController.handlePaymentFailure);

module.exports = router;