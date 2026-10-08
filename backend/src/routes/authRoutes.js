const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Authenticated current user endpoint
router.get('/me', authenticateToken, getMe);

module.exports = router;
