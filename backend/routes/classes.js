const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, classController.getClasses);
router.get('/:id', authenticateToken, classController.getClass);
router.post('/', authenticateToken, requireRole(['admin']), classController.createClass);
router.post('/sessions', authenticateToken, requireRole(['teacher', 'admin']), classController.createSession);

module.exports = router;