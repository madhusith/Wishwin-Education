import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  PlaySquare,
  FileText,
  HelpCircle,
  Bell,
  GraduationCap,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  // Navigation schema per role based on Development Guide Phase 1 Scope
  const navConfigs = {
    ADMIN: [
      { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'Class Management', path: '/admin/classes', icon: BookOpen },
      { label: 'Enrollments', path: '/admin/enrollments', icon: UserCheck },
      { label: 'Announcements', path: '/admin/announcements', icon: Bell },
    ],
    TEACHER: [
      { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
      { label: 'Assigned Classes', path: '/teacher/classes', icon: BookOpen },
      { label: 'Live Classes', path: '/teacher/live-classes', icon: Video },
      { label: 'Recorded Lessons', path: '/teacher/recorded-lessons', icon: PlaySquare },
      { label: 'PDF Materials', path: '/teacher/learning-materials', icon: FileText },
      { label: 'Online Quizzes', path: '/teacher/quizzes', icon: HelpCircle },
      { label: 'Announcements', path: '/teacher/announcements', icon: Bell },
    ],
    STUDENT: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Live Classes', path: '/student/live-classes', icon: Video },
      { label: 'Recorded Lessons', path: '/student/recorded-lessons', icon: PlaySquare },
      { label: 'PDF Tutes & Notes', path: '/student/learning-materials', icon: FileText },
      { label: 'Online Quizzes', path: '/student/quizzes', icon: HelpCircle },
      { label: 'Announcements', path: '/student/announcements', icon: Bell },
    ],
    PARENT: [
      { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
      { label: 'Child Classes', path: '/parent/classes', icon: BookOpen },
      { label: 'Announcements', path: '/parent/announcements', icon: Bell },
    ],
  };

  const navItems = navConfigs[role] || navConfigs.STUDENT;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar header (mobile only) */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Navigation</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role tag */}
      <div className="px-5 pt-5 pb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
          {role} Workspace
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 group-hover:scale-105'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-800 truncate">
            Wishwin LMS Phase 1
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Academic Release 1.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
