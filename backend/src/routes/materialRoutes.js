const express = require('express');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const { uploadPdf } = require('../middleware/uploadMiddleware');
const {
  getMaterials,
  getMaterialById,
  createMaterial,
  deleteMaterial,
} = require('../controllers/materialController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMaterials);
router.get('/:id', getMaterialById);

// Teacher and Admin can upload PDF materials
router.post(
  '/',
  requireRoles(['TEACHER', 'ADMIN']),
  uploadPdf.single('file'),
  createMaterial
);

// Teacher and Admin can delete materials
router.delete('/:id', requireRoles(['TEACHER', 'ADMIN']), deleteMaterial);

module.exports = router;
