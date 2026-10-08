-- Wishwin LMS Seed Data

-- Grades (Step B2)
INSERT INTO grades (id, name, description) VALUES
(1, 'Grade 3', 'Grade 3 primary education and foundation courses'),
(2, 'Grade 4', 'Grade 4 primary education and skills development'),
(3, 'Grade 5', 'Grade 5 scholarship preparation and advanced learning')
ON DUPLICATE KEY UPDATE name=VALUES(name);

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

-- Demo Class
INSERT INTO classes (id, grade_id, name, teacher_id, description, status) VALUES
(1, 3, 'Grade 5 Scholarship Mathematics', 2, 'Comprehensive mathematics and problem-solving class for Grade 5 scholarship students', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Enrollment
INSERT INTO enrollments (id, student_id, class_id, status) VALUES
(1, 3, 1, 'ACTIVE')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Initial Announcement
INSERT INTO announcements (id, title, message, priority, target_type, target_class_id, active, created_by) VALUES
(1, 'Welcome to Wishwin LMS!', 'Welcome to the new academic term. Check your dashboard for live class schedules and learning materials.', 'NORMAL', 'ALL', NULL, TRUE, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);
