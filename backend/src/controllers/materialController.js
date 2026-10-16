const { pool } = require('../config/database');
const { uploadMaterialFile, deleteMaterialFile } = require('../services/storageService');

// GET /api/materials (Step I2)
async function getMaterials(req, res) {
  try {
    const user = req.user;
    const { classId, topic, search } = req.query;

    let query = `
      SELECT 
        lm.id,
        lm.class_id,
        lm.title,
        lm.description,
        lm.topic,
        lm.file_url,
        lm.file_key,
        lm.file_type,
        lm.published,
        lm.created_by,
        lm.created_at,
        c.name AS class_name,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM learning_materials lm
      JOIN classes c ON lm.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON lm.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based Access Control (Step I5)
    if (user.role === 'STUDENT') {
      query += ` AND lm.published = 1 AND lm.class_id IN (
        SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'ACTIVE'
      )`;
      params.push(user.id);
    } else if (user.role === 'TEACHER') {
      query += ` AND (c.teacher_id = ? OR lm.created_by = ?)`;
      params.push(user.id, user.id);
    }

    if (classId) {
      query += ` AND lm.class_id = ?`;
      params.push(classId);
    }

    if (topic) {
      query += ` AND lm.topic = ?`;
      params.push(topic);
    }

    if (search) {
      query += ` AND (lm.title LIKE ? OR lm.topic LIKE ? OR lm.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY lm.created_at DESC`;

    const [rows] = await pool.query(query, params);

    // Format file URLs to full URL if local
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        id: r.id,
        classId: r.class_id,
        className: r.class_name,
        gradeName: r.grade_name,
        title: r.title,
        description: r.description,
        topic: r.topic,
        fileUrl: r.file_url.startsWith('http') ? r.file_url : `${baseUrl}${r.file_url}`,
        fileKey: r.file_key,
        fileType: r.file_type,
        published: Boolean(r.published),
        fileSizeFormatted: 'PDF Document',
        creatorName: r.creator_name,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning materials.',
    });
  }
}

// GET /api/materials/:id
async function getMaterialById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [rows] = await pool.query(
      `SELECT 
        lm.*,
        c.name AS class_name,
        c.teacher_id,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM learning_materials lm
      JOIN classes c ON lm.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON lm.created_by = u.id
      WHERE lm.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learning material not found.',
      });
    }

    const item = rows[0];

    // Authorization check
    if (user.role === 'STUDENT') {
      const [enrollment] = await pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = "ACTIVE"',
        [user.id, item.class_id]
      );
      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in this class.',
        });
      }
    } else if (user.role === 'TEACHER') {
      if (item.teacher_id !== user.id && item.created_by !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not manage this class.',
        });
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      data: {
        id: item.id,
        classId: item.class_id,
        className: item.class_name,
        gradeName: item.grade_name,
        title: item.title,
        description: item.description,
        topic: item.topic,
        fileUrl: item.file_url.startsWith('http') ? item.file_url : `${baseUrl}${item.file_url}`,
        fileKey: item.file_key,
        fileType: item.file_type,
        fileSizeBytes: item.file_size_bytes,
        fileSizeFormatted: formatBytes(item.file_size_bytes),
        creatorName: item.creator_name,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching material by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch material details.',
    });
  }
}

// POST /api/materials (Step I2 & I3)
async function createMaterial(req, res) {
  try {
    const user = req.user;
    const { classId, title, topic, description } = req.body;
    const file = req.file;

    if (!classId || !title) {
      return res.status(400).json({
        success: false,
        message: 'classId and title are required.',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF document file.',
      });
    }

    // Teacher assignment check (Step I3)
    if (user.role === 'TEACHER') {
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [classId, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only upload materials to classes assigned to you.',
        });
      }
    }

    // Upload to S3 or local storage
    const uploadResult = await uploadMaterialFile(file);

    const [result] = await pool.query(
      `INSERT INTO learning_materials (
        class_id, title, description, topic, file_url, file_key, file_type, published, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        classId,
        title.trim(),
        description ? description.trim() : null,
        topic ? topic.trim() : null,
        uploadResult.fileUrl,
        uploadResult.fileKey,
        file.mimetype || 'application/pdf',
        user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Learning material uploaded successfully.',
      materialId: result.insertId,
      fileUrl: uploadResult.fileUrl,
      sizeFormatted: formatBytes(uploadResult.sizeBytes),
    });
  } catch (error) {
    console.error('Error creating learning material:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload learning material.',
    });
  }
}

// DELETE /api/materials/:id
async function deleteMaterial(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM learning_materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learning material not found.',
      });
    }

    const item = existing[0];

    // Authorization check
    if (user.role === 'TEACHER' && item.created_by !== user.id) {
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [item.class_id, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete materials uploaded by you.',
        });
      }
    }

    // Delete file from S3 or local directory
    await deleteMaterialFile(item.file_key);

    await pool.query('DELETE FROM learning_materials WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Learning material deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting learning material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete learning material.',
    });
  }
}

// Helper to format byte sizes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  deleteMaterial,
};
