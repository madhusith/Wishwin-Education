const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// GET /api/admin/stats (Step E1)
async function getAdminStats(req, res) {
  try {
    const [students] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = "STUDENT"'
    );
    const [teachers] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = "TEACHER"'
    );
    const [classes] = await pool.query(
      'SELECT COUNT(*) as count FROM classes WHERE status = "ACTIVE"'
    );
    const [announcements] = await pool.query(
      'SELECT COUNT(*) as count FROM announcements WHERE active = 1'
    );

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: students[0].count,
        totalTeachers: teachers[0].count,
        totalClasses: classes[0].count,
        activeAnnouncements: announcements[0].count,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats.',
    });
  }
}

// GET /api/admin/users (Step E2)
async function getUsers(req, res) {
  try {
    const { role, search, status } = req.query;

    let query = `
      SELECT id, first_name, last_name, email, phone, role, status, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role.toUpperCase());
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status.toUpperCase());
    }

    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((u) => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
}

// POST /api/admin/users (Step E2 - Admin can create teacher, admin, student, parent)
async function createUser(req, res) {
  try {
    const { firstName, lastName, email, phone, password, role, status = 'ACTIVE' } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName, email, password, and role are required.',
      });
    }

    const validRoles = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'];
    const normalizedRole = role.toUpperCase().trim();
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        passwordHash,
        normalizedRole,
        status.toUpperCase(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: `${normalizedRole} account created successfully.`,
      user: {
        id: result.insertId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role: normalizedRole,
        status: status.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user.',
    });
  }
}

// PUT /api/admin/users/:id
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, status, password } = req.body;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // If email is changing, check uniqueness
    if (email && email.toLowerCase().trim() !== existing[0].email) {
      const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [
        email.toLowerCase().trim(),
        id,
      ]);
      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email is already used by another account.',
        });
      }
    }

    let passwordHash = existing[0].password_hash;
    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    await pool.query(
      `UPDATE users 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           email = COALESCE(?, email),
           phone = ?,
           role = COALESCE(?, role),
           status = COALESCE(?, status),
           password_hash = ?
       WHERE id = ?`,
      [
        firstName ? firstName.trim() : null,
        lastName ? lastName.trim() : null,
        email ? email.toLowerCase().trim() : null,
        phone !== undefined ? (phone ? phone.trim() : null) : existing[0].phone,
        role ? role.toUpperCase() : null,
        status ? status.toUpperCase() : null,
        passwordHash,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user.',
    });
  }
}

// PATCH /api/admin/users/:id/status
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE or INACTIVE.',
      });
    }

    const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protect last admin from deactivating self if single admin
    if (req.user.id === parseInt(id, 10) && status.toUpperCase() === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrator account.',
      });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status.toUpperCase(), id]);

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status.toUpperCase()}.`,
      status: status.toUpperCase(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
}

// GET /api/admin/students (Quick student search for enrollment)
async function getStudentsList(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT id, first_name, last_name, email, phone FROM users WHERE role = "STUDENT" AND status = "ACTIVE"';
    const params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    query += ' ORDER BY first_name ASC, last_name ASC LIMIT 50';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      data: rows.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        phone: s.phone,
      })),
    });
  } catch (error) {
    console.error('Error fetching students list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students list.',
    });
  }
}

module.exports = {
  getAdminStats,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getStudentsList,
};
