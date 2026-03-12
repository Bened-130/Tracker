// backend/routes/reports.js
// Routes for /api/reports

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/daily/:session_id', reportController.getDailyReport);
router.get('/roster/:session_id', reportController.getRosterReport);
router.get('/monthly/:class_id', reportController.getMonthlyReport);

module.exports = router;