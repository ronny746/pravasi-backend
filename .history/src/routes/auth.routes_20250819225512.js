const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');

// Register user + generate OTP
router.post('/register', AuthController.register);

// Verify OTP
router.post('/verify-otp', AuthController.verifyOtp);

module.exports = router;
