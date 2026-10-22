const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getChildSummary,
  getChildren,
  createChildAccount,
  updateChildEnrollments,
} = require('../controllers/parentController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoles(['PARENT', 'ADMIN']));

router.get('/child-summary', getChildSummary);
router.get('/children', getChildren);
router.post('/children', createChildAccount);
router.put('/children/:studentId/enrollments', updateChildEnrollments);

module.exports = router;
