import React from 'react';
import { Menu, GraduationCap, LogOut, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  const roleBadgeStyles = {
    ADMIN: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    TEACHER: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    STUDENT: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
    PARENT: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  };

  const roleName = user?.role || 'STUDENT';
  const badgeStyle = roleBadgeStyles[roleName] || roleBadgeStyles.STUDENT;

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[#0B1F4D] text-white border-b border-blue-900/60 shadow-md">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-sky-200 hover:text-white hover:bg-blue-900/60 focus:outline-hidden transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl shadow-xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white leading-none">
                  Wishwin
                </span>
                <span className="text-[10px] font-bold bg-blue-500/30 text-sky-300 px-1.5 py-0.5 rounded border border-blue-400/20 tracking-wider">
                  LMS
                </span>
              </div>
              <p className="text-[11px] text-sky-300/80 font-medium hidden sm:block leading-tight mt-0.5">
                Education Center
              </p>
            </div>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Role badge */}
          <span
            className={`hidden xs:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
          >
            {roleName}
          </span>

          {/* User profile dropdown / preview */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-blue-900/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-sky-300/80 font-normal leading-tight">
                {user?.email}
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="ml-1 sm:ml-2 p-2 rounded-xl text-sky-200 hover:text-white hover:bg-red-600/80 focus:outline-hidden transition group"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
