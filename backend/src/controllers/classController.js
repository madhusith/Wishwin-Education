const { pool } = require('../config/database');

// GET /api/classes (Step E3)
async function getClasses(req, res) {
  try {
    const user = req.user;
    const { gradeId, status } = req.query;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.status,
        c.grade_id,
        g.name AS grade_name,
        c.teacher_id,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS student_count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If teacher, only show assigned classes (Step E4)
    if (user && user.role === 'TEACHER') {
      query += ` AND c.teacher_id = ?`;
      params.push(user.id);
    }

    if (gradeId) {
      query += ` AND c.grade_id = ?`;
      params.push(gradeId);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY g.id ASC, c.name ASC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        gradeId: r.grade_id,
        gradeName: r.grade_name,
        teacherId: r.teacher_id,
        teacherName: r.teacher_first_name ? `${r.teacher_first_name} ${r.teacher_last_name}` : 'Unassigned',
        teacherEmail: r.teacher_email || null,
        studentCount: parseInt(r.student_count || 0, 10),
      })),
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch classes.',
    });
  }
}

// GET /api/classes/:id
async function getClassById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.description,
        c.status,
        c.grade_id,
        g.name AS grade_name,
        c.teacher_id,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    const r = rows[0];
    return res.status(200).json({
      success: true,
      data: {
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        gradeId: r.grade_id,
        gradeName: r.grade_name,
        teacherId: r.teacher_id,
        teacherName: r.teacher_first_name ? `${r.teacher_first_name} ${r.teacher_last_name}` : 'Unassigned',
        teacherEmail: r.teacher_email,
      },
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch class details.',
    });
  }
}

// POST /api/classes (Step E3)
async function createClass(req, res) {
  try {
    const { gradeId, name, teacherId, description, status = 'ACTIVE' } = req.body;

    if (!gradeId || !name) {
      return res.status(400).json({
        success: false,
        message: 'gradeId and class name are required.',
      });
    }

    // Verify grade exists
    const [gradeRows] = await pool.query('SELECT id FROM grades WHERE id = ?', [gradeId]);
    if (gradeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gradeId.',
      });
    }

    // If teacherId provided, verify user is TEACHER
    if (teacherId) {
      const [teacherRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [teacherId]);
      if (teacherRows.length === 0 || teacherRows[0].role !== 'TEACHER') {
        return res.status(400).json({
          success: false,
          message: 'Specified teacherId does not exist or is not a TEACHER.',
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO classes (grade_id, name, teacher_id, description, status)
       VALUES (?, ?, ?, ?, ?)`,
      [gradeId, name.trim(), teacherId || null, description ? description.trim() : null, status.toUpperCase()]
    );

    return res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      classId: result.insertId,
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create class.',
    });
  }
}

// PUT /api/classes/:id (Step E3, E4)
async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const { gradeId, name, teacherId, description, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM classes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    if (gradeId) {
      const [gradeRows] = await pool.query('SELECT id FROM grades WHERE id = ?', [gradeId]);
      if (gradeRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid gradeId.' });
      }
    }

    if (teacherId !== undefined && teacherId !== null) {
      const [teacherRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [teacherId]);
      if (teacherRows.length === 0 || teacherRows[0].role !== 'TEACHER') {
        return res.status(400).json({
          success: false,
          message: 'Specified teacherId does not exist or is not a TEACHER.',
        });
      }
    }

    await pool.query(
      `UPDATE classes 
       SET grade_id = COALESCE(?, grade_id),
           name = COALESCE(?, name),
           teacher_id = ?,
           description = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        gradeId || null,
        name ? name.trim() : null,
        teacherId !== undefined ? teacherId : existing[0].teacher_id,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        status ? status.toUpperCase() : null,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully.',
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update class.',
    });
  }
}

// DELETE /api/classes/:id
async function deleteClass(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM classes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    await pool.query('DELETE FROM classes WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete class.',
    });
  }
}

// GET /api/grades
async function getGrades(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, description FROM grades ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch grades.',
    });
  }
}

// GET /api/classes/:id/students (Step E5)
async function getClassStudents(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check teacher authorization
    if (user.role === 'TEACHER') {
      const [classRows] = await pool.query('SELECT id FROM classes WHERE id = ? AND teacher_id = ?', [id, user.id]);
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only view students for your assigned classes.',
        });
      }
    }

    const [students] = await pool.query(
      `SELECT 
        e.id AS enrollment_id,
        e.status AS enrollment_status,
        e.enrolled_at,
        u.id AS student_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.first_name ASC, u.last_name ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students.map((s) => ({
        enrollmentId: s.enrollment_id,
        enrollmentStatus: s.enrollment_status,
        enrolledAt: s.enrolled_at,
        studentId: s.student_id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        phone: s.phone,
      })),
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch class students.',
    });
  }
}

// POST /api/classes/:id/students (Step E5 - Enroll student)
async function enrollStudent(req, res) {
  try {
    const { id } = req.params; // class_id
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required.',
      });
    }

    // Check student existence
    const [userRows] = await pool.query('SELECT id, role, status FROM users WHERE id = ?', [studentId]);
    if (userRows.length === 0 || userRows[0].role !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'User is not a valid student.',
      });
    }

    // Check if class exists
    const [classRows] = await pool.query('SELECT id, name FROM classes WHERE id = ?', [id]);
    if (classRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    // Insert or activate enrollment
    await pool.query(
      `INSERT INTO enrollments (student_id, class_id, status)
       VALUES (?, ?, 'ACTIVE')
       ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
      [studentId, id]
    );

    return res.status(201).json({
      success: true,
      message: 'Student enrolled in class successfully.',
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll student.',
    });
  }
}

// DELETE /api/classes/:id/students/:studentId (Step E5 - Remove student)
async function removeStudent(req, res) {
  try {
    const { id, studentId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM enrollments WHERE class_id = ? AND student_id = ?',
      [id, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student enrollment not found in this class.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student removed from class successfully.',
    });
  } catch (error) {
    console.error('Error removing student from class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove student.',
    });
  }
}

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getGrades,
  getClassStudents,
  enrollStudent,
  removeStudent,
};
