const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getRecordings,
  getRecordingById,
  createRecording,
  updateRecording,
  deleteRecording,
} = require('../controllers/recordedLessonController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getRecordings);
router.get('/:id', getRecordingById);

// Teacher and Admin can create, edit, delete
router.post('/', requireRoles(['TEACHER', 'ADMIN']), createRecording);
router.put('/:id', requireRoles(['TEACHER', 'ADMIN']), updateRecording);
router.delete('/:id', requireRoles(['TEACHER', 'ADMIN']), deleteRecording);

module.exports = router;
