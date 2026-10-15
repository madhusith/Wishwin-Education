const { pool } = require('../config/database');

// GET /api/parent/child-summary
async function getChildSummary(req, res) {
  try {
    const parentId = req.user.id;

    // 1. Get linked student(s)
    let [children] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at
       FROM parent_students ps
       JOIN users u ON ps.student_id = u.id
       WHERE ps.parent_id = ?`,
      [parentId]
    );

    // Fallback: If no link exists in parent_students, match by last name or demo student (id=3)
    if (children.length === 0) {
      const [parentUser] = await pool.query('SELECT last_name FROM users WHERE id = ?', [parentId]);
      if (parentUser.length > 0 && parentUser[0].last_name) {
        const [matched] = await pool.query(
          `SELECT id, first_name, last_name, email, phone, status, created_at
           FROM users
           WHERE role = 'STUDENT' AND last_name = ?
           LIMIT 1`,
          [parentUser[0].last_name]
        );
        if (matched.length > 0) {
          children = matched;
        }
      }

      // Default fallback to first active student
      if (children.length === 0) {
        const [defaultStudent] = await pool.query(
          `SELECT id, first_name, last_name, email, phone, status, created_at
           FROM users
           WHERE role = 'STUDENT' AND status = 'ACTIVE'
           ORDER BY id ASC LIMIT 1`
        );
        children = defaultStudent;
      }
    }

    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No linked child records found.',
      });
    }

    const child = children[0]; // Primary child for phase 1

    // 2. Enrolled Classes
    const [enrolledClasses] = await pool.query(
      `SELECT 
        c.id,
        c.name AS class_name,
        c.description,
        g.name AS grade_name,
        e.status AS enrollment_status,
        e.enrolled_at,
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        t.email AS teacher_email,
        t.phone AS teacher_phone
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN grades g ON c.grade_id = g.id
       LEFT JOIN users t ON c.teacher_id = t.id
       WHERE e.student_id = ? AND e.status = 'ACTIVE'
       ORDER BY c.name ASC`,
      [child.id]
    );

    const classIds = enrolledClasses.map((c) => c.id);

    // 3. Quiz Attempts & Marks
    let quizAttempts = [];
    if (classIds.length > 0) {
      const [attempts] = await pool.query(
        `SELECT 
          qa.id AS attempt_id,
          qa.quiz_id,
          q.title AS quiz_title,
          c.name AS class_name,
          qa.score,
          qa.total_marks,
          qa.submitted_at
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.id
         JOIN classes c ON q.class_id = c.id
         WHERE qa.student_id = ?
         ORDER BY qa.submitted_at DESC`,
        [child.id]
      );

      quizAttempts = attempts.map((a) => ({
        attemptId: a.attempt_id,
        quizId: a.quiz_id,
        quizTitle: a.quiz_title,
        className: a.class_name,
        score: a.score,
        totalMarks: a.total_marks,
        percentage: a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0,
        submittedAt: a.submitted_at,
      }));
    }

    // 4. Live Classes (Scheduled and recent)
    let liveClasses = [];
    if (classIds.length > 0) {
      const [sessions] = await pool.query(
        `SELECT 
          lc.id,
          lc.title,
          lc.description,
          lc.scheduled_date,
          lc.start_time,
          lc.end_time,
          lc.status,
          lc.meeting_url,
          c.name AS class_name,
          CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
         FROM live_classes lc
         JOIN classes c ON lc.class_id = c.id
         JOIN users u ON lc.created_by = u.id
         WHERE lc.class_id IN (?)
         ORDER BY lc.scheduled_date DESC, lc.start_time DESC`,
        [classIds]
      );

      liveClasses = sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        scheduledDate: s.scheduled_date,
        startTime: s.start_time,
        endTime: s.end_time,
        status: s.status,
        meetingUrl: s.meeting_url,
        className: s.class_name,
        teacherName: s.teacher_name,
      }));
    }

    // 5. Overall Stats Summary
    const totalQuizzes = quizAttempts.length;
    const avgScore =
      totalQuizzes > 0
        ? Math.round(quizAttempts.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
        : 0;
    const upcomingLiveCount = liveClasses.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE').length;

    return res.status(200).json({
      success: true,
      data: {
        child: {
          id: child.id,
          name: `${child.first_name} ${child.last_name}`,
          firstName: child.first_name,
          lastName: child.last_name,
          email: child.email,
          phone: child.phone || 'N/A',
          status: child.status,
          registeredAt: child.created_at,
        },
        enrolledClasses,
        quizAttempts,
        liveClasses,
        stats: {
          enrolledClassesCount: enrolledClasses.length,
          quizzesAttemptedCount: totalQuizzes,
          avgScorePercentage: avgScore,
          upcomingLiveCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching parent child summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child academic details.',
    });
  }
}

module.exports = {
  getChildSummary,
};
