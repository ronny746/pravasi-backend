require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const path = require('path');
// const fs = require('fs');

const app = express();

// Create images directory at startup
// const imagesDir = path.join(__dirname, 'images');
// if (!fs.existsSync(imagesDir)) {
//   fs.mkdirSync(imagesDir, { recursive: true });
//   console.log('✅ Images directory created:', imagesDir);
// } else {
//   console.log('✅ Images directory exists:', imagesDir);
// }

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from images directory
// app.use('/images', express.static(path.join(__dirname, 'images')));
console.log('✅ Static images route configured: /images');

// Routes
const authRoutes = require('.route');
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pravasi API running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      images: '/images'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    imagesDir: imagesDir
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

module.exports = app;