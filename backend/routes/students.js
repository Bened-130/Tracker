// backend/routes/students.js
// Routes for /api/students

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', authenticateToken, studentController.getStudents);
router.get('/:id', authenticateToken, studentController.getStudent);

// Protected routes (teachers and admins only)
router.post('/', 
    authenticateToken, 
    requireRole(['teacher', 'admin']), 
    studentController.registerStudent
);

router.delete('/:id', 
    authenticateToken, 
    requireRole(['admin']), 
    studentController.deleteStudent
);

module.exports = router;