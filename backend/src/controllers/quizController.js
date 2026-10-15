const { pool } = require('../config/database');

// GET /api/quizzes
async function getQuizzes(req, res) {
  try {
    const user = req.user;
    const { classId, search } = req.query;

    let query = `
      SELECT 
        q.id,
        q.class_id,
        q.title,
        q.description,
        q.instructions,
        q.quiz_type,
        q.google_form_url,
        q.time_limit_minutes,
        q.published,
        q.created_by,
        q.created_at,
        c.name AS class_name,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
        (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
        COALESCE((SELECT SUM(marks) FROM quiz_questions qq WHERE qq.quiz_id = q.id), 0) AS total_marks
      FROM quizzes q
      JOIN classes c ON q.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON q.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility
    if (user.role === 'STUDENT') {
      // Students see only published quizzes for their enrolled classes
      query += ` AND q.published = 1 AND q.class_id IN (
        SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'ACTIVE'
      )`;
      params.push(user.id);
    } else if (user.role === 'TEACHER') {
      // Teachers see quizzes for classes they teach or created
      query += ` AND (c.teacher_id = ? OR q.created_by = ?)`;
      params.push(user.id, user.id);
    }

    if (classId) {
      query += ` AND q.class_id = ?`;
      params.push(classId);
    }

    if (search) {
      query += ` AND (q.title LIKE ? OR q.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY q.created_at DESC`;

    const [rows] = await pool.query(query, params);

    // If student, attach latest attempt data for each quiz
    let attemptsMap = {};
    if (user.role === 'STUDENT' && rows.length > 0) {
      const quizIds = rows.map((r) => r.id);
      const [attempts] = await pool.query(
        `SELECT qa.id, qa.quiz_id, qa.score, qa.total_marks, qa.submitted_at
         FROM quiz_attempts qa
         WHERE qa.student_id = ? AND qa.quiz_id IN (?)
         ORDER BY qa.submitted_at DESC`,
        [user.id, quizIds]
      );
      // Map newest attempt per quiz
      attempts.forEach((att) => {
        if (!attemptsMap[att.quiz_id]) {
          attemptsMap[att.quiz_id] = {
            attemptId: att.id,
            score: att.score,
            totalMarks: att.total_marks,
            submittedAt: att.submitted_at,
            percentage: att.total_marks > 0 ? Math.round((att.score / att.total_marks) * 100) : 0,
          };
        }
      });
    }

    // If teacher or admin, attach total attempts count
    let totalAttemptsMap = {};
    if ((user.role === 'TEACHER' || user.role === 'ADMIN') && rows.length > 0) {
      const quizIds = rows.map((r) => r.id);
      const [counts] = await pool.query(
        `SELECT quiz_id, COUNT(*) AS count
         FROM quiz_attempts
         WHERE quiz_id IN (?)
         GROUP BY quiz_id`,
        [quizIds]
      );
      counts.forEach((c) => {
        totalAttemptsMap[c.quiz_id] = c.count;
      });
    }

    const quizzes = rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      className: r.class_name,
      gradeName: r.grade_name,
      title: r.title,
      description: r.description,
      instructions: r.instructions,
      quizType: r.quiz_type || 'IN_BUILD',
      googleFormUrl: r.google_form_url || null,
      timeLimitMinutes: r.time_limit_minutes || 0,
      published: Boolean(r.published),
      questionCount: Number(r.question_count || 0),
      totalMarks: Number(r.total_marks || 0),
      creatorName: r.creator_name,
      createdAt: r.created_at,
      myAttempt: attemptsMap[r.id] || null,
      attemptCount: totalAttemptsMap[r.id] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes.',
    });
  }
}

// GET /api/quizzes/:id
async function getQuizById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [quizzes] = await pool.query(
      `SELECT 
        q.id,
        q.class_id,
        q.title,
        q.description,
        q.instructions,
        q.quiz_type,
        q.google_form_url,
        q.time_limit_minutes,
        q.published,
        q.created_by,
        q.created_at,
        c.name AS class_name,
        c.teacher_id,
        g.name AS grade_name,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM quizzes q
      JOIN classes c ON q.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON q.created_by = u.id
      WHERE q.id = ?`,
      [id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    const quiz = quizzes[0];

    // Access control
    if (user.role === 'STUDENT') {
      if (!quiz.published) {
        return res.status(403).json({
          success: false,
          message: 'This quiz is not currently published.',
        });
      }

      // Check student enrollment
      const [enrollment] = await pool.query(
        `SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'ACTIVE'`,
        [user.id, quiz.class_id]
      );
      if (enrollment.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class.',
        });
      }
    } else if (user.role === 'TEACHER') {
      if (quiz.teacher_id !== user.id && quiz.created_by !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this quiz.',
        });
      }
    }

    // Fetch questions and options
    const [questions] = await pool.query(
      `SELECT id, quiz_id, question_text, question_type, marks
       FROM quiz_questions
       WHERE quiz_id = ?
       ORDER BY id ASC`,
      [id]
    );

    let questionsWithOptions = [];
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.id);
      const [options] = await pool.query(
        `SELECT id, question_id, option_text, is_correct
         FROM quiz_options
         WHERE question_id IN (?)
         ORDER BY id ASC`,
        [questionIds]
      );

      const optionsByQuestion = {};
      options.forEach((opt) => {
        if (!optionsByQuestion[opt.question_id]) {
          optionsByQuestion[opt.question_id] = [];
        }

        // SECURITY: If student, DO NOT reveal is_correct
        const optionData = {
          id: opt.id,
          questionId: opt.question_id,
          optionText: opt.option_text,
        };
        if (user.role !== 'STUDENT') {
          optionData.isCorrect = Boolean(opt.is_correct);
        }
        optionsByQuestion[opt.question_id].push(optionData);
      });

      questionsWithOptions = questions.map((q) => ({
        id: q.id,
        quizId: q.quiz_id,
        questionText: q.question_text,
        questionType: q.question_type,
        marks: q.marks,
        options: optionsByQuestion[q.id] || [],
      }));
    }

    // Student's latest attempt if applicable
    let myAttempt = null;
    if (user.role === 'STUDENT') {
      const [attempts] = await pool.query(
        `SELECT id, score, total_marks, submitted_at
         FROM quiz_attempts
         WHERE student_id = ? AND quiz_id = ?
         ORDER BY submitted_at DESC
         LIMIT 1`,
        [user.id, id]
      );
      if (attempts.length > 0) {
        const att = attempts[0];
        myAttempt = {
          attemptId: att.id,
          score: att.score,
          totalMarks: att.total_marks,
          percentage: att.total_marks > 0 ? Math.round((att.score / att.total_marks) * 100) : 0,
          submittedAt: att.submitted_at,
        };
      }
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    return res.status(200).json({
      success: true,
      data: {
        id: quiz.id,
        classId: quiz.class_id,
        className: quiz.class_name,
        gradeName: quiz.grade_name,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        quizType: quiz.quiz_type || 'IN_BUILD',
        googleFormUrl: quiz.google_form_url || null,
        timeLimitMinutes: quiz.time_limit_minutes || 0,
        published: Boolean(quiz.published),
        creatorName: quiz.creator_name,
        createdAt: quiz.created_at,
        totalMarks,
        questionCount: questions.length,
        questions: questionsWithOptions,
        myAttempt,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz details.',
    });
  }
}

// POST /api/quizzes
async function createQuiz(req, res) {
  const connection = await pool.getConnection();
  try {
    const user = req.user;
    const {
      classId,
      title,
      description,
      instructions,
      quizType = 'IN_BUILD',
      googleFormUrl,
      timeLimitMinutes = 0,
      published = false,
      questions = [],
    } = req.body;

    if (!classId || !title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class and Title are required.',
      });
    }

    // Validate quizType
    const validQuizTypes = ['IN_BUILD', 'GOOGLE_FORM', 'BOTH'];
    const chosenQuizType = validQuizTypes.includes(quizType) ? quizType : 'IN_BUILD';

    // If Google Form or BOTH, ensure URL format is valid if provided
    let cleanGoogleFormUrl = googleFormUrl ? googleFormUrl.trim() : null;
    if (chosenQuizType === 'GOOGLE_FORM' && !cleanGoogleFormUrl) {
      return res.status(400).json({
        success: false,
        message: 'Google Form URL is required when quiz type is Google Form.',
      });
    }

    // Verify teacher assignment if user is a TEACHER
    if (user.role === 'TEACHER') {
      const [classRows] = await connection.query(
        `SELECT id FROM classes WHERE id = ? AND teacher_id = ?`,
        [classId, user.id]
      );
      if (classRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only create quizzes for classes assigned to you.',
        });
      }
    }

    await connection.beginTransaction();

    const [quizResult] = await connection.query(
      `INSERT INTO quizzes (class_id, title, description, instructions, quiz_type, google_form_url, time_limit_minutes, published, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId,
        title.trim(),
        description || null,
        instructions || null,
        chosenQuizType,
        cleanGoogleFormUrl,
        Number(timeLimitMinutes) || 0,
        published ? 1 : 0,
        user.id,
      ]
    );

    const quizId = quizResult.insertId;

    // Insert questions and options if present (for IN_BUILD or BOTH)
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.questionText || !q.questionText.trim()) continue;

        const [questionResult] = await connection.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks)
           VALUES (?, ?, ?, ?)`,
          [quizId, q.questionText.trim(), q.questionType || 'MCQ', Number(q.marks) || 1]
        );

        const questionId = questionResult.insertId;

        if (Array.isArray(q.options) && q.options.length > 0) {
          for (const opt of q.options) {
            if (!opt.optionText || !opt.optionText.trim()) continue;
            await connection.query(
              `INSERT INTO quiz_options (question_id, option_text, is_correct)
               VALUES (?, ?, ?)`,
              [questionId, opt.optionText.trim(), opt.isCorrect ? 1 : 0]
            );
          }
        }
      }
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully.',
      quizId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create quiz.',
    });
  } finally {
    connection.release();
  }
}

// PUT /api/quizzes/:id
async function updateQuiz(req, res) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const user = req.user;
    const {
      classId,
      title,
      description,
      instructions,
      quizType,
      googleFormUrl,
      timeLimitMinutes,
      published,
      questions,
    } = req.body;

    // Check quiz exists and permission
    const [existing] = await connection.query(
      `SELECT q.id, q.created_by, c.teacher_id 
       FROM quizzes q
       JOIN classes c ON q.class_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id && existing[0].teacher_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this quiz.',
      });
    }

    await connection.beginTransaction();

    let cleanGoogleFormUrl = googleFormUrl !== undefined ? (googleFormUrl ? googleFormUrl.trim() : null) : undefined;

    await connection.query(
      `UPDATE quizzes SET
        class_id = COALESCE(?, class_id),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        instructions = COALESCE(?, instructions),
        quiz_type = COALESCE(?, quiz_type),
        google_form_url = COALESCE(?, google_form_url),
        time_limit_minutes = COALESCE(?, time_limit_minutes),
        published = COALESCE(?, published)
       WHERE id = ?`,
      [
        classId || null,
        title ? title.trim() : null,
        description !== undefined ? description : null,
        instructions !== undefined ? instructions : null,
        quizType || null,
        cleanGoogleFormUrl !== undefined ? cleanGoogleFormUrl : null,
        timeLimitMinutes !== undefined ? Number(timeLimitMinutes) : null,
        published !== undefined ? (published ? 1 : 0) : null,
        id,
      ]
    );

    // If questions are provided, replace them
    if (Array.isArray(questions)) {
      // Delete existing questions (cascade deletes quiz_options)
      await connection.query(`DELETE FROM quiz_questions WHERE quiz_id = ?`, [id]);

      for (const q of questions) {
        if (!q.questionText || !q.questionText.trim()) continue;

        const [questionResult] = await connection.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks)
           VALUES (?, ?, ?, ?)`,
          [id, q.questionText.trim(), q.questionType || 'MCQ', Number(q.marks) || 1]
        );

        const questionId = questionResult.insertId;

        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            if (!opt.optionText || !opt.optionText.trim()) continue;
            await connection.query(
              `INSERT INTO quiz_options (question_id, option_text, is_correct)
               VALUES (?, ?, ?)`,
              [questionId, opt.optionText.trim(), opt.isCorrect ? 1 : 0]
            );
          }
        }
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Quiz updated successfully.',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update quiz.',
    });
  } finally {
    connection.release();
  }
}

// PATCH /api/quizzes/:id/publish
async function togglePublishQuiz(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [existing] = await pool.query(
      `SELECT q.id, q.published, q.created_by, c.teacher_id 
       FROM quizzes q
       JOIN classes c ON q.class_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id && existing[0].teacher_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to publish/unpublish this quiz.',
      });
    }

    const newStatus = existing[0].published ? 0 : 1;
    await pool.query(`UPDATE quizzes SET published = ? WHERE id = ?`, [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: newStatus === 1 ? 'Quiz published successfully.' : 'Quiz unpublished successfully.',
      published: Boolean(newStatus),
    });
  } catch (error) {
    console.error('Error toggling quiz publication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle publication status.',
    });
  }
}

// DELETE /api/quizzes/:id
async function deleteQuiz(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [existing] = await pool.query(
      `SELECT q.id, q.created_by, c.teacher_id 
       FROM quizzes q
       JOIN classes c ON q.class_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    if (user.role === 'TEACHER' && existing[0].created_by !== user.id && existing[0].teacher_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this quiz.',
      });
    }

    // Cascade deletion handles quiz_questions, quiz_options, quiz_attempts, quiz_answers
    await pool.query(`DELETE FROM quizzes WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete quiz.',
    });
  }
}

// POST /api/quizzes/:id/submit
async function submitQuiz(req, res) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const user = req.user;
    const { answers = [] } = req.body;

    if (user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit quiz attempts.',
      });
    }

    // Validate quiz exists and is published
    const [quizzes] = await connection.query(
      `SELECT id, class_id, title, published FROM quizzes WHERE id = ?`,
      [id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    const quiz = quizzes[0];
    if (!quiz.published) {
      return res.status(400).json({
        success: false,
        message: 'This quiz is not currently active.',
      });
    }

    // Validate student enrollment
    const [enrollment] = await connection.query(
      `SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'ACTIVE'`,
      [user.id, quiz.class_id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the class for this quiz.',
      });
    }

    // Fetch all questions and their correct options
    const [questions] = await connection.query(
      `SELECT id, marks FROM quiz_questions WHERE quiz_id = ?`,
      [id]
    );

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This quiz has no questions to evaluate.',
      });
    }

    const questionIds = questions.map((q) => q.id);
    const [options] = await connection.query(
      `SELECT id, question_id, is_correct FROM quiz_options WHERE question_id IN (?)`,
      [questionIds]
    );

    // Build map of correct option IDs per question
    const correctOptionsMap = {};
    options.forEach((opt) => {
      if (opt.is_correct) {
        correctOptionsMap[opt.question_id] = opt.id;
      }
    });

    // Answers map from student input: { questionId: selectedOptionId }
    const studentAnswersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        studentAnswersMap[ans.questionId] = ans.selectedOptionId;
      });
    }

    let calculatedScore = 0;
    let totalMarks = 0;
    const evaluatedAnswers = [];

    questions.forEach((q) => {
      const qMarks = Number(q.marks) || 1;
      totalMarks += qMarks;

      const selectedOptId = studentAnswersMap[q.id] || null;
      const correctOptId = correctOptionsMap[q.id] || null;
      const isCorrect = selectedOptId && correctOptId && Number(selectedOptId) === Number(correctOptId);

      const marksAwarded = isCorrect ? qMarks : 0;
      calculatedScore += marksAwarded;

      evaluatedAnswers.push({
        questionId: q.id,
        selectedOptionId: selectedOptId,
        correctOptionId: correctOptId,
        isCorrect: Boolean(isCorrect),
        marksAwarded,
      });
    });

    await connection.beginTransaction();

    // 1. Save attempt
    const [attemptResult] = await connection.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, score, total_marks)
       VALUES (?, ?, ?, ?)`,
      [id, user.id, calculatedScore, totalMarks]
    );

    const attemptId = attemptResult.insertId;

    // 2. Save individual answers
    for (const evaluated of evaluatedAnswers) {
      await connection.query(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, marks_awarded)
         VALUES (?, ?, ?, ?, ?)`,
        [
          attemptId,
          evaluated.questionId,
          evaluated.selectedOptionId,
          evaluated.isCorrect ? 1 : 0,
          evaluated.marksAwarded,
        ]
      );
    }

    await connection.commit();

    const percentage = totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Quiz submitted and marked successfully.',
      data: {
        attemptId,
        quizId: Number(id),
        quizTitle: quiz.title,
        score: calculatedScore,
        totalMarks,
        percentage,
        answers: evaluatedAnswers,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting quiz attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate and save quiz submission.',
    });
  } finally {
    connection.release();
  }
}

// GET /api/quizzes/:id/attempts
async function getQuizAttempts(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    let query = `
      SELECT 
        qa.id,
        qa.quiz_id,
        qa.student_id,
        qa.score,
        qa.total_marks,
        qa.submitted_at,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        u.email AS student_email
      FROM quiz_attempts qa
      JOIN users u ON qa.student_id = u.id
      WHERE qa.quiz_id = ?
    `;
    const params = [id];

    if (user.role === 'STUDENT') {
      query += ` AND qa.student_id = ?`;
      params.push(user.id);
    }

    query += ` ORDER BY qa.submitted_at DESC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        id: r.id,
        quizId: r.quiz_id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        score: r.score,
        totalMarks: r.total_marks,
        percentage: r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0,
        submittedAt: r.submitted_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts.',
    });
  }
}

// GET /api/quizzes/:id/my-attempt
async function getMyLatestAttempt(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [attempts] = await pool.query(
      `SELECT id, score, total_marks, submitted_at
       FROM quiz_attempts
       WHERE quiz_id = ? AND student_id = ?
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [id, user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No previous attempts found.',
      });
    }

    const attempt = attempts[0];

    // Get answers with questions and options breakdown
    const [answers] = await pool.query(
      `SELECT 
        qa.question_id,
        qa.selected_option_id,
        qa.is_correct,
        qa.marks_awarded,
        qq.question_text,
        qq.marks AS question_marks,
        qo_correct.id AS correct_option_id,
        qo_correct.option_text AS correct_option_text,
        qo_selected.option_text AS selected_option_text
       FROM quiz_answers qa
       JOIN quiz_questions qq ON qa.question_id = qq.id
       LEFT JOIN quiz_options qo_selected ON qa.selected_option_id = qo_selected.id
       LEFT JOIN quiz_options qo_correct ON qo_correct.question_id = qq.id AND qo_correct.is_correct = 1
       WHERE qa.attempt_id = ?
       ORDER BY qq.id ASC`,
      [attempt.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: attempt.score,
        totalMarks: attempt.total_marks,
        percentage: attempt.total_marks > 0 ? Math.round((attempt.score / attempt.total_marks) * 100) : 0,
        submittedAt: attempt.submitted_at,
        answers: answers.map((a) => ({
          questionId: a.question_id,
          questionText: a.question_text,
          marks: a.question_marks,
          selectedOptionId: a.selected_option_id,
          selectedOptionText: a.selected_option_text,
          correctOptionId: a.correct_option_id,
          correctOptionText: a.correct_option_text,
          isCorrect: Boolean(a.is_correct),
          marksAwarded: a.marks_awarded,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching latest attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attempt details.',
    });
  }
}

module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublishQuiz,
  submitQuiz,
  getQuizAttempts,
  getMyLatestAttempt,
};
