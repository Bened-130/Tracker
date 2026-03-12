// backend/routes/attendance.js
// Routes for /api/attendance

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Face recognition check-in (public for students)
router.post('/mark', attendanceController.markAttendance);

// Get attendance records (teachers only)
router.get('/session/:session_id', 
    authenticateToken, 
    attendanceController.getSessionAttendance
);

module.exports = router;