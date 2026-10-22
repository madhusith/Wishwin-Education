const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { getNextRenewalDate, getRenewalLabel } = require('./paymentController');

// GET /api/parent/children - List all children of the logged-in parent
async function getChildren(req, res) {
  try {
    const parentId = req.user.id;
    const [children] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at
       FROM parent_students ps
       JOIN users u ON ps.student_id = u.id
       WHERE ps.parent_id = ?
       ORDER BY u.id ASC`,
      [parentId]
    );

    return res.status(200).json({
      success: true,
      data: children.map((c) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone || 'N/A',
        status: c.status,
        registeredAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch linked children.',
    });
  }
}

// POST /api/parent/children - Parent creates a student account for their child
async function createChildAccount(req, res) {
  const connection = await pool.getConnection();
  try {
    const parentId = req.user.id;
    const { firstName, lastName, username, password, categories } = req.body;

    if (!firstName || !lastName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, username, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Clean username/email: if no domain provided, format as username@student.wishwin.edu
    const cleanUsername = username.trim().toLowerCase();
    const studentEmail = cleanUsername.includes('@')
      ? cleanUsername
      : `${cleanUsername}@student.wishwin.edu`;

    // Check if username/email already exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR email = ?',
      [studentEmail, cleanUsername]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `An account with username '${cleanUsername}' already exists. Please choose a different username.`,
      });
    }

    await connection.beginTransaction();

    // 1. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Insert student user
    const [userResult] = await connection.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'STUDENT', 'ACTIVE')`,
      [firstName.trim(), lastName.trim(), studentEmail, passwordHash]
    );
    const newStudentId = userResult.insertId;

    // 3. Link child to parent
    await connection.query(
      `INSERT INTO parent_students (parent_id, student_id) VALUES (?, ?)`,
      [parentId, newStudentId]
    );

    // 4. Enroll child in selected class categories
    // categories can be grade IDs: 2 (Grade 04), 3 (Grade 05), 4 (Quiz Class)
    let categoryIds = [3]; // default Grade 05 if not provided
    if (Array.isArray(categories) && categories.length > 0) {
      categoryIds = categories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
    }

    const [classesToEnroll] = await connection.query(
      `SELECT id FROM classes WHERE grade_id IN (?)`,
      [categoryIds]
    );

    for (const c of classesToEnroll) {
      await connection.query(
        `INSERT IGNORE INTO enrollments (student_id, class_id, status) VALUES (?, ?, 'ACTIVE')`,
        [newStudentId, c.id]
      );
    }

    // 5. Record initial course registration payment in payments table
    let paymentReceipt = null;
    if (req.body.paymentDetails || req.body.paid) {
      const pDetails = req.body.paymentDetails || {};
      const amount = parseFloat(pDetails.amount) || (categoryIds.length * 2500);
      const paymentMethod = pDetails.paymentMethod || 'MOCK_CARD';
      const cardLast4 = pDetails.cardLast4 || '4242';
      const now = new Date();
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const validUntil = getNextRenewalDate(now);
      const transactionId = pDetails.transactionId || `WW-MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await connection.query(
        `INSERT INTO payments 
         (student_id, payer_user_id, transaction_id, amount, currency, payment_method, 
          payment_status, billing_month, valid_until, categories, card_last4, notes)
         VALUES (?, ?, ?, ?, 'LKR', ?, 'COMPLETED', ?, ?, ?, ?, ?)`,
        [
          newStudentId,
          parentId,
          transactionId,
          amount,
          paymentMethod,
          billingMonth,
          validUntil,
          JSON.stringify(categoryIds),
          cardLast4,
          'Course Registration Fee',
        ]
      );

      paymentReceipt = {
        transactionId,
        amount,
        validUntil,
        billingMonth,
        renewalLabel: getRenewalLabel(validUntil),
      };
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Student account created and enrolled successfully.',
      data: {
        studentId: newStudentId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: cleanUsername,
        email: studentEmail,
        enrolledCount: classesToEnroll.length,
        paymentReceipt,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating child account:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student account.',
    });
  } finally {
    connection.release();
  }
}

// GET /api/parent/child-summary (with optional ?studentId=)
async function getChildSummary(req, res) {
  try {
    const parentId = req.user.id;
    const requestedStudentId = req.query.studentId ? parseInt(req.query.studentId, 10) : null;

    // 1. Get linked student(s)
    let [children] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at
       FROM parent_students ps
       JOIN users u ON ps.student_id = u.id
       WHERE ps.parent_id = ?
       ORDER BY u.id ASC`,
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

    // Select requested child or default to first
    let child = children[0];
    if (requestedStudentId) {
      const found = children.find((c) => c.id === requestedStudentId);
      if (found) child = found;
    }

    // 2. Enrolled Classes
    const [enrolledClasses] = await pool.query(
      `SELECT 
        c.id,
        c.name AS class_name,
        c.description,
        c.grade_id,
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

    // 6. Monthly Subscription & Payment Status (Renewal: 2nd week of each month)
    const [latestPayments] = await pool.query(
      `SELECT * FROM payments 
       WHERE student_id = ? AND payment_status = 'COMPLETED'
       ORDER BY created_at DESC LIMIT 1`,
      [child.id]
    );
    const latestPay = latestPayments[0] || null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isPaid = false;
    let validUntil = null;
    let renewalLabel = '2nd week of every month';

    if (latestPay && latestPay.valid_until) {
      const validUntilDate = new Date(latestPay.valid_until);
      validUntilDate.setHours(23, 59, 59, 999);
      isPaid = validUntilDate >= today;
      validUntil = latestPay.valid_until;
      renewalLabel = getRenewalLabel(latestPay.valid_until);
    }

    const paymentStatus = {
      isPaid,
      status: isPaid ? 'ACTIVE' : 'DUE',
      validUntil,
      renewalLabel,
      renewalNotice: 'Every class expires monthly. Renewal date is every 2nd week of each month.',
      lastPayment: latestPay
        ? {
            transactionId: latestPay.transaction_id,
            amount: latestPay.amount,
            paidAt: latestPay.created_at,
            method: latestPay.payment_method,
            cardLast4: latestPay.card_last4,
          }
        : null,
    };

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
        children: children.map((c) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          status: c.status,
        })),
        enrolledClasses,
        enrolledCategoryIds: [...new Set(enrolledClasses.map((c) => c.grade_id))],
        quizAttempts,
        liveClasses,
        paymentStatus,
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

// PUT /api/parent/children/:studentId/enrollments - Parent updates/adds enrolled categories for a child
async function updateChildEnrollments(req, res) {
  const connection = await pool.getConnection();
  try {
    const parentId = req.user.id;
    const studentId = parseInt(req.params.studentId, 10);
    const { categories } = req.body;

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid student ID is required.',
      });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one class category.',
      });
    }

    // 1. Verify parent owns child (or user is ADMIN)
    if (req.user.role === 'PARENT') {
      const [link] = await connection.query(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [parentId, studentId]
      );
      if (link.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update classes for this student.',
        });
      }
    }

    const categoryIds = categories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));

    // 2. Fetch all classes belonging to these selected categories
    const [classesToEnroll] = await connection.query(
      'SELECT id, name, grade_id FROM classes WHERE grade_id IN (?)',
      [categoryIds]
    );

    if (classesToEnroll.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No classes found for the selected categories.',
      });
    }

    await connection.beginTransaction();

    const selectedClassIds = classesToEnroll.map((c) => c.id);

    // 3. Remove enrollments for classes not in the newly selected categories
    await connection.query(
      'DELETE FROM enrollments WHERE student_id = ? AND class_id NOT IN (?)',
      [studentId, selectedClassIds]
    );

    // 4. Insert or reactivate enrollments for selected classes
    for (const c of classesToEnroll) {
      await connection.query(
        `INSERT INTO enrollments (student_id, class_id, status) VALUES (?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
        [studentId, c.id]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Student class categories and enrollments updated successfully.',
      data: {
        studentId,
        enrolledCategories: categoryIds,
        enrolledClassesCount: selectedClassIds.length,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating child enrollments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update student enrollments.',
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getChildSummary,
  getChildren,
  createChildAccount,
  updateChildEnrollments,
};
