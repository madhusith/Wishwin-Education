# Wishwin LMS Platform

A responsive, lightweight Learning Management System built for **Wishwin Education Center** (Phase 1 Release). Designed for students preparing for Primary & Grade 5 Scholarship examinations, their teachers, parents, and administrators.

---

## Key Features

1. **Role-Based Portals**:
   - **Student Portal**: Access live classes, watch recorded lessons, view & download PDF tutes with in-app previewer, attempt interactive MCQ quizzes, and review auto-marked scores.
   - **Teacher Portal**: Schedule live classes, publish recorded lessons, upload PDF worksheets, build quizzes (LMS In-Built and Google Forms), and review student submission marks.
   - **Parent Portal**:
     - **Tab 1 — Overview & Notices**: View active classes, upcoming live timetable, and official center announcements.
     - **Tab 2 — Student Details**: Child profile, registered grade, enrolled classes, and assigned teacher contact info.
     - **Tab 3 — Child Academic Status**: Real-time quiz marks, assessment percentage, and live class attendance/join links.
   - **Admin Portal**: Manage users, classes, grades, enrollments, and system announcements.

2. **Dual Quiz System**:
   - **LMS In-Built Quiz**: Timed multiple-choice quizzes created directly on the platform with automated grading, instant score calculation, and post-submission answers review.
   - **Google Form Quiz**: Direct links to external Google Forms. When configured by the teacher, students see an "Open Google Form Quiz" button; when omitted, the button remains hidden.

3. **In-LMS PDF Viewer**:
   - Embedded preview for PDF tutes and worksheets with download and direct tab opening options.

4. **Always-Visible Announcement Banner**:
   - Auto-sliding high-priority notices visible across all dashboards.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6
- **Backend**: Node.js, Express 5, MySQL (`mysql2/promise`), JWT, Helmet, Multer
- **Database**: MySQL 8.x (14 relational tables)

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env with DB credentials and JWT_SECRET
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Default Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@wishwin.edu` | `Admin@12345` |
| **Teacher** | `teacher@wishwin.edu` | `Password@12345` |
| **Student** | `student@wishwin.edu` | `Password@12345` |
| **Parent** | `parent@wishwin.edu` | `Password@12345` |
