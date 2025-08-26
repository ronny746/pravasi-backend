const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { uploadSingle, handleMulterErrors } = require('../config/multer.config');

// Authentication Routes

// Send OTP to phone number (replaces register)
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP after registration
router.post('/verify-otp', AuthController.verifyOtp);

// Resend OTP if not received or expired
router.post('/resend-otp', AuthController.resendOtp);

// Login with email or phone
router.post('/login', AuthController.login);

// Logout user
router.post('/logout', AuthController.logout);

// Upload image
router.post('/upload-image', uploadSingle, handleMulterErrors, AuthController.uploadImage);

// Update password
// router.patch('/update-password', AuthController.updatePassword);

// Update user profile
router.patch('/profile/:userId', AuthController.updateProfile);

// Get user profile
router.get('/profile/:userId', AuthController.getProfile);

// Get all users (admin route)
router.get('/users', AuthController.getAllUsers);

module.exports = router;