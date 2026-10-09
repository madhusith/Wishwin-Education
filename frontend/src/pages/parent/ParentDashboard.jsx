import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { Calendar, Bell, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.firstName || 'Parent'}!`}
        subtitle="Monitor your child's basic class information, weekly learning schedule, and center announcements."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-200">
            Parent Portal
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">
        <Link
          to="/parent/classes"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Child Class Information
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              View registered grade, class timetable, and teacher contact information.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Classes &rarr;
          </span>
        </Link>

        <Link
          to="/parent/announcements"
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Center Announcements
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Stay informed about center notices, holiday schedules, and scholarship exam dates.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Notices &rarr;
          </span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
