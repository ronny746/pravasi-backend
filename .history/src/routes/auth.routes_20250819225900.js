const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');

// Register user + generate OTP
router.post('/register', AuthController.register);

// Verify OTP
router.post('/verify-otp', AuthController.verifyOtp);

router.post('/login', AuthController.login);
router.get('/profile/:userId', AuthController.getProfile);

module.exports = router;
