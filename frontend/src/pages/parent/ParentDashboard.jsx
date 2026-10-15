import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  Calendar,
  Bell,
  BookOpen,
  User,
  Video,
  Award,
  BarChart3,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, annRes] = await Promise.all([
        api.get('/parent/child-summary'),
        api.get('/announcements'),
      ]);
      setSummaryData(summaryRes.data?.data || null);
      setAnnouncements(annRes.data?.data || []);
    } catch (err) {
      console.error('Error loading parent dashboard:', err);
      setError('Failed to load child information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const child = summaryData?.child;
  const enrolledClasses = summaryData?.enrolledClasses || [];
  const quizAttempts = summaryData?.quizAttempts || [];
  const liveClasses = summaryData?.liveClasses || [];
  const stats = summaryData?.stats || {
    enrolledClassesCount: 0,
    quizzesAttemptedCount: 0,
    avgScorePercentage: 0,
    upcomingLiveCount: 0,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.firstName || 'Parent'}!`}
        subtitle="Overview of your child's learning schedule, academic progress, and center announcements."
        breadcrumbs={[{ label: 'Parent', href: '/parent/dashboard' }, { label: 'Dashboard' }]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message="Loading dashboard information..." />
      ) : !child ? (
        <EmptyState
          icon={User}
          title="No Student Linked"
          description="There are currently no active students linked to this parent account."
        />
      ) : (
        <div className="space-y-5">
          {/* Linked Student Strip - Simple & Clean */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-slate-500">Student:</span>
              <strong className="text-slate-900 font-bold text-sm">{child.name}</strong>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {enrolledClasses[0]?.grade_name || 'Grade 5'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {child.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/parent/student-details"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Profile & Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Clean Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Classes</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.enrolledClassesCount}</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-emerald-600 uppercase">Avg Quiz Marks</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats.avgScorePercentage}%</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-blue-600 uppercase">Tests Done</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{stats.quizzesAttemptedCount}</p>
            </Link>

            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-amber-600 uppercase">Live Sessions</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{liveClasses.length}</p>
            </Link>
          </div>

          {/* Two-Column Grid: Live Schedule & Center Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Live Class Schedule */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Live Classes</h3>
                </div>
                <Link
                  to="/parent/classes"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View Schedule &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {liveClasses.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No live sessions.</p>
                ) : (
                  liveClasses.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{session.title}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              session.status === 'LIVE'
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : session.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {session.className} &bull; Teacher: {session.teacherName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-700">
                          {new Date(session.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {session.startTime.substring(0, 5)} - {session.endTime.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center Notices */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Center Notices</h3>
                </div>
                <Link
                  to="/parent/announcements"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  All Notices &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No notices posted.</p>
                ) : (
                  announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            ann.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : ann.priority === 'IMPORTANT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {ann.priority}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ann.created_at || ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{ann.title}</p>
                      <p className="text-slate-600 text-xs line-clamp-1">{ann.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
