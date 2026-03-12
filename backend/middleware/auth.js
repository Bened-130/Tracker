// backend/middleware/auth.js
// JWT authentication middleware for Vercel serverless

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Using default for development only!');
}

const getSecret = () => JWT_SECRET || 'dev-secret-change-in-production';

// Verify JWT token from Authorization header
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Access token required' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, getSecret());
    
    // Optional: Verify user still exists in database
    if (process.env.VERIFY_USER_EXISTS === 'true') {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, first_name, last_name')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'User no longer exists' 
        });
      }

      req.user = user;
    } else {
      req.user = decoded;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token Expired',
        message: 'Please log in again' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Invalid token' 
    });
  }
};

// Check user role(s)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: roles,
        current: userRole
      });
    }
    
    next();
  };
};

// Optional authentication (sets user if token exists, but doesn't require it)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, getSecret());
      req.user = decoded;
    }
    
    next();
  } catch {
    // Continue without user
    next();
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), { 
    expiresIn: JWT_EXPIRES_IN 
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    getSecret(), 
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  generateToken,
  generateRefreshToken
};