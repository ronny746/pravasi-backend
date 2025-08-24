require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pravasi_chat';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

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

// Import Routes and Socket Handler
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chatRoutes');
const { SocketHandler } = require('./socket/socketHandler');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Image upload route
app.post('/upload-image', uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const imageUrl = `/images/${req.file.filename}`;
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

// Chat image upload route (for chat messages)
app.post('/api/chat/upload-image', uploadSingle, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: 'No image file uploaded' 
    });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  
  res.status(200).json({
    success: true,
    message: 'Chat image uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      imageUrl: imageUrl,
      localPath: `/images/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      messageType: 'image'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Pravasi Chat Server is healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    connectedUsers: SocketHandler?.getConnectedUsersCount() || 0
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pravasi API running',
    version: '1.0.0',
    features: ['Auth', 'Chat', 'File Upload'],
    endpoints: {
      auth: '/api/auth/*',
      chat: '/api/chat/*',
      health: '/health',
      imageUpload: '/upload-image',
      chatImageUpload: '/api/chat/upload-image'
    }
  });
});

// Initialize Socket.IO for Chat
SocketHandler.initializeSocket(io);

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = '';
    switch (err.code) {
      case 'LIMIT_FILE_SIZE': 
        message = 'File too large. Max 5MB'; 
        break;
      case 'LIMIT_UNEXPECTED_FILE': 
        message = 'Unexpected file field name. Use "image"'; 
        break;
      default: 
        message = 'Multer error';
    }
    return res.status(400).json({ success: false, message });
  }

  console.error('❌ Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log('🚀 Pravasi Chat Server Started Successfully!');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 HTTP: http://localhost:${PORT}`);
    console.log(`⚡ Socket.IO: ws://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/test`);
    console.log('===================================');
  });
};

startServer().catch(console.error);

module.exports = { app, server, io };