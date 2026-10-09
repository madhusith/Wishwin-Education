import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { Video, FileText, CheckSquare, BookOpen, PlaySquare, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.firstName || 'Teacher'}!`}
        subtitle="Manage your assigned classes, schedule live sessions, publish recordings, upload PDF tutes, and configure online quizzes."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">
            Teacher Portal
          </span>
        }
      />

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          to="/teacher/classes"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Assigned Classes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              View your academic classes, enrolled students, and syllabus schedule.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Classes &rarr;
          </span>
        </Link>

        <Link
          to="/teacher/live-classes"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-red-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Live Classes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Schedule interactive sessions, configure LiveKit rooms, and start classes.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Live Sessions &rarr;
          </span>
        </Link>

        <Link
          to="/teacher/recorded-lessons"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Recorded Lessons
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Embed YouTube unlisted video lessons for students to replay anytime.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Recordings &rarr;
          </span>
        </Link>

        <Link
          to="/teacher/learning-materials"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              PDF Tutes & Notes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload class worksheets, revision tutorials, and study notes for students.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Upload Materials &rarr;
          </span>
        </Link>

        <Link
          to="/teacher/quizzes"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Online Quizzes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Create MCQ quizzes, set pass marks and time limits, and review student results.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Create Quizzes &rarr;
          </span>
        </Link>

        <Link
          to="/teacher/announcements"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Class Announcements
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Broadcast urgent reminders, class schedule changes, and notices to students.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Post Announcement &rarr;
          </span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
