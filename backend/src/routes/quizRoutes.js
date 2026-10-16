const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublishQuiz,
  submitQuiz,
  getQuizAttempts,
  getMyLatestAttempt,
} = require('../controllers/quizController');

const router = express.Router();

router.use(authenticateToken);

// Common read routes
router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.get('/:id/attempts', getQuizAttempts);

// Student submit & review routes
router.post('/:id/submit', requireRoles(['STUDENT']), submitQuiz);
router.get('/:id/my-attempt', requireRoles(['STUDENT']), getMyLatestAttempt);

// Teacher & Admin management routes
router.post('/', requireRoles(['TEACHER', 'ADMIN']), createQuiz);
router.put('/:id', requireRoles(['TEACHER', 'ADMIN']), updateQuiz);
router.delete('/:id', requireRoles(['TEACHER', 'ADMIN']), deleteQuiz);
router.patch('/:id/publish', requireRoles(['TEACHER', 'ADMIN']), togglePublishQuiz);

module.exports = router;
