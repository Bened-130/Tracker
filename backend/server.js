// backend/server.js
// Main server entry point

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
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Stricter limit for face recognition
const faceRecognitionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: 'Face recognition rate limit exceeded'
});
app.use('/api/attendance/mark', faceRecognitionLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        version: '1.0.0'
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
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════╗
    ║                                                ║
    ║     🎓 SchoolVibe AI Tracker Backend           ║
    ║                                                ║
    ║     Server running on port ${PORT}                ║
    ║     Environment: ${process.env.NODE_ENV || 'development'}        ║
    ║                                                ║
    ╚════════════════════════════════════════════════╝
    `);
    
    testConnection();
});

module.exports = app;