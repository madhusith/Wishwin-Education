import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, ShieldCheck, Users, Layers, Bell, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0B1F4D] text-white border-b border-blue-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Wishwin LMS</h1>
            <p className="text-xs text-sky-300 font-medium">Administrator Control Center</p>
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 uppercase tracking-wider mb-2">
            Administrator
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            System Administration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage student registrations, teacher assignments, grade levels, classes, enrollments, and global announcements.
          </p>
        </div>

        {/* Phase E summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">User Accounts</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">Active</p>
            <p className="text-xs text-slate-400 mt-1">Students, Teachers & Parents</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Academic Classes</span>
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">Configured</p>
            <p className="text-xs text-slate-400 mt-1">Grades 3, 4, 5</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Announcements</span>
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">Active</p>
            <p className="text-xs text-slate-400 mt-1">Always-visible banners</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Security</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">Protected</p>
            <p className="text-xs text-slate-400 mt-1">JWT + Strict RBAC</p>
          </div>
        </div>
      </main>
    </div>
  );
}
