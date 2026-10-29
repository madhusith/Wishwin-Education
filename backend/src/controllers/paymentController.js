const { pool } = require('../config/database');

/**
 * Helper to compute renewal date (14th day of the following month, i.e., 2nd week)
 * E.g., if payment made in October 2026, valid until November 14, 2026
 */
function getNextRenewalDate(fromDate = new Date()) {
  const d = new Date(fromDate);
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 14);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a human-friendly renewal label
 */
function getRenewalLabel(validUntilDateStr) {
  if (!validUntilDateStr) return '2nd week of every month';
  const d = new Date(validUntilDateStr);
  const monthName = MONTH_NAMES[d.getMonth()] || '';
  return `2nd week of ${monthName} (${monthName} ${d.getDate()}, ${d.getFullYear()})`;
}

/**
 * Fee structure per grade / category (in LKR)
 */
const CATEGORY_FEES = {
  2: { name: 'Grade 04 Scholarship', fee: 2500 },
  3: { name: 'Grade 05 Scholarship', fee: 2500 },
  4: { name: 'Quiz Class Practice', fee: 1500 },
};

/**
 * Format Date object or string as YYYY-MM-DD
 */
function formatDateOnly(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val);
}

/**
 * GET /api/payments/status/:studentId
 * Get monthly payment & renewal status for a student
 */
async function getPaymentStatus(req, res) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.' });
    }

    // Verify access (Parent of this student, the student themselves, or Admin)
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view these payment records.' });
    }

    if (userRole === 'PARENT') {
      const [link] = await pool.query(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, studentId]
      );
      if (link.length === 0) {
        return res.status(403).json({ success: false, message: 'You are not linked to this student.' });
      }
    }

    // Fetch latest completed payment
    const [payments] = await pool.query(
      `SELECT * FROM payments 
       WHERE student_id = ? AND payment_status = 'COMPLETED'
       ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    );

    const latest = payments[0] || null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isPaid = false;
    let validUntil = null;
    let renewalLabel = '2nd week of every month';

    if (latest && latest.valid_until) {
      validUntil = formatDateOnly(latest.valid_until);
      renewalLabel = getRenewalLabel(validUntil);
    }

    // Status logic:
    // ACTIVE: has valid payment and not expired and not in renewal window
    // PAYMENT_NEEDED: has valid payment but in 1st week of month (renewal opened) or <= 7 days left, or no payment made yet
    // PAYMENT_OVERDUE: valid until date is in the past
    const currentDay = today.getDate();
    const isFirstWeekOfMonth = currentDay <= 7;

    let status = 'PAYMENT_NEEDED';
    let canRenew = false;

    if (!validUntil) {
      status = 'PAYMENT_NEEDED';
      isPaid = false;
      canRenew = true;
    } else {
      const validDateObj = new Date(validUntil);
      validDateObj.setHours(23, 59, 59, 999);

      if (validDateObj < today) {
        status = 'PAYMENT_OVERDUE';
        isPaid = false;
        canRenew = true;
      } else {
        isPaid = true;
        const daysRemaining = Math.ceil((validDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (isFirstWeekOfMonth || daysRemaining <= 7) {
          status = 'PAYMENT_NEEDED';
          canRenew = true;
        } else {
          status = 'ACTIVE';
          canRenew = false;
        }
      }
    }

    // Recent 5 payments
    const [history] = await pool.query(
      `SELECT id, transaction_id, amount, currency, payment_method, payment_status, 
              billing_month, valid_until, card_last4, created_at 
       FROM payments 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 5`,
      [studentId]
    );

    const formattedHistory = history.map((item) => ({
      ...item,
      valid_until: formatDateOnly(item.valid_until),
      created_at: formatDateOnly(item.created_at),
    }));

    return res.status(200).json({
      success: true,
      data: {
        studentId,
        isPaid,
        status, // 'ACTIVE' | 'PAYMENT_NEEDED' | 'PAYMENT_OVERDUE'
        canRenew,
        isFirstWeekOfMonth,
        validUntil, // Clean YYYY-MM-DD
        renewalPolicy: 'Every class expires monthly. Renewal date is every 2nd week of the month.',
        renewalLabel,
        categoryFees: CATEGORY_FEES,
        latestPayment: latest ? {
          ...latest,
          valid_until: validUntil,
          created_at: formatDateOnly(latest.created_at),
        } : null,
        history: formattedHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status.',
    });
  }
}

/**
 * POST /api/payments/mock-charge
 * Process a mock payment transaction for course registration / monthly renewal
 */
async function processMockPayment(req, res) {
  const connection = await pool.getConnection();
  try {
    const payerId = req.user.id;
    const {
      studentId,
      categories,
      amount,
      paymentMethod = 'MOCK_CARD',
      cardLast4 = '4242',
      notes = 'Monthly Class Subscription',
    } = req.body;

    const parsedStudentId = parseInt(studentId, 10);
    if (!parsedStudentId || isNaN(parsedStudentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid payment amount is required.' });
    }

    // Current billing month & next renewal date (14th of next month)
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const validUntil = getNextRenewalDate(now);
    const transactionId = `WW-MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await connection.beginTransaction();

    // 1. Insert into payments table
    const [result] = await connection.query(
      `INSERT INTO payments 
       (student_id, payer_user_id, transaction_id, amount, currency, payment_method, 
        payment_status, billing_month, valid_until, categories, card_last4, notes)
       VALUES (?, ?, ?, ?, 'LKR', ?, 'COMPLETED', ?, ?, ?, ?, ?)`,
      [
        parsedStudentId,
        payerId,
        transactionId,
        parsedAmount,
        paymentMethod,
        billingMonth,
        validUntil,
        categories ? JSON.stringify(categories) : null,
        cardLast4 || '4242',
        notes,
      ]
    );

    // 2. If categories are provided, update/ensure enrollments are ACTIVE
    if (Array.isArray(categories) && categories.length > 0) {
      const categoryIds = categories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
      if (categoryIds.length > 0) {
        // Fetch classes belonging to these categories
        const [targetClasses] = await connection.query(
          `SELECT id FROM classes WHERE grade_id IN (?)`,
          [categoryIds]
        );

        for (const cls of targetClasses) {
          await connection.query(
            `INSERT INTO enrollments (student_id, class_id, status)
             VALUES (?, ?, 'ACTIVE')
             ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
            [parsedStudentId, cls.id]
          );
        }
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Mock payment approved! Student access active until 2nd week of next month.',
      data: {
        paymentId: result.insertId,
        transactionId,
        amount: parsedAmount,
        currency: 'LKR',
        paymentMethod,
        cardLast4,
        billingMonth,
        validUntil,
        renewalLabel: getRenewalLabel(validUntil),
        paidAt: now.toISOString(),
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing mock payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment processing failed.',
    });
  } finally {
    connection.release();
  }
}

/**
 * GET /api/payments/history/:studentId
 */
async function getPaymentHistory(req, res) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.' });
    }

    const [rows] = await pool.query(
      `SELECT p.*, u.first_name AS payer_first_name, u.last_name AS payer_last_name 
       FROM payments p
       JOIN users u ON u.id = p.payer_user_id
       WHERE p.student_id = ?
       ORDER BY p.created_at DESC`,
      [studentId]
    );

    const formatted = rows.map((r) => ({
      ...r,
      valid_until: formatDateOnly(r.valid_until),
      created_at: formatDateOnly(r.created_at),
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history.',
    });
  }
}

module.exports = {
  getNextRenewalDate,
  getRenewalLabel,
  CATEGORY_FEES,
  getPaymentStatus,
  processMockPayment,
  getPaymentHistory,
  formatDateOnly,
};

