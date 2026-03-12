// backend/routes/reports.js
// Routes for /api/reports

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All report routes require authentication
router.use(authenticateToken);

// Daily report
router.get('/daily/:session_id', reportController.getDailyReport);

// Roster report
router.get('/roster/:session_id', reportController.getRosterReport);

// Monthly summary
router.get('/monthly/:class_id', reportController.getMonthlyReport);

// Student report
router.get('/student/:student_id', reportController.getStudentReport);

// Export to CSV
router.get('/export', requireRole(['teacher', 'admin']), reportController.exportReport);

module.exports = router;