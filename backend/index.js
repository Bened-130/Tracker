// backend/index.js
// Main server entry point

require('dotenv').config(); // ← This loads your .env file

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
// CONFIGURATION FROM ENVIRONMENT
// ============================================

const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || '*'
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({
  origin: ENV.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: ENV.NODE_ENV
  });
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// START SERVER (Local development only)
// ============================================

if (ENV.NODE_ENV !== 'production') {
  app.listen(ENV.PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════╗
    ║  🎓 BENEDICT ACADEMY Tracker Backend              ║
    ║  Local: http://localhost:${ENV.PORT}/api          ║
    ╚════════════════════════════════════════════════╝
    `);
    testConnection();
  });
}

// Export for Vercel
module.exports = app;