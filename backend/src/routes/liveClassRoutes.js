const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  getLiveToken,
} = require('../controllers/liveClassController');

const router = express.Router();

// All live class endpoints require authentication
router.use(authenticateToken);

// Live class queries (Teacher sees assigned, student sees enrolled, admin sees all)
router.get('/', getLiveClasses);
router.get('/:id', getLiveClassById);

// Live token endpoint (Step G3: POST /api/live-classes/token or /api/live/token)
router.post('/token', getLiveToken);

// Teacher and Admin live class management (Step G1)
router.post('/', requireRoles(['TEACHER', 'ADMIN']), createLiveClass);
router.put('/:id', requireRoles(['TEACHER', 'ADMIN']), updateLiveClass);
router.delete('/:id', requireRoles(['TEACHER', 'ADMIN']), deleteLiveClass);

module.exports = router;
