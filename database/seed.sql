-- Wishwin LMS Seed Data

-- Grades (3 Categories: Grade 04, Grade 05, Quiz Class)
INSERT INTO grades (id, name, description) VALUES
(2, 'Grade 04', 'Grade 04 primary scholarship education and skills development'),
(3, 'Grade 05', 'Grade 05 scholarship preparation and advanced learning'),
(4, 'Quiz Class', 'Online Quiz practice tests and assessments')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- Users (Admin, Teacher, Student, Parent)
-- Passwords:
-- admin@wishwin.edu   => Admin@12345
-- teacher@wishwin.edu => Password@12345
-- student@wishwin.edu => Password@12345
-- parent@wishwin.edu  => Password@12345
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, status) VALUES
(1, 'System', 'Admin', 'admin@wishwin.edu', '0771122334', '$2b$10$0r1wnGrdRBGK251GzfEEyeFjX4eTzf8BweyuPcKLvcsJgRPFV4tDm', 'ADMIN', 'ACTIVE'),
(2, 'Kamal', 'Perera', 'teacher@wishwin.edu', '0772233445', '$2b$10$qSsJvLF0s4YQKc918Ms2Lu7559bE4EuyCqntgdUctJqr8dH9wcF8O', 'TEACHER', 'ACTIVE'),
(3, 'Nimal', 'Silva', 'student@wishwin.edu', '0773344556', '$2b$10$qSsJvLF0s4YQKc918Ms2Lu7559bE4EuyCqntgdUctJqr8dH9wcF8O', 'STUDENT', 'ACTIVE'),
(4, 'Sunil', 'Silva', 'parent@wishwin.edu', '0774455667', '$2b$10$qSsJvLF0s4YQKc918Ms2Lu7559bE4EuyCqntgdUctJqr8dH9wcF8O', 'PARENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Classes under Grade 04, Grade 05, and Quiz Class
INSERT INTO classes (id, grade_id, name, teacher_id, description, status) VALUES
(2, 2, 'Special Paper Part 01', 2, 'Grade 04 Special Paper Part 01', 'ACTIVE'),
(3, 2, 'Special Paper Part 02', 2, 'Grade 04 Special Paper Part 02', 'ACTIVE'),
(4, 3, 'Special Paper Part 01', 2, 'Grade 05 Special Paper Part 01', 'ACTIVE'),
(5, 3, 'Special Paper Part 02', 2, 'Grade 05 Special Paper Part 02', 'ACTIVE'),
(6, 4, 'Quiz Practice Class', 2, 'Online MCQ practice quizzes', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), grade_id=VALUES(grade_id);

-- Enrollment (demo student Nimal Silva in Grade 05 Part 01 & Part 02 & Quiz Class)
INSERT INTO enrollments (student_id, class_id, status) VALUES
(3, 4, 'ACTIVE'),
(3, 5, 'ACTIVE'),
(3, 6, 'ACTIVE')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Initial Announcements
INSERT INTO announcements (id, title, message, priority, target_type, target_class_id, active, created_by) VALUES
(1, 'Grade 5 Live Class Rescheduled', 'Today\'s Grade 5 Scholarship live revision class will commence at 6:30 PM. Please have your model question papers ready before joining.', 'URGENT', 'ALL', NULL, TRUE, 1),
(2, 'New Scholarship Model Papers Uploaded', 'New model papers and revision worksheets for Grade 4 & Grade 5 are now available in the Learning Materials section for download.', 'IMPORTANT', 'ALL', NULL, TRUE, 1),
(3, 'Online Quiz Practice Challenge is Live', 'The weekly 25-question timed scholarship MCQ quiz is open for all students. Test your knowledge and review your instant score!', 'IMPORTANT', 'ALL', NULL, TRUE, 1),
(4, 'Welcome to Wishwin LMS Center', 'Welcome to the academic term. Access your live classes, recorded lessons, PDF tutorials, and interactive quizzes directly from your dashboard.', 'NORMAL', 'ALL', NULL, TRUE, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title), message=VALUES(message), priority=VALUES(priority);

-- Parent-Student Mapping (Sunil Silva -> Nimal Silva)
INSERT INTO parent_students (parent_id, student_id) VALUES
(4, 3)
ON DUPLICATE KEY UPDATE parent_id=VALUES(parent_id);

