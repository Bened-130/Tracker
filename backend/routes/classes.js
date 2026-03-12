// backend/routes/classes.js
// Routes for /api/classes

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, classController.getClasses);
router.post('/sessions', 
    authenticateToken, 
    requireRole(['teacher', 'admin']), 
    classController.createSession
);

module.exports = router;