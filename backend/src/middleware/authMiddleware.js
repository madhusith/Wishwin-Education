const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token from Authorization header
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wishwin_lms_super_secure_phase1_secret_key_2026');
    
    // Verify user exists and is ACTIVE
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0 || rows[0].status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or account is inactive.',
      });
    }

    req.user = {
      id: rows[0].id,
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      email: rows[0].email,
      role: rows[0].role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

// Require a single role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires ${role} role.`,
      });
    }
    next();
  };
}

// Require one of multiple roles
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requireRoles,
};
