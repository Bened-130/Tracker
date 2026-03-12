// backend/middleware/auth.js
// JWT authentication (separate from Supabase Auth)

const jwt = require('jsonwebtoken');

// ============================================
// JWT CONFIG FROM ENVIRONMENT
// ============================================

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET not set in environment!');
  process.exit(1);
}

const getSecret = () => JWT_SECRET || 'dev-secret-not-for-production';

// Verify JWT token from Authorization header
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, getSecret());
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token Expired',
        message: 'Please log in again' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid Token',
      message: 'Token verification failed' 
    });
  }
};

// Check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Optional auth (sets user if token exists)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, getSecret());
      req.user = decoded;
    }
    
    next();
  } catch {
    next(); // Continue without user
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), { 
    expiresIn: JWT_EXPIRES_IN 
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  generateToken,
  JWT_EXPIRES_IN
};