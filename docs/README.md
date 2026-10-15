# Wishwin LMS Platform — Phase 1 Documentation

## Architecture & API Overview

### User Roles & Capabilities
- **Administrator**: User management, class creation, teacher assignments, student enrollments, center announcements.
- **Teacher**: Class syllabus, LiveKit/Zoom live session scheduling, YouTube recorded lessons, PDF learning material uploads, Online MCQ & Google Form quiz builder, student submissions grading review.
- **Student**: Join live sessions, replay recorded lessons, in-app PDF previewer and downloads, online timed MCQ tests with automated grading and review.
- **Parent**: Dedicated Parent Portal with 3 tabs:
  - **Overview & Notices**: Weekly schedule and center notices.
  - **Student Details**: Child identification, enrolled grade, class, and teacher contact info.
  - **Academic Status & Progress**: Real-time quiz marks, percentage breakdown, and live class attendance status.

### Core API Endpoints
- `/api/auth`: Login, register, token verification
- `/api/admin`: User, class, and enrollment management
- `/api/classes`: Grades and class directory
- `/api/announcements`: Target-specific announcements
- `/api/live-classes`: LiveKit session schedule and tokens
- `/api/recordings`: Recorded video lessons
- `/api/materials`: PDF tutes, worksheets, notes
- `/api/quizzes`: Dual format quiz management, student submissions, and auto-scoring
- `/api/parent`: Child summary, quiz marks, and academic status
