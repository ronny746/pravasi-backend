// app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

// Routes & Socket Handler
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const chatRoutes = require('./routes/chatRoutes');
const pushRoutes = require('./routes/pushRoute');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin-routes');
const audioRoutes = require('./routes/audio-route');

const { SocketHandler } = require('./config/socketHandler');

const app = express();

// ======================
// ✅ HTTPS Configuration (SSL Certificate ke liye)
// ======================
let server;
const useHTTPS = process.env.USE_HTTPS === 'true';

if (useHTTPS) {
  // SSL certificate files (Let's Encrypt se generate karein)
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
  };
  server = https.createServer(sslOptions, app);
  console.log('✅ HTTPS Server enabled');
} else {
  server = http.createServer(app);
  console.log('⚠️  HTTP Server (Use HTTPS for production)');
}

// ======================
// ✅ Socket.IO setup with Enhanced CORS
// ======================
const allowedOrigins = [
  "http://localhost:5173",
  "https://pravasi-one.vercel.app",
  "http://31.97.231.85",
  "https://31.97.231.85"
];

const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  }
});

// ======================
// ✅ Enhanced CORS Middleware for Express
// ======================
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Preflight requests ke liye
app.options('*', cors());

app.use(express.json());

// ======================
// ✅ Security Headers
// ======================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS redirect (agar HTTP request aaye)
  if (useHTTPS && req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  
  next();
});

// ======================
// ✅ MongoDB Connection
// ======================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/pravasi_chat';
    await mongoose.connect(mongoURI, { useNewUrlParser: true });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
connectDB();

// ======================
// ✅ Images Directory
// ======================
const imagesDir = path.join(__dirname, 'images');
app.use('/media', express.static(path.join(__dirname, 'media')));

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Images directory created:', imagesDir);
}

// Serve static images
app.use('/images', express.static(imagesDir));
app.use('/media', express.static(path.join(__dirname, 'media')));

// ======================
// ✅ Multer Configuration
// ======================
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

const uploadSingle = upload.single('image');

// ======================
// ✅ Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', pushRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/audio', audioRoutes);

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
      imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Chat image upload route
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
      imageUrl,
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
    connectedUsers: SocketHandler?.getConnectedUsersCount() || 0,
    protocol: req.protocol,
    secure: req.secure
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

// ======================
// ✅ Socket.IO Init
// ======================
SocketHandler.initializeSocket(io);

// ======================
// ✅ Global Error Handler
// ======================
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

// ======================
// ✅ 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ======================
// ✅ Export
// ======================
module.exports = { app, server, io };