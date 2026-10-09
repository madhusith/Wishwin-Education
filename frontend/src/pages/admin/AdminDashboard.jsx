import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  Users,
  BookOpen,
  UserCheck,
  Bell,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.response?.data?.message || 'Unable to load administration statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="System Administration"
        subtitle="Manage student registrations, teacher assignments, grade levels, classes, enrollments, and global announcements."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 uppercase tracking-wider border border-purple-200">
            Administrator
          </span>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchStats} className="mb-6" />}

      {/* Summary Cards Grid (Step E1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3"><LoadingSpinner size="sm" message="" /></div>
          ) : (
            <p className="text-3xl font-extrabold text-[#0B1F4D] mt-3">
              {stats.totalStudents}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">Enrolled and active students</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Teachers
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3"><LoadingSpinner size="sm" message="" /></div>
          ) : (
            <p className="text-3xl font-extrabold text-[#0B1F4D] mt-3">
              {stats.totalTeachers}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">Academic subject teachers</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Classes
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3"><LoadingSpinner size="sm" message="" /></div>
          ) : (
            <p className="text-3xl font-extrabold text-[#0B1F4D] mt-3">
              {stats.totalClasses}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">Active grade & subject classes</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Announcements
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <div className="mt-3"><LoadingSpinner size="sm" message="" /></div>
          ) : (
            <p className="text-3xl font-extrabold text-[#0B1F4D] mt-3">
              {stats.activeAnnouncements}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">Live announcements displayed</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
        <Link
          to="/admin/users"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              User Management
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create teacher profiles, monitor students, and manage account statuses.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/classes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Class Management
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create new grade classes, assign teachers, and manage academic subjects.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Classes <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/enrollments"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Enrollment Management
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enroll students into their respective classes and view class rosters.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Enrollments <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/announcements"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Announcements
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Publish urgent notices, center schedules, and class reminders.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Notices <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
