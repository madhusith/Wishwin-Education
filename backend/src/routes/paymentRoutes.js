const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const { uploadReceipt } = require('../middleware/uploadMiddleware');
const {
  getPaymentStatus,
  processMockPayment,
  getPaymentHistory,
  getAllPaymentsAdmin,
  approvePaymentAdmin,
  rejectPaymentAdmin,
} = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticateToken);

// Admin-only endpoints
router.get('/admin/all', requireRoles(['ADMIN']), getAllPaymentsAdmin);
router.put('/admin/:id/approve', requireRoles(['ADMIN']), approvePaymentAdmin);
router.put('/admin/:id/reject', requireRoles(['ADMIN']), rejectPaymentAdmin);

// Accessible by PARENT, STUDENT, ADMIN
router.use(requireRoles(['PARENT', 'STUDENT', 'ADMIN']));

router.get('/status/:studentId', getPaymentStatus);
router.get('/history/:studentId', getPaymentHistory);
router.post('/mock-charge', uploadReceipt.single('receipt'), processMockPayment);

module.exports = router;
