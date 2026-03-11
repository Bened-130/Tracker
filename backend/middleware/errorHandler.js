// backend/middleware/errorHandler.js
// Central error handling for all API routes

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    // JWT errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }

    // PostgreSQL unique violation (duplicate email, etc)
    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'Record already exists'
        });
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced record does not exist'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

// Wrapper for async functions
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };