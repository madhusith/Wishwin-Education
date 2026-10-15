# Database Directory

Contains the MySQL database schema and seed data scripts for Wishwin LMS Platform (Phase 1).

## Files
- `schema.sql`: Contains full database definition for all 14 core tables:
  1. `users` (Admin, Teacher, Student, Parent)
  2. `grades` (Grade 3, Grade 4, Grade 5)
  3. `classes` (Class details, assigned teacher, grade link)
  4. `enrollments` (Student class enrollments)
  5. `parent_students` (Parent-to-child relationship mapping)
  6. `live_classes` (LiveKit/Zoom schedule and room details)
  7. `recorded_lessons` (YouTube unlisted video lessons)
  8. `learning_materials` (PDF tutes, worksheets, notes)
  9. `quizzes` (In-built LMS tests, Google Form links, and dual options)
  10. `quiz_questions` (MCQ questions and marks)
  11. `quiz_options` (Answer choices with correct answer flag)
  12. `quiz_attempts` (Student submission scores and percentage)
  13. `quiz_answers` (Student option choices and marks awarded)
  14. `announcements` (Targeted banner notices)
- `seed.sql`: Default initial users and demo class with Grade 5 enrollment.
