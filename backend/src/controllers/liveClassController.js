const { AccessToken } = require('livekit-server-sdk');
const { pool } = require('../config/database');

// GET /api/live-classes
async function getLiveClasses(req, res) {
  try {
    const user = req.user;
    const { classId, status, date } = req.query;

    let query = `
      SELECT 
        lc.id,
        lc.class_id,
        lc.title,
        lc.description,
        lc.provider,
        lc.meeting_url,
        lc.room_name,
        lc.scheduled_date,
        lc.start_time,
        lc.end_time,
        lc.status,
        lc.created_by,
        lc.created_at,
        c.name AS class_name,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        u.email AS teacher_email
      FROM live_classes lc
      JOIN classes c ON lc.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON lc.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility
    if (user.role === 'STUDENT') {
      // Must be enrolled in the class (Step G2)
      query += ` AND lc.class_id IN (
        SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'ACTIVE'
      )`;
      params.push(user.id);
    } else if (user.role === 'TEACHER') {
      // Must be assigned teacher or creator (Step G1)
      query += ` AND (c.teacher_id = ? OR lc.created_by = ?)`;
      params.push(user.id, user.id);
    }

    if (classId) {
      query += ` AND lc.class_id = ?`;
      params.push(classId);
    }

    if (status) {
      query += ` AND lc.status = ?`;
      params.push(status.toUpperCase());
    }

    if (date) {
      query += ` AND lc.scheduled_date = ?`;
      params.push(date);
    }

    // Order: Live classes first, then upcoming scheduled dates ascending
    query += ` ORDER BY 
      CASE lc.status 
        WHEN 'LIVE' THEN 1 
        WHEN 'SCHEDULED' THEN 2 
        WHEN 'COMPLETED' THEN 3 
        ELSE 4 
      END,
      lc.scheduled_date ASC, 
      lc.start_time ASC`;

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
        provider: r.provider,
        meetingUrl: r.meeting_url,
        roomName: r.room_name,
        scheduledDate: r.scheduled_date,
        startTime: r.start_time,
        endTime: r.end_time,
        status: r.status,
        teacherName: r.teacher_name,
        teacherEmail: r.teacher_email,
        createdBy: r.created_by,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes.',
    });
  }
}

// GET /api/live-classes/:id
async function getLiveClassById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [rows] = await pool.query(
      `SELECT 
        lc.id,
        lc.class_id,
        lc.title,
        lc.description,
        lc.provider,
        lc.meeting_url,
        lc.room_name,
        lc.scheduled_date,
        lc.start_time,
        lc.end_time,
        lc.status,
        lc.created_by,
        c.name AS class_name,
        c.teacher_id,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
      FROM live_classes lc
      JOIN classes c ON lc.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON lc.created_by = u.id
      WHERE lc.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found.',
      });
    }

    const item = rows[0];

    // Authorization check
    if (user.role === 'STUDENT') {
      const [enrolled] = await pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = "ACTIVE"',
        [user.id, item.class_id]
      );
      if (enrolled.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class.',
        });
      }
    } else if (user.role === 'TEACHER') {
      if (item.teacher_id !== user.id && item.created_by !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this class.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching live class by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live class details.',
    });
  }
}

// POST /api/live-classes (Step G1)
async function createLiveClass(req, res) {
  try {
    const user = req.user;
    const {
      classId,
      title,
      description,
      provider = 'LIVEKIT',
      meetingUrl,
      roomName,
      scheduledDate,
      startTime,
      endTime,
      status = 'SCHEDULED',
    } = req.body;

    if (!classId || !title || !scheduledDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'classId, title, scheduledDate, startTime, and endTime are required.',
      });
    }

    // Verify teacher assignment if user is TEACHER
    if (user.role === 'TEACHER') {
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [classId, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only schedule live classes for classes assigned to you.',
        });
      }
    }

    // Auto-generate room name for LiveKit if not provided
    const resolvedRoomName =
      provider === 'LIVEKIT'
        ? roomName && roomName.trim()
          ? roomName.trim()
          : `wishwin-room-${classId}-${Date.now().toString().slice(-6)}`
        : null;

    const [result] = await pool.query(
      `INSERT INTO live_classes (
        class_id, title, description, provider, meeting_url, room_name, 
        scheduled_date, start_time, end_time, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId,
        title.trim(),
        description ? description.trim() : null,
        provider.toUpperCase(),
        meetingUrl ? meetingUrl.trim() : null,
        resolvedRoomName,
        scheduledDate,
        startTime,
        endTime,
        status.toUpperCase(),
        user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Live class scheduled successfully.',
      liveClassId: result.insertId,
      roomName: resolvedRoomName,
    });
  } catch (error) {
    console.error('Error creating live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create live class.',
    });
  }
}

// PUT /api/live-classes/:id
async function updateLiveClass(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      title,
      description,
      provider,
      meetingUrl,
      roomName,
      scheduledDate,
      startTime,
      endTime,
      status,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM live_classes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      // Check if teacher is assigned to class
      const [classRows] = await pool.query(
        'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
        [existing[0].class_id, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit live classes created by or assigned to you.',
        });
      }
    }

    await pool.query(
      `UPDATE live_classes 
       SET title = COALESCE(?, title),
           description = ?,
           provider = COALESCE(?, provider),
           meeting_url = ?,
           room_name = ?,
           scheduled_date = COALESCE(?, scheduled_date),
           start_time = COALESCE(?, start_time),
           end_time = COALESCE(?, end_time),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        provider ? provider.toUpperCase() : null,
        meetingUrl !== undefined ? (meetingUrl ? meetingUrl.trim() : null) : existing[0].meeting_url,
        roomName !== undefined ? (roomName ? roomName.trim() : null) : existing[0].room_name,
        scheduledDate || null,
        startTime || null,
        endTime || null,
        status ? status.toUpperCase() : null,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Live class updated successfully.',
    });
  } catch (error) {
    console.error('Error updating live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update live class.',
    });
  }
}

// DELETE /api/live-classes/:id
async function deleteLiveClass(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM live_classes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete live classes created by you.',
      });
    }

    await pool.query('DELETE FROM live_classes WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Live class deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete live class.',
    });
  }
}

// POST /api/live/token (Step G3 - Generate LiveKit token / Zoom meeting launcher)
async function getLiveToken(req, res) {
  try {
    const user = req.user;
    const { liveClassId } = req.body;

    if (!liveClassId) {
      return res.status(400).json({
        success: false,
        message: 'liveClassId is required.',
      });
    }

    const [rows] = await pool.query(
      `SELECT lc.*, c.name as class_name, c.teacher_id
       FROM live_classes lc
       JOIN classes c ON lc.class_id = c.id
       WHERE lc.id = ?`,
      [liveClassId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found.',
      });
    }

    const lc = rows[0];

    // Check enrollment for students
    if (user.role === 'STUDENT') {
      const [enrollment] = await pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = "ACTIVE"',
        [user.id, lc.class_id]
      );
      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in this academic class.',
        });
      }
    }

    // Step G4: Zoom fallback or custom URL
    if (lc.provider === 'ZOOM' || (lc.provider === 'OTHER' && lc.meeting_url)) {
      return res.status(200).json({
        success: true,
        provider: 'ZOOM',
        meetingUrl: lc.meeting_url,
        title: lc.title,
        className: lc.class_name,
      });
    }

    // Step G3: LiveKit Provider flow
    const roomName = lc.room_name || `wishwin-room-${lc.class_id}`;
    const participantIdentity = `user_${user.id}_${user.firstName}_${user.lastName}`;
    const participantName = `${user.firstName} ${user.lastName}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'wss://demo.livekit.cloud';

    if (apiKey && apiSecret) {
      // Real LiveKit Access Token generation
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantIdentity,
        name: participantName,
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: ['TEACHER', 'ADMIN'].includes(user.role),
        canPublishData: true,
        canSubscribe: true,
      });

      const token = await at.toJwt();

      return res.status(200).json({
        success: true,
        provider: 'LIVEKIT',
        token,
        roomName,
        serverUrl: livekitUrl,
        title: lc.title,
        className: lc.class_name,
      });
    }

    // Sandbox / Development fallback if API keys are pending
    return res.status(200).json({
      success: true,
      provider: 'LIVEKIT',
      token: `sandbox_jwt_token_${user.id}_${Date.now()}`,
      roomName,
      serverUrl: livekitUrl,
      title: lc.title,
      className: lc.class_name,
      isSandbox: true,
      message: 'Connected to LiveKit sandbox classroom.',
    });
  } catch (error) {
    console.error('Error generating live session token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate live session access token.',
    });
  }
}

module.exports = {
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  getLiveToken,
};
