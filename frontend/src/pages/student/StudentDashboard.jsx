import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, BookOpen, Video, FileText, CheckSquare, LogOut } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0B1F4D] text-white border-b border-blue-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Wishwin LMS</h1>
            <p className="text-xs text-sky-300 font-medium">Student Portal</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-sky-300">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-900/80 hover:bg-red-600 text-sky-100 hover:text-white text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-wider mb-2">
                Student Account
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back, {user?.firstName}! 👋
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                You are registered as a Student. Access your live classes, recorded lessons, PDF tutes, and quizzes below.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Live Classes</h3>
            <p className="text-xs text-slate-500 mt-1">Join scheduled live lessons via LiveKit</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Recorded Lessons</h3>
            <p className="text-xs text-slate-500 mt-1">Watch recorded YouTube lessons</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">PDF Tutes & Notes</h3>
            <p className="text-xs text-slate-500 mt-1">Download official class materials</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Quizzes & Marks</h3>
            <p className="text-xs text-slate-500 mt-1">Attempt MCQs and see instant marks</p>
          </div>
        </div>
      </main>
    </div>
  );
}
