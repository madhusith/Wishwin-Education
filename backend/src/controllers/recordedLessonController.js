const { pool } = require('../config/database');

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard YouTube URL formats
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

// GET /api/recordings
async function getRecordings(req, res) {
  try {
    const user = req.user;
    const { classId, topic, search } = req.query;

    let query = `
      SELECT 
        rl.id,
        rl.class_id,
        rl.title,
        rl.description,
        rl.youtube_url,
        rl.youtube_video_id,
        rl.topic,
        rl.published,
        rl.created_by,
        rl.created_at,
        c.name AS class_name,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM recorded_lessons rl
      JOIN classes c ON rl.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON rl.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Access control (Step H3)
    if (user.role === 'STUDENT') {
      // Only recordings for enrolled classes, and only published ones
      query += ` AND rl.published = 1 AND rl.class_id IN (
        SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'ACTIVE'
      )`;
      params.push(user.id);
    } else if (user.role === 'TEACHER') {
      // Only recordings for assigned classes or created by this teacher
      query += ` AND (c.teacher_id = ? OR rl.created_by = ?)`;
      params.push(user.id, user.id);
    }

    if (classId) {
      query += ` AND rl.class_id = ?`;
      params.push(classId);
    }

    if (topic) {
      query += ` AND rl.topic = ?`;
      params.push(topic);
    }

    if (search) {
      query += ` AND (rl.title LIKE ? OR rl.topic LIKE ? OR rl.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY rl.created_at DESC`;

    const [rows] = await pool.query(query, params);

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
        youtubeUrl: r.youtube_url,
        youtubeVideoId: r.youtube_video_id,
        thumbnailUrl: `https://img.youtube.com/vi/${r.youtube_video_id}/hqdefault.jpg`,
        topic: r.topic,
        published: Boolean(r.published),
        creatorName: r.creator_name,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching recorded lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recorded lessons.',
    });
  }
}

// GET /api/recordings/:id
async function getRecordingById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [rows] = await pool.query(
      `SELECT 
        rl.*,
        c.name AS class_name,
        c.teacher_id,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM recorded_lessons rl
      JOIN classes c ON rl.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON rl.created_by = u.id
      WHERE rl.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recorded lesson not found.',
      });
    }

    const item = rows[0];

    // Authorization check
    if (user.role === 'STUDENT') {
      const [enrollment] = await pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = "ACTIVE"',
        [user.id, item.class_id]
      );
      if (enrollment.length === 0 || !item.published) {
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

    return res.status(200).json({
      success: true,
      data: {
        id: item.id,
        classId: item.class_id,
        className: item.class_name,
        gradeName: item.grade_name,
        title: item.title,
        description: item.description,
        youtubeUrl: item.youtube_url,
        youtubeVideoId: item.youtube_video_id,
        thumbnailUrl: `https://img.youtube.com/vi/${item.youtube_video_id}/hqdefault.jpg`,
        topic: item.topic,
        published: Boolean(item.published),
        creatorName: item.creator_name,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching recording details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recording details.',
    });
  }
}

// POST /api/recordings (Step H1)
async function createRecording(req, res) {
  try {
    const user = req.user;
    const { classId, title, topic, description, youtubeUrl, published = true } = req.body;

    if (!classId || !title || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'classId, title, and youtubeUrl are required.',
      });
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL. Please provide a valid YouTube link (e.g., https://youtu.be/... or https://youtube.com/watch?v=...).',
      });
    }

    // If teacher, verify teacher assignment
    if (user.role === 'TEACHER') {
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [classId, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only add recordings to classes assigned to you.',
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO recorded_lessons (
        class_id, title, topic, description, youtube_url, youtube_video_id, published, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId,
        title.trim(),
        topic ? topic.trim() : null,
        description ? description.trim() : null,
        youtubeUrl.trim(),
        videoId,
        published ? 1 : 0,
        user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Recorded lesson published successfully.',
      recordingId: result.insertId,
      youtubeVideoId: videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch (error) {
    console.error('Error creating recorded lesson:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create recorded lesson.',
    });
  }
}

// PUT /api/recordings/:id
async function updateRecording(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { classId, title, topic, description, youtubeUrl, published } = req.body;

    const [existing] = await pool.query('SELECT * FROM recorded_lessons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recorded lesson not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [existing[0].class_id, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit recordings created by or assigned to you.',
        });
      }
    }

    let videoId = existing[0].youtube_video_id;
    if (youtubeUrl && youtubeUrl.trim() !== existing[0].youtube_url) {
      const extracted = extractYouTubeVideoId(youtubeUrl);
      if (!extracted) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL.',
        });
      }
      videoId = extracted;
    }

    await pool.query(
      `UPDATE recorded_lessons 
       SET class_id = COALESCE(?, class_id),
           title = COALESCE(?, title),
           topic = ?,
           description = ?,
           youtube_url = COALESCE(?, youtube_url),
           youtube_video_id = ?,
           published = COALESCE(?, published)
       WHERE id = ?`,
      [
        classId || null,
        title ? title.trim() : null,
        topic !== undefined ? (topic ? topic.trim() : null) : existing[0].topic,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        youtubeUrl ? youtubeUrl.trim() : null,
        videoId,
        published !== undefined ? (published ? 1 : 0) : null,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Recorded lesson updated successfully.',
      youtubeVideoId: videoId,
    });
  } catch (error) {
    console.error('Error updating recording:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update recorded lesson.',
    });
  }
}

// DELETE /api/recordings/:id
async function deleteRecording(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM recorded_lessons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recorded lesson not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete recordings created by you.',
      });
    }

    await pool.query('DELETE FROM recorded_lessons WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Recorded lesson deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete recorded lesson.',
    });
  }
}

module.exports = {
  extractYouTubeVideoId,
  getRecordings,
  getRecordingById,
  createRecording,
  updateRecording,
  deleteRecording,
};
