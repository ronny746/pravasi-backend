const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `IMG-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Single file upload middleware
const uploadSingle = upload.single('image');

// Error handling middleware
const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Multer error';
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum allowed is 5MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Only 1 file allowed at a time';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "image" as field name';
        break;
    }
    return res.status(400).json({ success: false, message, statusCode: 400 });
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

module.exports = {
  uploadSingle,
  handleMulterErrors
};
