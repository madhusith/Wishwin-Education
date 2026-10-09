const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();

// Allow optional/authenticated retrieval
router.get('/', authenticateToken, getAnnouncements);

// Protected mutations (Admin and Teacher)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'TEACHER']), createAnnouncement);
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'TEACHER']), updateAnnouncement);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN', 'TEACHER']), deleteAnnouncement);

module.exports = router;
