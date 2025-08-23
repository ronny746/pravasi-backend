require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Create images directory at startup
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Images directory created:', imagesDir);
}

// Serve static images
app.use('/images', express.static(imagesDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `IMG-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 } // 5MB
});

// Single image upload middleware
const uploadSingle = upload.single('image');

// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Example route to upload image directly via app.js
app.post('/upload-image', uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      imageUrl: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    },
    statusCode: 200
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Pravasi API running' });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = '';
    switch (err.code) {
      case 'LIMIT_FILE_SIZE': message = 'File too large. Max 5MB'; break;
      case 'LIMIT_UNEXPECTED_FILE': message = 'Unexpected file field name. Use "image"'; break;
      default: message = 'Multer error';
    }
    return res.status(400).json({ success: false, message });
  }

  console.error('❌ Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
