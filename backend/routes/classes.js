// backend/routes/classes.js
// Routes for /api/classes

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', authenticateToken, classController.getClasses);
router.get('/today', authenticateToken, classController.getTodaySessions);
router.get('/:id', authenticateToken, classController.getClass);
router.get('/:class_id/sessions', authenticateToken, classController.getSessions);

// Protected routes (teachers and admins)
router.post('/', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  classController.createClass
);

router.post('/sessions', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  classController.createSession
);

module.exports = router;