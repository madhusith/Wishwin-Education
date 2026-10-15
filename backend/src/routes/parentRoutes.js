const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const { getChildSummary } = require('../controllers/parentController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoles(['PARENT', 'ADMIN']));

router.get('/child-summary', getChildSummary);

module.exports = router;
