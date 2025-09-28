// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment); // New route for verification
router.get('/history/:userId', paymentController.getPaymentHistory);

module.exports = router;