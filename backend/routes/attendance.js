// backend/routes/attendance.js
// Routes for /api/attendance

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

// Face recognition check-in (public for students, optional auth)
router.post('/mark', optionalAuth, attendanceController.markAttendance);

// Manual attendance marking (teachers only)
router.post('/manual', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  attendanceController.markManualAttendance
);

// Get attendance records (teachers only)
router.get('/session/:session_id', 
  authenticateToken, 
  attendanceController.getSessionAttendance
);

// Get student attendance history
router.get('/student/:student_id', 
  authenticateToken, 
  attendanceController.getStudentAttendance
);

module.exports = router;