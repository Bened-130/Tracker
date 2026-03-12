// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

// ============================================
// JWT CONFIGURATION FROM ENVIRONMENT
// ============================================

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validate on load
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET not set!');
  process.exit(1);
}

const getSecret = () => JWT_SECRET || 'dev-secret-change-in-production';

// Middleware: Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, getSecret());
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware: Check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Generate token
const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
};

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
  JWT_EXPIRES_IN
};