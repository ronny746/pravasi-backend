const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');

// Authentication Routes

// Register user + generate OTP
router.post('/register', AuthController.register);

// Verify OTP after registration
router.post('/verify-otp', AuthController.verifyOtp);

// Resend OTP if not received or expired
router.post('/resend-otp', AuthController.resendOtp);

// Login with email or phone
router.post('/login', AuthController.login);

// Get user profile
router.get('/profile/:userId', AuthController.getProfile);

module.exports = router;