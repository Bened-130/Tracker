// backend/index.js
// Main entry point for Vercel serverless deployment

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const classRoutes = require('./routes/classes');
const reportRoutes = require('./routes/reports');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP', retryAfter: 900 }
});
app.use('/api/', limiter);

// Stricter limit for face recognition
const faceRecognitionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Face recognition rate limit exceeded', retryAfter: 60 }
});
app.use('/api/attendance/mark', faceRecognitionLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ============================================
// REQUEST LOGGING (Development)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'SchoolVibe AI Tracker API',
    version: '1.0.0',
    endpoints: {
      students: '/api/students',
      attendance: '/api/attendance',
      classes: '/api/classes',
      reports: '/api/reports',
      health: '/api/health'
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// LOCAL DEVELOPMENT SERVER
// ============================================
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════╗
    ║                                                ║
    ║     🎓 BENEDICT ACADEMY Backend           ║
    ║                                                ║
    ║     Local: http://localhost:${PORT}/api          ║
    ║     Health: http://localhost:${PORT}/api/health  ║
    ║                                                ║
    ╚════════════════════════════════════════════════╝
    `);