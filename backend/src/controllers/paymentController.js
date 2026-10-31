const { pool } = require('../config/database');
const { uploadReceiptFile } = require('../services/storageService');

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
              billing_month, valid_until, card_last4, receipt_url, created_at 
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
 * Supports Card (instantly COMPLETED) or Bank Slip / Receipt Upload (PENDING admin review)
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

    // Handle receipt file upload if provided
    let receiptUrl = null;
    if (req.file) {
      const uploadResult = await uploadReceiptFile(req.file);
      receiptUrl = uploadResult.fileUrl;
    }

    // Parse categories if sent as JSON string or string from FormData
    let parsedCategories = categories;
    if (typeof categories === 'string') {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (e) {
        parsedCategories = categories.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const isReceipt =
      paymentMethod === 'MOCK_BANK_RECEIPT' ||
      paymentMethod === 'RECEIPT' ||
      Boolean(receiptUrl);

    // Card payments are auto-completed. Receipt uploads require Admin approval.
    const paymentStatus = isReceipt ? 'PENDING' : 'COMPLETED';

    // Current billing month & next renewal date (14th of next month)
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const validUntil = getNextRenewalDate(now);
    const transactionId = isReceipt
      ? `WW-SLIP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
      : `WW-MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await connection.beginTransaction();

    // 1. Insert into payments table
    const [result] = await connection.query(
      `INSERT INTO payments 
       (student_id, payer_user_id, transaction_id, amount, currency, payment_method, 
        payment_status, billing_month, valid_until, categories, card_last4, notes, receipt_url)
       VALUES (?, ?, ?, ?, 'LKR', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsedStudentId,
        payerId,
        transactionId,
        parsedAmount,
        isReceipt ? 'MOCK_BANK_RECEIPT' : paymentMethod,
        paymentStatus,
        billingMonth,
        validUntil,
        parsedCategories ? JSON.stringify(parsedCategories) : null,
        isReceipt ? null : (cardLast4 || '4242'),
        notes,
        receiptUrl,
      ]
    );

    // 2. If COMPLETED and categories are provided, activate enrollments immediately
    if (paymentStatus === 'COMPLETED' && Array.isArray(parsedCategories) && parsedCategories.length > 0) {
      const categoryIds = parsedCategories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
      if (categoryIds.length > 0) {
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
      message: isReceipt
        ? 'Payment receipt uploaded successfully! Pending Admin verification and approval.'
        : 'Mock payment approved! Student access active until 2nd week of next month.',
      data: {
        paymentId: result.insertId,
        transactionId,
        amount: parsedAmount,
        currency: 'LKR',
        paymentMethod: isReceipt ? 'MOCK_BANK_RECEIPT' : paymentMethod,
        paymentStatus,
        receiptUrl,
        billingMonth,
        validUntil,
        renewalLabel: getRenewalLabel(validUntil),
        paidAt: now.toISOString(),
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

/**
 * Helper to get recent months (e.g. current + past 3 months + upcoming month)
 */
function getRecentBillingMonths(count = 4) {
  const months = [];
  const now = new Date();

  // Upcoming month
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextVal = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  months.push({
    value: nextVal,
    label: `${MONTH_NAMES[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`,
    isUpcoming: true,
  });

  // Current and past months
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    months.push({
      value,
      label,
      isCurrent: i === 0,
      isPast: i > 0,
    });
  }

  return months;
}

/**
 * GET /api/payments/admin/all
 * Fetch all payments for Admin review and oversight
 * Supports filtering by status, search, and billing month (current month default, retains 3+ months)
 */
async function getAllPaymentsAdmin(req, res) {
  try {
    const { status = 'ALL', search = '', month } = req.query;

    const recentMonths = getRecentBillingMonths(4);
    const now = new Date();
    const currentMonthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = month || currentMonthVal;

    // Base query for payments
    let query = `
      SELECT p.*, 
             s.first_name AS student_first_name, s.last_name AS student_last_name, s.email AS student_email, s.phone AS student_phone,
             u.first_name AS payer_first_name, u.last_name AS payer_last_name, u.email AS payer_email, u.phone AS payer_phone
      FROM payments p
      JOIN users s ON s.id = p.student_id
      JOIN users u ON u.id = p.payer_user_id
      WHERE 1=1
    `;
    const params = [];

    // Monthly filter: by default filter by selected month (e.g. '2026-10') or 'PAST_3_MONTHS'
    if (selectedMonth === 'PAST_3_MONTHS') {
      const past3Values = recentMonths.filter((m) => !m.isUpcoming).map((m) => m.value);
      query += ` AND (p.billing_month IN (?) OR DATE_FORMAT(p.created_at, '%Y-%m') IN (?))`;
      params.push(past3Values, past3Values);
    } else if (selectedMonth !== 'ALL') {
      query += ` AND (p.billing_month = ? OR DATE_FORMAT(p.created_at, '%Y-%m') = ?)`;
      params.push(selectedMonth, selectedMonth);
    }

    if (status && status !== 'ALL') {
      query += ` AND p.payment_status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      query += ` AND (
        p.transaction_id LIKE ? OR 
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        s.email LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ?
      )`;
      params.push(
        searchPattern, searchPattern, searchPattern, searchPattern,
        searchPattern, searchPattern, searchPattern
      );
    }

    query += ` ORDER BY p.created_at DESC`;

    const [rows] = await pool.query(query, params);

    // Summary calculations for the selected month (monthly revenue, counts, method breakdown)
    let summaryQuery = `
      SELECT 
        COUNT(*) AS totalCount,
        SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
        SUM(CASE WHEN payment_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedCount,
        SUM(CASE WHEN payment_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejectedCount,
        SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount ELSE 0 END) AS totalRevenue,
        SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method = 'MOCK_CARD' THEN amount ELSE 0 END) AS cardRevenue,
        SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method = 'MOCK_CARD' THEN 1 ELSE 0 END) AS cardCount,
        SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method != 'MOCK_CARD' THEN amount ELSE 0 END) AS slipRevenue,
        SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method != 'MOCK_CARD' THEN 1 ELSE 0 END) AS slipCount
      FROM payments p
      WHERE 1=1
    `;
    const summaryParams = [];

    if (selectedMonth === 'PAST_3_MONTHS') {
      const past3Values = recentMonths.filter((m) => !m.isUpcoming).map((m) => m.value);
      summaryQuery += ` AND (p.billing_month IN (?) OR DATE_FORMAT(p.created_at, '%Y-%m') IN (?))`;
      summaryParams.push(past3Values, past3Values);
    } else if (selectedMonth !== 'ALL') {
      summaryQuery += ` AND (p.billing_month = ? OR DATE_FORMAT(p.created_at, '%Y-%m') = ?)`;
      summaryParams.push(selectedMonth, selectedMonth);
    }

    const [summaryRows] = await pool.query(summaryQuery, summaryParams);

    const summary = summaryRows[0] || {
      totalCount: 0,
      pendingCount: 0,
      completedCount: 0,
      rejectedCount: 0,
      totalRevenue: 0,
      cardRevenue: 0,
      cardCount: 0,
      slipRevenue: 0,
      slipCount: 0,
    };

    // Calculate revenue breakdown by category/grade
    const categoryBreakdown = {};
    Object.keys(CATEGORY_FEES).forEach((id) => {
      categoryBreakdown[id] = {
        name: CATEGORY_FEES[id].name,
        count: 0,
        amount: 0,
      };
    });

    const formattedPayments = rows.map((p) => {
      let parsedCategories = [];
      if (p.categories) {
        try {
          parsedCategories = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories;
        } catch (e) {
          parsedCategories = [];
        }
      }

      const categoryNames = parsedCategories.map((catId) => {
        if (p.payment_status === 'COMPLETED' && categoryBreakdown[catId]) {
          categoryBreakdown[catId].count += 1;
          categoryBreakdown[catId].amount += CATEGORY_FEES[catId].fee;
        }
        return CATEGORY_FEES[catId]?.name || `Course #${catId}`;
      });

      return {
        ...p,
        valid_until: formatDateOnly(p.valid_until),
        created_at: formatDateOnly(p.created_at),
        categoryNames,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        payments: formattedPayments,
        selectedMonth,
        currentMonth: currentMonthVal,
        availableMonths: recentMonths,
        summary: {
          totalCount: Number(summary.totalCount) || 0,
          pendingCount: Number(summary.pendingCount) || 0,
          completedCount: Number(summary.completedCount) || 0,
          rejectedCount: Number(summary.rejectedCount) || 0,
          totalRevenue: Number(summary.totalRevenue) || 0,
          cardRevenue: Number(summary.cardRevenue) || 0,
          cardCount: Number(summary.cardCount) || 0,
          slipRevenue: Number(summary.slipRevenue) || 0,
          slipCount: Number(summary.slipCount) || 0,
          categoryBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin payment records.',
    });
  }
}

/**
 * PUT /api/payments/admin/:id/approve
 * Admin approves a pending receipt payment
 * Marks payment COMPLETED, sets valid_until, and activates student enrollments
 */
async function approvePaymentAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    const paymentId = parseInt(req.params.id, 10);
    if (!paymentId || isNaN(paymentId)) {
      return res.status(400).json({ success: false, message: 'Valid payment ID is required.' });
    }

    const [payments] = await connection.query(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = payments[0];
    const now = new Date();
    const newValidUntil = getNextRenewalDate(now);

    await connection.beginTransaction();

    // 1. Update payment status to COMPLETED
    await connection.query(
      `UPDATE payments 
       SET payment_status = 'COMPLETED',
           valid_until = ?,
           notes = CONCAT(IFNULL(notes, ''), ' [Approved by Admin]')
       WHERE id = ?`,
      [newValidUntil, paymentId]
    );

    // 2. Activate student enrollments for these categories
    let parsedCategories = [];
    if (payment.categories) {
      try {
        parsedCategories = typeof payment.categories === 'string' ? JSON.parse(payment.categories) : payment.categories;
      } catch (e) {
        parsedCategories = [];
      }
    }

    if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
      const categoryIds = parsedCategories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
      if (categoryIds.length > 0) {
        const [targetClasses] = await connection.query(
          `SELECT id FROM classes WHERE grade_id IN (?)`,
          [categoryIds]
        );

        for (const cls of targetClasses) {
          await connection.query(
            `INSERT INTO enrollments (student_id, class_id, status)
             VALUES (?, ?, 'ACTIVE')
             ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
            [payment.student_id, cls.id]
          );
        }
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Payment approved successfully! Student access activated.',
      data: {
        paymentId,
        paymentStatus: 'COMPLETED',
        validUntil: newValidUntil,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error approving payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve payment.',
    });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/payments/admin/:id/reject
 * Admin rejects a pending receipt payment with a reason
 */
async function rejectPaymentAdmin(req, res) {
  try {
    const paymentId = parseInt(req.params.id, 10);
    if (!paymentId || isNaN(paymentId)) {
      return res.status(400).json({ success: false, message: 'Valid payment ID is required.' });
    }

    const { reason = 'Bank slip verification failed or unclear image.' } = req.body;

    const [payments] = await pool.query(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    await pool.query(
      `UPDATE payments 
       SET payment_status = 'REJECTED',
           notes = CONCAT(IFNULL(notes, ''), ' [Rejected: ', ?, ']')
       WHERE id = ?`,
      [reason, paymentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Payment rejected.',
      data: {
        paymentId,
        paymentStatus: 'REJECTED',
        reason,
      },
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject payment.',
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
  getAllPaymentsAdmin,
  approvePaymentAdmin,
  rejectPaymentAdmin,
  formatDateOnly,
};

