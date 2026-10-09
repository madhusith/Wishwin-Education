const express = require('express');
const { authenticateToken, requireRole, requireRoles } = require('../middleware/authMiddleware');
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getGrades,
  getClassStudents,
  enrollStudent,
  removeStudent,
} = require('../controllers/classController');

const router = express.Router();

// Public / Authenticated class access
router.get('/', authenticateToken, getClasses);
router.get('/grades', authenticateToken, getGrades);
router.get('/:id', authenticateToken, getClassById);

// Admin-only class creation and modification
router.post('/', authenticateToken, requireRole('ADMIN'), createClass);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateClass);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteClass);

// Enrollment routes (Admin & Teacher view; Admin can enroll/remove)
router.get('/:id/students', authenticateToken, requireRoles(['ADMIN', 'TEACHER']), getClassStudents);
router.post('/:id/students', authenticateToken, requireRole('ADMIN'), enrollStudent);
router.delete('/:id/students/:studentId', authenticateToken, requireRole('ADMIN'), removeStudent);

module.exports = router;
