const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'wishwin_lms_super_secure_phase1_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token helper
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/register (Step C1)
async function register(req, res) {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields (firstName, lastName, email, password, role) are required.',
      });
    }

    // 2. Validate role - Public registration allowed ONLY for STUDENT or PARENT
    const normalizedRole = role.toUpperCase().trim();
    if (!['STUDENT', 'PARENT'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Public registration is only permitted for STUDENT and PARENT roles.',
      });
    }

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 4. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 5. Check if email already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 6. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 7. Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, passwordHash, normalizedRole]
    );

    const userId = result.insertId;
    const token = generateToken(userId, normalizedRole);

    const userPayload = {
      id: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      role: normalizedRole,
    };

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
}

// POST /api/auth/login (Step C2)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Fetch user
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash, role, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
}

// GET /api/auth/me (Step C4)
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
};
