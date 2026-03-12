// backend/index.js
// Main entry point using Supabase Anon Key

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const { testConnection, getConnectionInfo, isRLSError } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const classRoutes = require('./routes/classes');
const reportRoutes = require('./routes/reports');

const app = express();

// ============================================
// ENVIRONMENT CONFIG
// ============================================

const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  SUPABASE_URL: process.env.SUPABASE_URL
};

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: ENV.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ============================================
// REQUEST LOGGING
// ============================================

if (ENV.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check with connection info
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  const info = getConnectionInfo();
  
  res.json({
    status: dbConnected ? 'healthy' : 'error',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    supabase: {
      connected: dbConnected,
      url: info.url,
      using: 'anon_key (RLS enforced)'
    },
    note: dbConnected ? null : 'Check RLS policies in Supabase dashboard'
  });
});

// Connection test with RLS info
app.get('/api/health/rls', async (req, res) => {
  try {
    const { supabase } = require('./config/database');
    
    // Test different operations
    const tests = {
      select: false,
      insert: false,
      update: false,
      delete: false
    };
    
    // Test SELECT
    try {
      const { data, error } = await supabase.from('students').select('student_id').limit(1);
      tests.select = !error;
    } catch (e) {
      tests.select = false;
    }
    
    res.json({
      rls_enabled: true,
      tests,
      message: 'Some operations may be blocked by RLS policies',
      fix_url: 'https://supabase.com/dashboard/project/_/database/policies'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'SchoolVibe AI Tracker API',
    version: '1.0.0',
    auth: 'Using Supabase Anon Key (RLS Enforced)',
    endpoints: {
      health: '/api/health',
      health_rls: '/api/health/rls',
      students: '/api/students',
      attendance: '/api/attendance',
      classes: '/api/classes',
      reports: '/api/reports'
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// LOCAL SERVER
// ============================================

if (ENV.NODE_ENV !== 'production') {
  app.listen(ENV.PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║  🎓 BENEDICT ACADEMY Tracker Backend                        ║
    ║                                                          ║
    ║  Environment: ${ENV.NODE_ENV.padEnd(20)}                   ║
    ║  Local:       http://localhost:${ENV.PORT}/api             ║
    ║  Health:      http://localhost:${ENV.PORT}/api/health      ║
    ║                                                          ║
    ║  ⚠️  Using ANON KEY - RLS policies are ENFORCED          ║
    ║  Make sure RLS policies allow your operations!           ║
    ╚══════════════════════════════════════════════════════════╝
    `);
    
    // Test connection on startup
    testConnection().then(connected => {
      if (!connected) {
        console.log('\n🔧 To fix RLS errors:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Database → RLS Policies');
        console.log('   4. Enable policies for your tables\n');
      }
    });
  });
}

module.exports = app;