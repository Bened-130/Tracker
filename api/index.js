// api/index.js
// Vercel serverless function entry point

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Import from backend folder (shared code)
const { testConnection, isRLSError } = require('../backend/config/database');
const { errorHandler } = require('../backend/middleware/errorHandler');

// Import routes from backend
const studentRoutes = require('../backend/routes/students');
const attendanceRoutes = require('../backend/routes/attendance');
const classRoutes = require('../backend/routes/classes');
const reportRoutes = require('../backend/routes/reports');

const app = express();

// ============================================
// MIDDLEWARE
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
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', retryAfter: 900 }
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
    status: dbConnected ? 'healthy' : 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: {
      connected: dbConnected,
      using: 'anon_key',
      rls_enforced: true
    }
  });
});

// Test RLS endpoint
app.get('/api/test-rls', async (req, res) => {
  const { supabase } = require('../backend/config/database');
  
  try {
    const { data, error } = await supabase
      .from('students')
      .select('student_id')
      .limit(1);
    
    if (error) {
      return res.status(403).json({
        error: 'RLS Error',
        message: error.message,
        hint: 'Enable SELECT policy for anon role in Supabase'
      });
    }
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);

// Root
app.get('/api', (req, res) => {
  res.json({
    name: 'SchoolVibe AI Tracker API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/test-rls',
      '/api/students',
      '/api/attendance',
      '/api/classes',
      '/api/reports'
    ]
  });
});

// Error handling
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Export for Vercel
module.exports = app;