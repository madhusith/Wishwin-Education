const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getChildSummary,
  getChildren,
  createChildAccount,
} = require('../controllers/parentController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoles(['PARENT', 'ADMIN']));

router.get('/child-summary', getChildSummary);
router.get('/children', getChildren);
router.post('/children', createChildAccount);

module.exports = router;
