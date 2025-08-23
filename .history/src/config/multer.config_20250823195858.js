const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthController = require('../controllers/auth.controller');

// Multer configuration inline
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'IMG-' + uniqueSuffix + fileExtension);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

const uploadSingle = upload.single('image');

// Error handling middleware
const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size allowed is 5MB',
        statusCode: 400
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file allowed at a time',
        statusCode: 400
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "image" as field name',
        statusCode: 400
      });
    }
  }
  
  if (error && error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (jpg, jpeg, png, gif, webp) are allowed',
      statusCode: 400
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error uploading file',
      statusCode: 400
    });
  }

  next();
};

// Authentication Routes

// Register user + generate OTP
router.post('/register', AuthController.register);

// Verify OTP after registration
router.post('/verify-otp', AuthController.verifyOtp);

// Resend OTP if not received or expired
router.post('/resend-otp', AuthController.resendOtp);

// Login with email or phone
router.post('/login', AuthController.login);

// Upload image with multer
router.post('/upload-image', uploadSingle, handleMulterErrors, AuthController.uploadImage);

// Update password
router.patch('/update-password', AuthController.updatePassword);

// Update user profile
router.patch('/profile/:userId', AuthController.updateProfile);

// Get user profile
router.get('/profile/:userId', AuthController.getProfile);

module.exports = router;