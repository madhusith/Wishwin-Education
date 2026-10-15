import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  Calendar,
  Bell,
  BookOpen,
  Clock,
  UserCheck,
  Video,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, liveRes, annRes] = await Promise.all([
        api.get('/classes'),
        api.get('/live-classes'),
        api.get('/announcements'),
      ]);
      setClasses(classesRes.data?.data || []);
      setLiveClasses(liveRes.data?.data || []);
      setAnnouncements(annRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
      setError('Failed to load parent dashboard information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.firstName || 'Parent'}!`}
        subtitle="Monitor your child's registered classes, live session schedules, and official center announcements."
        breadcrumbs={[{ label: 'Parent', href: '/parent/dashboard' }, { label: 'Dashboard' }]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message="Loading dashboard information..." />
      ) : (
        <div className="space-y-6">
          {/* Top Quick Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Enrolled Classes
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{classes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Upcoming Live Classes
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{liveClasses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Center Notices
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{announcements.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Child's Enrolled Classes Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Child Class Information</h3>
              </div>
              <Link
                to="/parent/classes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.length === 0 ? (
                <p className="text-xs text-slate-500">No active classes found.</p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        {cls.gradeName}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {cls.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                    {cls.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{cls.description}</p>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Teacher: <strong className="text-slate-800">{cls.teacherName}</strong>
                      </span>
                      {cls.teacherEmail && (
                        <span className="text-slate-400 text-[11px]">{cls.teacherEmail}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Two-Column Grid: Live Schedule & Center Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Class Schedule */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Live Class Schedule</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {liveClasses.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No live sessions scheduled at this moment.
                    </p>
                  ) : (
                    liveClasses.slice(0, 4).map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{session.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {session.class_name || session.className} &bull; Teacher:{' '}
                            {session.teacher_name || session.teacherName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-700">
                            {new Date(session.scheduled_date || session.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {session.start_time || session.startTime} - {session.end_time || session.endTime}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Center Announcements */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Recent Notices & Announcements</h3>
                  </div>
                  <Link
                    to="/parent/announcements"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    All Notices <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No current announcements for parents.
                    </p>
                  ) : (
                    announcements.slice(0, 4).map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ann.priority === 'URGENT'
                                ? 'bg-red-100 text-red-700'
                                : ann.priority === 'IMPORTANT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ann.priority}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(ann.created_at || ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900">{ann.title}</h4>
                        <p className="text-slate-600 text-xs line-clamp-2">{ann.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
