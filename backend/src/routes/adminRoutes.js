const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getStudentsList,
} = require('../controllers/adminController');

const router = express.Router();

// Strict Admin-only routes
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/students', getStudentsList);

module.exports = router;
