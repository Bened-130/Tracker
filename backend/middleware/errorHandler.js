// backend/middleware/errorHandler.js
// Central error handling for all API routes

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  // JWT errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  // JWT expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Please log in again'
    });
  }

  // PostgreSQL unique violation (duplicate email, etc)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Record already exists',
      detail: err.detail
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Referenced record does not exist'
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid data format'
    });
  }

  // Supabase specific errors
  if (err.message && err.message.includes('JWT')) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid authentication credentials'
    });
  }

  // Default error
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal server error';

  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Wrapper for async functions to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = { 
  errorHandler, 
  asyncHandler,
  notFound
};