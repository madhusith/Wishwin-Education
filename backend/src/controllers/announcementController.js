const { pool } = require('../config/database');

// GET /api/announcements
// Returns active announcements tailored to the current user's role and classes
async function getAnnouncements(req, res) {
  try {
    const user = req.user; // Set by authenticateToken
    const { classId } = req.query;

    let query = `
      SELECT 
        a.id,
        a.title,
        a.message,
        a.priority,
        a.target_type,
        a.target_class_id,
        a.active,
        a.start_date,
        a.end_date,
        a.created_by,
        a.created_at,
        c.name AS class_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM announcements a
      LEFT JOIN classes c ON a.target_class_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.active = 1
        AND (a.start_date IS NULL OR a.start_date <= CURDATE())
        AND (a.end_date IS NULL OR a.end_date >= CURDATE())
    `;

    const queryParams = [];

    // Filter by role if authenticated
    if (user && user.role !== 'ADMIN') {
      if (user.role === 'STUDENT') {
        // Enrolled class IDs for student
        const [enrollmentRows] = await pool.query(
          'SELECT class_id FROM enrollments WHERE student_id = ? AND status = "ACTIVE"',
          [user.id]
        );
        const enrolledClassIds = enrollmentRows.map((r) => r.class_id);

        if (enrolledClassIds.length > 0) {
          query += ` AND (a.target_type IN ('ALL', 'STUDENTS') OR (a.target_type = 'CLASS' AND a.target_class_id IN (?)))`;
          queryParams.push(enrolledClassIds);
        } else {
          query += ` AND a.target_type IN ('ALL', 'STUDENTS')`;
        }
      } else if (user.role === 'TEACHER') {
        const [teacherClasses] = await pool.query(
          'SELECT id FROM classes WHERE teacher_id = ? AND status = "ACTIVE"',
          [user.id]
        );
        const assignedClassIds = teacherClasses.map((r) => r.id);

        if (assignedClassIds.length > 0) {
          query += ` AND (a.target_type IN ('ALL', 'TEACHERS') OR (a.target_type = 'CLASS' AND a.target_class_id IN (?)))`;
          queryParams.push(assignedClassIds);
        } else {
          query += ` AND a.target_type IN ('ALL', 'TEACHERS')`;
        }
      } else if (user.role === 'PARENT') {
        query += ` AND a.target_type IN ('ALL', 'PARENTS')`;
      }
    }

    if (classId) {
      query += ` AND (a.target_class_id = ? OR a.target_type = 'ALL')`;
      queryParams.push(classId);
    }

    query += ` ORDER BY FIELD(a.priority, 'URGENT', 'IMPORTANT', 'NORMAL'), a.created_at DESC`;

    const [rows] = await pool.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        priority: row.priority,
        target_type: row.target_type,
        target_class_id: row.target_class_id,
        className: row.class_name,
        creatorName: row.creator_name,
        active: Boolean(row.active),
        start_date: row.start_date,
        end_date: row.end_date,
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements.',
    });
  }
}

// POST /api/announcements (Step F1)
async function createAnnouncement(req, res) {
  try {
    const user = req.user;
    const { title, message, priority = 'NORMAL', target_type = 'ALL', target_class_id, start_date, end_date } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required.',
      });
    }

    // Role checks
    if (user.role === 'TEACHER') {
      if (target_type !== 'CLASS' || !target_class_id) {
        return res.status(403).json({
          success: false,
          message: 'Teachers can only post announcements for their assigned classes.',
        });
      }

      // Verify teacher is assigned to this class
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [target_class_id, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only post announcements to classes assigned to you.',
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO announcements (title, message, priority, target_type, target_class_id, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        message.trim(),
        priority,
        target_type,
        target_class_id || null,
        start_date || null,
        end_date || null,
        user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully.',
      announcementId: result.insertId,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement.',
    });
  }
}

// PUT /api/announcements/:id
async function updateAnnouncement(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, message, priority, target_type, target_class_id, active, start_date, end_date } = req.body;

    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    // Teacher check
    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit announcements created by you.',
      });
    }

    await pool.query(
      `UPDATE announcements 
       SET title = COALESCE(?, title),
           message = COALESCE(?, message),
           priority = COALESCE(?, priority),
           target_type = COALESCE(?, target_type),
           target_class_id = ?,
           active = COALESCE(?, active),
           start_date = ?,
           end_date = ?
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : null,
        message !== undefined ? message.trim() : null,
        priority || null,
        target_type || null,
        target_class_id !== undefined ? target_class_id : existing[0].target_class_id,
        active !== undefined ? (active ? 1 : 0) : null,
        start_date !== undefined ? start_date : existing[0].start_date,
        end_date !== undefined ? end_date : existing[0].end_date,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement.',
    });
  }
}

// DELETE /api/announcements/:id
async function deleteAnnouncement(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete announcements created by you.',
      });
    }

    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement.',
    });
  }
}

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
