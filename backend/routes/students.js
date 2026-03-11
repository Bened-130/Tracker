const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, studentController.getStudents);
router.get('/:id', authenticateToken, studentController.getStudent);
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), studentController.registerStudent);
router.put('/:id', authenticateToken, requireRole(['teacher', 'admin']), studentController.updateStudent);
router.put('/:id/face', authenticateToken, requireRole(['teacher', 'admin']), studentController.updateFaceDescriptors);
router.delete('/:id', authenticateToken, requireRole(['admin']), studentController.deleteStudent);

module.exports = router;