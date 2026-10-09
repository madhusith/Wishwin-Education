import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { Video, FileText, CheckSquare, PlaySquare, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Student'}! 👋`}
        subtitle="Access your scheduled live classes, recorded lessons, PDF tutes, and interactive quizzes."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200">
            Student Portal
          </span>
        }
      />

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/student/live-classes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-red-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Live Classes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Join interactive live sessions with your teacher and classmates.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Join Live &rarr;
          </span>
        </Link>

        <Link
          to="/student/recorded-lessons"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Recorded Lessons
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Rewatch past lessons anytime to revise challenging scholarship topics.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Watch Lessons &rarr;
          </span>
        </Link>

        <Link
          to="/student/learning-materials"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              PDF Tutes & Notes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Download scholarship papers, worksheets, and class notes.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Download Tutes &rarr;
          </span>
        </Link>

        <Link
          to="/student/quizzes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Online Quizzes
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Test your knowledge with timed MCQ practice tests and check results.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Start Quiz &rarr;
          </span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
