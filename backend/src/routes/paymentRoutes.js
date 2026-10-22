const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const {
  getPaymentStatus,
  processMockPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticateToken);

// Accessible by PARENT, STUDENT, ADMIN
router.use(requireRoles(['PARENT', 'STUDENT', 'ADMIN']));

router.get('/status/:studentId', getPaymentStatus);
router.get('/history/:studentId', getPaymentHistory);
router.post('/mock-charge', processMockPayment);

module.exports = router;
