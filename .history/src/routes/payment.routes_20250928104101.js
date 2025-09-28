const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');

router.post('/create-order', controller.createOrder);
router.post('/verify-payment', controller.verifyPayment);
router.get('/history/:userId', controller.getPaymentHistory);
router.get('/order/:orderId', controller.getOrderStatus);
router.post('/refund/:paymentId', controller.refundPayment);

module.exports = router;
