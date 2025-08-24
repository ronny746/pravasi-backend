const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { uploadSingle, handleMulterErrors } = require('../config/multer.config');

// Authentication Routes

// Register user + generate OTP
router.post('/register', AuthController.register);

// Verify OTP after registration
router.post('/verify-otp', AuthController.verifyOtp);

// Resend OTP if not received or expired
router.post('/resend-otp', AuthController.resendOtp);

// Login with email or phone
router.post('/login', AuthController.login);



// Update password
router.patch('/update-password', AuthController.updatePassword);

// Update user profile
router.patch('/profile/:userId', AuthController.updateProfile);

// Get user profile
router.get('/profile/:userId', AuthController.getProfile);

router.get('/users', AuthController.getAllUsers);


module.exports = router;