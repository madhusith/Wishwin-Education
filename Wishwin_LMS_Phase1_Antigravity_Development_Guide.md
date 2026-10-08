# Wishwin LMS Platform — Phase 1 Development Guide for Antigravity

## 1. Project Goal

Build the first working release of the **Wishwin LMS Platform** for Wishwin Education Center. The first release should focus only on the client's most important requested features and should be simple, stable, responsive, and suitable for approximately **500 students**.

### Core Phase 1 Features

1. User Registration
2. User Login
3. Role-Based Access
4. Live Classes
5. Recorded Lessons
6. PDF Tutes / Learning Materials
7. Online Quizzes
8. Always-Visible Announcement Banner

The system should be designed so future features can be added later without rebuilding the whole application.

---

# 2. Phase 1 Scope

## 2.1 Student

- Register
- Login
- View student dashboard
- View announcement banner
- View class schedule
- Join live classes
- Watch recorded lessons
- Access PDF tutes, notes, and learning materials
- Attempt online quizzes
- Submit quizzes
- View quiz results

## 2.2 Teacher

- Login
- View teacher dashboard
- View assigned classes
- Create/manage live class details
- Add YouTube recorded lesson links
- Upload PDF tutes, notes, and worksheets
- Create quizzes
- Add MCQ questions and options
- Set correct answers
- Publish quizzes
- Create/publish announcements

## 2.3 Administrator

- Login
- View admin dashboard
- Manage users
- Manage roles
- Manage grades and classes
- Assign teachers
- Manage student enrollments
- Manage announcements
- View basic system information

## 2.4 Parent

For the first release, keep parent functionality minimal unless the client requests more during implementation.

Minimum parent features:

- Register
- Login
- View linked child's basic class information
- View announcements

Do not build advanced parent monitoring yet.

---

# 3. Out of Scope for This Release

Do **not** build these now:

- AI learning assistant
- AI chatbot
- AI voice assistant
- Weak-area identification
- Personalized recommendations
- Gamification
- Points
- Badges
- Streaks
- Leaderboards
- Online payment gateway
- Advanced payment automation
- Advanced analytics
- Native mobile app
- Multi-branch management
- SMS notifications
- Push notifications

Keep the architecture modular so these can be added later.

---

# 4. Recommended Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

- Node.js
- Express.js

## Database

Development:
- MySQL locally

Production:
- Amazon RDS for MySQL

## Authentication

- JWT
- bcrypt / bcryptjs

## File Storage

- Amazon S3

Use S3 for:
- PDF tutes
- Notes
- Worksheets
- Other downloadable learning files

## Recorded Lessons

- YouTube Unlisted Videos
- Embedded inside the LMS

Do not upload large recorded videos to the LMS server.

## Live Classes

Preferred:
- LiveKit Cloud

Fallback:
- Zoom meeting link integration

For the first implementation, build the live-class module so the provider can be changed later.

## Deployment

Frontend:
- AWS Amplify

Backend:
- AWS Lightsail or EC2

Database:
- Amazon RDS

Files:
- Amazon S3

---

# 5. Suggested Project Structure

```text
wishwin-lms/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.jsx
│   ├── public/
│   ├── .env
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── TESTING.md
│
├── .gitignore
└── README.md
```

---

# 6. Development Rules for Antigravity

Antigravity should follow these rules throughout development:

1. Complete one module at a time.
2. Do not build future-scope features unless explicitly requested.
3. Inspect existing files before changing them.
4. Do not overwrite working code unnecessarily.
5. Run the frontend/backend after each major feature.
6. Fix errors before proceeding.
7. Use reusable components.
8. Use clear names for files, variables, routes, and APIs.
9. Do not hardcode passwords, JWT secrets, database credentials, or AWS keys.
10. Use `.env` files for secrets.
11. Protect private routes with authentication.
12. Enforce role-based access.
13. Verify student enrollment before allowing class content access.
14. Verify teacher assignment before allowing content editing.
15. Add loading, empty, success, and error states.
16. Make the UI responsive for desktop, tablet, and mobile.
17. Keep the interface simple and not bulky.
18. Suggest a Git commit message after each major working feature.

Priority:

```text
STABILITY > CORE FUNCTIONALITY > UI POLISH > FUTURE FEATURES
```

---

# 7. User Roles

Create these roles:

```text
STUDENT
PARENT
TEACHER
ADMIN
```

Role redirects:

```text
STUDENT -> /student/dashboard
PARENT -> /parent/dashboard
TEACHER -> /teacher/dashboard
ADMIN -> /admin/dashboard
```

---

# 8. Database Design

Create the following core tables.

## 8.1 users

```text
id
first_name
last_name
email
phone
password_hash
role
status
created_at
updated_at
```

Role values:

```text
STUDENT
PARENT
TEACHER
ADMIN
```

Status values:

```text
ACTIVE
INACTIVE
```

## 8.2 grades

```text
id
name
description
created_at
```

Seed:

```text
Grade 3
Grade 4
Grade 5
```

## 8.3 classes

```text
id
grade_id
name
teacher_id
description
status
created_at
updated_at
```

## 8.4 enrollments

```text
id
student_id
class_id
status
enrolled_at
```

## 8.5 live_classes

```text
id
class_id
title
description
provider
meeting_url
room_name
scheduled_date
start_time
end_time
status
created_by
created_at
updated_at
```

Provider values:

```text
LIVEKIT
ZOOM
OTHER
```

## 8.6 recorded_lessons

```text
id
class_id
title
description
youtube_url
youtube_video_id
topic
published
created_by
created_at
updated_at
```

## 8.7 learning_materials

```text
id
class_id
title
description
topic
file_url
file_key
file_type
published
created_by
created_at
updated_at
```

## 8.8 quizzes

```text
id
class_id
title
description
instructions
published
created_by
created_at
updated_at
```

## 8.9 quiz_questions

```text
id
quiz_id
question_text
question_type
marks
created_at
updated_at
```

Initial type:

```text
MCQ
```

## 8.10 quiz_options

```text
id
question_id
option_text
is_correct
```

## 8.11 quiz_attempts

```text
id
quiz_id
student_id
score
total_marks
submitted_at
```

## 8.12 quiz_answers

```text
id
attempt_id
question_id
selected_option_id
is_correct
marks_awarded
```

## 8.13 announcements

```text
id
title
message
priority
target_type
target_class_id
active
start_date
end_date
created_by
created_at
updated_at
```

Priority:

```text
NORMAL
IMPORTANT
URGENT
```

Target type:

```text
ALL
STUDENTS
PARENTS
TEACHERS
CLASS
```

---

# 9. STEP-BY-STEP BUILD PLAN

# PHASE A — Project Setup

## Step A1 — Create Project

```bash
mkdir wishwin-lms
cd wishwin-lms
git init
mkdir frontend backend database docs
```

Create `.gitignore`:

```text
node_modules
.env
dist
uploads
.DS_Store
```

Commit:

```bash
git add .
git commit -m "chore: initialize Wishwin LMS project"
```

## Step A2 — Create React Frontend

```bash
npm create vite@latest frontend
```

Select:

```text
React
JavaScript
```

Then:

```bash
cd frontend
npm install
npm install react-router-dom axios
```

Configure Tailwind CSS using the current Vite-compatible installation method.

Run:

```bash
npm run dev
```

Confirm the frontend loads correctly.

Commit:

```bash
git add .
git commit -m "chore: initialize React frontend"
```

## Step A3 — Create Express Backend

```bash
cd ../backend
npm init -y
npm install express cors dotenv mysql2 jsonwebtoken bcryptjs multer
npm install -D nodemon
```

Add later for AWS:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

Create:

```text
src/app.js
server.js
```

Create endpoint:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "Wishwin LMS API"
}
```

Run backend and verify it works.

Commit:

```bash
git add .
git commit -m "chore: initialize Express backend"
```

---

# PHASE B — Database

## Step B1 — Create Database

```sql
CREATE DATABASE wishwin_lms;
USE wishwin_lms;
```

Create the tables listed in Section 8.

Add foreign keys and indexes.

Important indexes:

```text
users.email
classes.grade_id
classes.teacher_id
enrollments.student_id
enrollments.class_id
live_classes.class_id
recorded_lessons.class_id
learning_materials.class_id
quizzes.class_id
quiz_attempts.student_id
announcements.active
```

## Step B2 — Seed Data

Insert:

```text
Grade 3
Grade 4
Grade 5
```

Create one initial admin account with a hashed password.

## Step B3 — Database Connection

Create:

```text
backend/src/config/database.js
```

Use `mysql2/promise`.

Environment variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wishwin_lms
DB_USER=root
DB_PASSWORD=
```

Test database connection before continuing.

Commit:

```bash
git add .
git commit -m "feat: configure MySQL database"
```

---

# PHASE C — Registration, Login & RBAC

## Step C1 — Student/Parent Registration

Create:

```text
POST /api/auth/register
```

Fields:

```text
firstName
lastName
email
phone
password
role
```

Public registration allowed only for:

```text
STUDENT
PARENT
```

Do not allow public registration as:

```text
TEACHER
ADMIN
```

Validate:
- required fields
- valid email
- unique email
- password length

Hash password using bcrypt.

## Step C2 — Login

Create:

```text
POST /api/auth/login
```

Input:

```json
{
  "email": "",
  "password": ""
}
```

Return:

```json
{
  "token": "...",
  "user": {
    "id": 1,
    "name": "...",
    "role": "STUDENT"
  }
}
```

JWT payload:

```text
userId
role
```

## Step C3 — Authentication Middleware

Create:

```text
backend/src/middleware/authMiddleware.js
```

Responsibilities:
- read Bearer token
- verify JWT
- attach user to request
- reject invalid/expired tokens

## Step C4 — Role Middleware

Create helpers such as:

```text
requireRole("ADMIN")
requireRoles(["ADMIN", "TEACHER"])
```

## Step C5 — Frontend Login/Register

Create:

```text
/pages/auth/LoginPage.jsx
/pages/auth/RegisterPage.jsx
/context/AuthContext.jsx
```

For the academic first release, token can be stored in `localStorage` for simplicity. Mention in documentation that production can move to HTTP-only cookies later.

## Step C6 — Protected Routes

Implement protected routing and role redirects.

Test all roles.

Commit:

```bash
git add .
git commit -m "feat: implement authentication and role-based access"
```

---

# PHASE D — Shared Layout & Announcement Banner

## Step D1 — Reusable Components

Create:

```text
Navbar
Sidebar
DashboardLayout
PageHeader
LoadingSpinner
EmptyState
ErrorMessage
ConfirmDialog
```

## Step D2 — Announcement Banner

Create:

```text
AnnouncementBanner.jsx
```

The banner should appear at the top of relevant dashboards.

Examples:

```text
📢 Grade 5 Revision Class this Saturday.
```

```text
🔴 URGENT: Today's live class starts at 6:30 PM.
```

Behavior:
- always visible when active announcements exist
- highest priority first
- latest announcement first within same priority
- expired announcements hidden automatically
- filter by role/class

---

# PHASE E — Admin Core

Build admin first because classes and enrollments are required by teacher/student modules.

## Step E1 — Admin Dashboard

Route:

```text
/admin/dashboard
```

Show simple summary cards:

```text
Total Students
Total Teachers
Total Classes
Active Announcements
```

No advanced analytics yet.

## Step E2 — User Management

API:

```text
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
PATCH  /api/admin/users/:id/status
```

Admin can create teacher accounts.

## Step E3 — Class Management

API:

```text
GET    /api/classes
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
```

Fields:

```text
grade
class name
teacher
description
status
```

## Step E4 — Teacher Assignment

Allow admin to assign teachers to classes.

Teacher must only manage assigned classes.

## Step E5 — Enrollment Management

Admin can:
- view students
- enroll students
- remove students from a class
- view class student list

Commit:

```bash
git add .
git commit -m "feat: implement admin user class and enrollment management"
```

---

# PHASE F — Announcement Module

## Step F1 — APIs

```text
GET    /api/announcements
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
```

Teacher:
- class announcements only for assigned classes

Admin:
- global or targeted announcements

## Step F2 — Banner Integration

Fetch active announcements after login/dashboard load.

Filter by:
- active status
- start/end date
- role
- class
- priority

Test:

```text
Admin creates urgent announcement
Student logs in
Banner displays announcement
```

Commit:

```bash
git add .
git commit -m "feat: implement announcement management and banner"
```

---

# PHASE G — Live Classes

## Step G1 — Teacher Live Class Page

Route:

```text
/teacher/live-classes
```

Teacher can:
- select assigned class
- enter title
- description
- date
- start/end time
- provider
- LiveKit room or meeting URL
- publish/edit/cancel

## Step G2 — Student Live Class Page

Route:

```text
/student/live-classes
```

Display:

```text
Class
Title
Date
Time
Status
Join button
```

Only enrolled students can access.

## Step G3 — LiveKit Flow

Preferred flow:

```text
Student clicks Join
↓
Frontend requests token
↓
Backend verifies enrollment
↓
Backend generates LiveKit token
↓
Student joins room
```

Create:

```text
POST /api/live/token
```

Never expose LiveKit API secrets in the frontend.

## Step G4 — Zoom Fallback

If LiveKit is not ready, support:

```text
provider = ZOOM
meeting_url = https://...
```

Commit:

```bash
git add .
git commit -m "feat: implement live class management"
```

---

# PHASE H — Recorded Lessons

## Step H1 — Teacher Recording Management

Route:

```text
/teacher/recordings
```

Fields:

```text
Title
Class
Topic
Description
YouTube URL
```

Validate URL and extract YouTube video ID.

Store both URL and video ID.

## Step H2 — Student Recorded Lessons

Route:

```text
/student/recordings
```

Show:
- thumbnail
- title
- topic
- class
- watch button

Embed video inside LMS.

## Step H3 — Access Control

Student:
- only recordings for enrolled classes

Teacher:
- only recordings for assigned classes

Commit:

```bash
git add .
git commit -m "feat: implement recorded lesson module"
```

---

# PHASE I — PDF Tutes / Learning Materials

## Step I1 — Configure S3

Environment variables:

```env
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

Never commit credentials.

## Step I2 — Upload API

Create:

```text
POST /api/materials
```

Teacher selects:

```text
Class
Title
Topic
PDF File
```

Keep Phase 1 PDF-only if possible.

## Step I3 — Validation

Check:
- PDF file type
- file size
- teacher assignment
- required fields

Suggested max size:

```text
10–20 MB per file
```

## Step I4 — Student Materials Page

Route:

```text
/student/materials
```

Display:

```text
Title
Topic
Class
View
Download
```

Only enrolled students can access.

Commit:

```bash
git add .
git commit -m "feat: implement PDF learning materials with S3"
```

---

# PHASE J — Quiz Module

## Step J1 — Teacher Quiz Management

Route:

```text
/teacher/quizzes
```

Teacher can:
- create quiz
- choose assigned class
- title
- description
- instructions
- add MCQ questions
- add answer options
- select correct answer
- set marks
- publish

## Step J2 — Quiz APIs

```text
POST   /api/quizzes
GET    /api/quizzes
GET    /api/quizzes/:id
PUT    /api/quizzes/:id
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/publish
```

## Step J3 — Student Quiz List

Route:

```text
/student/quizzes
```

Student sees only:
- published quizzes
- quizzes from enrolled classes

## Step J4 — Attempt Quiz

Route:

```text
/student/quizzes/:id/attempt
```

Show:
- question
- options
- progress
- submit button

Important:
Do not send correct-answer flags to the frontend before submission.

## Step J5 — Submit Quiz

API:

```text
POST /api/quizzes/:id/submit
```

Backend flow:

```text
1. Validate quiz
2. Validate student enrollment
3. Receive selected answers
4. Compare with correct options
5. Calculate score
6. Save attempt
7. Save answers
8. Return result
```

## Step J6 — Results

Route:

```text
/student/results
```

Show:
- quiz
- score
- total marks
- date

Do not add weak-area analysis in this release.

Commit:

```bash
git add .
git commit -m "feat: implement quiz attempts automatic marking and results"
```

---

# PHASE K — Student Dashboard

Route:

```text
/student/dashboard
```

Recommended sections:

## Announcement Banner
At the top.

## Welcome

```text
Good evening, [Student Name]
Grade 5 Scholarship Class
```

## Upcoming Live Class

```text
Next Class
Mathematics Revision
Today 6:00 PM
[Join Live]
```

## Quick Access

```text
Live Classes
Recorded Lessons
Tutes
Quizzes
Results
```

## Recent Materials
Latest 3.

## Recent Recordings
Latest 3.

---

# PHASE L — Teacher Dashboard

Route:

```text
/teacher/dashboard
```

Show:

```text
Assigned Classes
Students
Upcoming Live Classes
Published Quizzes
Recent Materials
Announcements
```

Quick actions:

```text
Create Live Class
Add Recording
Upload Tute
Create Quiz
Publish Announcement
```

---

# PHASE M — Parent Dashboard

Keep simple.

Route:

```text
/parent/dashboard
```

Show:

```text
Linked Child
Class
Schedule
Announcements
```

Move advanced progress/payment/gamification features to a later release.

---

# PHASE N — Security Hardening

Implement:

1. Password hashing
2. JWT authentication
3. Role authorization
4. Enrollment verification
5. Teacher assignment verification
6. Request-body validation
7. Upload validation
8. CORS configuration
9. Do not expose secrets
10. Add security headers
11. Add API rate limiting

Install:

```bash
npm install helmet express-rate-limit
```

---

# PHASE O — Testing

Maintain a test log.

## Authentication

```text
TC-01 Student registration
TC-02 Duplicate email rejected
TC-03 Valid login
TC-04 Invalid login rejected
TC-05 Role-based redirect
```

## Live Classes

```text
TC-06 Teacher creates live class
TC-07 Student views enrolled live class
TC-08 Unenrolled student blocked
TC-09 Student joins live class
```

## Recorded Lessons

```text
TC-10 Teacher adds YouTube recording
TC-11 Student watches embedded video
TC-12 Unenrolled student blocked
```

## Materials

```text
TC-13 Teacher uploads PDF
TC-14 Student views/downloads PDF
TC-15 Invalid file rejected
```

## Quizzes

```text
TC-16 Teacher creates quiz
TC-17 Teacher publishes quiz
TC-18 Student attempts quiz
TC-19 Quiz automatically marked
TC-20 Result saved correctly
```

## Announcements

```text
TC-21 Admin publishes announcement
TC-22 Teacher publishes class announcement
TC-23 Student sees banner
TC-24 Expired announcement hidden
```

---

# PHASE P — UI Design Rules

Suggested palette:

```text
Primary Navy: #0B1F4D
Royal Blue: #2563EB
Cyan Accent: #38BDF8
Light Blue: #EFF6FF
White: #FFFFFF
Text: #0F172A
Muted Text: #64748B
Success: #16A34A
Warning: #F59E0B
Danger: #DC2626
```

Style:

- Clean
- Modern
- Educational
- Simple
- Responsive
- Large readable controls
- Minimal animation
- Avoid bulky cards/text

---

# PHASE Q — API SUMMARY

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Users

```text
GET   /api/admin/users
POST  /api/admin/users
PUT   /api/admin/users/:id
PATCH /api/admin/users/:id/status
```

## Classes

```text
GET    /api/classes
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
```

## Enrollments

```text
GET    /api/enrollments
POST   /api/enrollments
DELETE /api/enrollments/:id
```

## Announcements

```text
GET    /api/announcements
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
```

## Live Classes

```text
GET    /api/live-classes
POST   /api/live-classes
PUT    /api/live-classes/:id
DELETE /api/live-classes/:id
POST   /api/live/token
```

## Recorded Lessons

```text
GET    /api/recorded-lessons
POST   /api/recorded-lessons
PUT    /api/recorded-lessons/:id
DELETE /api/recorded-lessons/:id
```

## Materials

```text
GET    /api/materials
POST   /api/materials
PUT    /api/materials/:id
DELETE /api/materials/:id
```

## Quizzes

```text
GET    /api/quizzes
GET    /api/quizzes/:id
POST   /api/quizzes
PUT    /api/quizzes/:id
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/publish
POST   /api/quizzes/:id/submit
```

## Results

```text
GET /api/results/me
GET /api/quizzes/:id/results
```

---

# PHASE R — Build Order

Follow this order:

```text
1. Project setup
2. Database
3. Registration/login
4. Role-based routing
5. Shared layout
6. Admin users/classes/enrollments
7. Announcement banner
8. Live classes
9. Recorded lessons
10. PDF materials
11. Quizzes
12. Quiz results
13. Student dashboard
14. Teacher dashboard
15. Basic parent dashboard
16. Security review
17. Testing
18. Responsive fixes
19. Deployment
20. Client demo
```

---

# PHASE S — Git Workflow

Suggested branches:

```text
main
develop
feature/auth
feature/admin
feature/announcements
feature/live-classes
feature/recorded-lessons
feature/materials
feature/quizzes
```

Suggested commits:

```text
feat: implement student registration
feat: add JWT authentication
feat: add role-based route protection
feat: create admin class management
feat: implement announcement banner
feat: add live class management
feat: add YouTube recorded lesson support
feat: implement S3 material uploads
feat: implement quiz creation
feat: implement quiz attempt and marking
fix: prevent unauthorized class access
style: improve student dashboard responsiveness
```

---

# PHASE T — Environment Variables

## backend/.env

```env
PORT=5000

DB_HOST=
DB_PORT=3306
DB_NAME=wishwin_lms
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=7d

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

FRONTEND_URL=http://localhost:5173
```

## frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_LIVEKIT_URL=
```

Never commit `.env`.

Create `.env.example` files with empty values.

---

# PHASE U — Completion Checklist

## Authentication

- [ ] Student can register
- [ ] Parent can register if enabled
- [ ] Users can login
- [ ] Role redirect works
- [ ] Protected routes work

## Admin

- [ ] Admin can manage users
- [ ] Admin can manage classes
- [ ] Admin can assign teachers
- [ ] Admin can manage enrollments

## Announcements

- [ ] Admin can publish announcements
- [ ] Teacher can publish class announcements
- [ ] Banner is visible
- [ ] Expired announcements are hidden

## Live Classes

- [ ] Teacher can create live class
- [ ] Student can view live classes
- [ ] Student can join
- [ ] Enrollment is checked

## Recorded Lessons

- [ ] Teacher can add YouTube link
- [ ] Video ID is stored
- [ ] Student can watch embedded recording

## Learning Materials

- [ ] Teacher can upload PDF
- [ ] File stored in S3
- [ ] Student can view/download
- [ ] Class access is checked

## Quizzes

- [ ] Teacher can create quiz
- [ ] Teacher can add MCQs
- [ ] Teacher can publish quiz
- [ ] Student can attempt quiz
- [ ] Backend marks quiz
- [ ] Result is stored
- [ ] Student can view result

## UI

- [ ] Desktop responsive
- [ ] Tablet responsive
- [ ] Mobile responsive
- [ ] Loading states exist
- [ ] Error states exist
- [ ] Empty states exist

## Security

- [ ] Passwords hashed
- [ ] JWT verified
- [ ] Roles verified
- [ ] Class access verified
- [ ] Secrets excluded from Git

---

# PHASE V — Final Phase 1 Flow

## Student

```text
Register / Login
    ↓
View Announcement Banner
    ↓
View Class Information
    ↓
Join Live Class
    ↓
Watch Recorded Lessons
    ↓
Access PDF Tutes
    ↓
Attempt Quiz
    ↓
Receive Result
```

## Teacher

```text
Login
  ↓
View Assigned Classes
  ↓
Create Live Class
  ↓
Add Recorded Lesson
  ↓
Upload Tutes
  ↓
Create & Publish Quiz
  ↓
Publish Announcement
```

## Administrator

```text
Login
  ↓
Manage Users
  ↓
Manage Classes
  ↓
Assign Teachers
  ↓
Manage Enrollments
  ↓
Manage Announcements
```

---

# 10. Definition of Done

Phase 1 is complete only when:

1. Registration and login work correctly.
2. Role-based dashboards work.
3. Students can join live classes.
4. Students can watch recorded lessons.
5. Students can access PDF learning materials.
6. Students can attempt quizzes and receive automatically calculated results.
7. Teachers can manage required learning content.
8. The announcement banner works across the LMS.
9. Admin can manage the basic academic structure.
10. The system has been tested with representative student, teacher, and admin accounts.
11. The system works on desktop and mobile-sized screens.
12. The project is pushed to GitHub with a clean README and setup instructions.

---

# 11. Instructions to Antigravity

Work through this guide in order.

For each major phase:

1. Explain what you are about to implement.
2. Inspect the current project before changing files.
3. Do not overwrite working code unnecessarily.
4. Implement the smallest complete working version.
5. Run lint/build checks where applicable.
6. Run backend and frontend.
7. Test the new feature.
8. Fix all errors before continuing.
9. Show changed files.
10. Show test results.
11. Suggest a Git commit message.
12. If working interactively, wait for confirmation before moving to the next major module.

Do not implement AI, gamification, advanced analytics, weak-area analysis, personalized recommendations, or online payment gateway during this release unless explicitly requested later.
