const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/mark', attendanceController.markAttendance);
router.post('/manual', authenticateToken, requireRole(['teacher', 'admin']), attendanceController.manualAttendance);
router.get('/session/:session_id', authenticateToken, attendanceController.getSessionAttendance);
router.get('/student/:student_id', authenticateToken, attendanceController.getStudentAttendance);

module.exports = router;