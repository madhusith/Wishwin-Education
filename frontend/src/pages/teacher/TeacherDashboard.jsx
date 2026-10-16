import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Video,
  FileText,
  CheckSquare,
  BookOpen,
  PlaySquare,
  Bell,
  Users,
  Calendar,
  Clock,
  PlusCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [classes, setClasses] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const [classRes, liveRes, matRes, quizRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/live-classes'),
        api.get('/materials'),
        api.get('/quizzes'),
      ]);

      if (classRes.status === 'fulfilled') setClasses(classRes.value.data?.data || []);
      if (liveRes.status === 'fulfilled') setLiveSessions(liveRes.value.data?.data || []);
      if (matRes.status === 'fulfilled') setMaterials(matRes.value.data?.data || []);
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value.data?.data || []);
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0);
  const nextLiveClass = liveSessions.find((s) => s.status === 'LIVE') ||
    liveSessions.find((s) => s.status === 'SCHEDULED');

  return (
    <DashboardLayout>
      <PageHeader
        title={`${t('teacherWelcome')}, ${user?.firstName || t('roleTeacher')}! 👋`}
        subtitle={t('teacherSubtitle')}
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">
            {t('teacherPortalBadge')}
          </span>
        }
      />

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Quick Metrics Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{classes.length}</p>
                <p className="text-xs text-slate-500 font-medium">{t('teacherStatClasses')}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{totalStudents}</p>
                <p className="text-xs text-slate-500 font-medium">{t('teacherStatStudents')}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{liveSessions.length}</p>
                <p className="text-xs text-slate-500 font-medium">{t('teacherStatLive')}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{quizzes.length}</p>
                <p className="text-xs text-slate-500 font-medium">{t('teacherStatQuizzes')}</p>
              </div>
            </div>
          </div>

          {/* Next Scheduled / Live Session Spotlight */}
          {nextLiveClass && (
            <div className="mb-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      nextLiveClass.status === 'LIVE'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-emerald-500/40 text-emerald-100 border border-emerald-400/30'
                    }`}
                  >
                    {nextLiveClass.status === 'LIVE' ? '● LIVE RIGHT NOW' : 'NEXT UPCOMING SESSION'}
                  </span>
                  <span className="text-xs text-emerald-200 font-semibold">
                    {nextLiveClass.className}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {nextLiveClass.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/90 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    {new Date(nextLiveClass.scheduledDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-300" />
                    {nextLiveClass.startTime?.substring(0, 5)} - {nextLiveClass.endTime?.substring(0, 5)}
                  </span>
                </div>
              </div>

              <Link
                to="/teacher/live-classes"
                className="shrink-0 self-start sm:self-center px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <Video className="w-4 h-4 text-emerald-700" />
                <span>{nextLiveClass.status === 'LIVE' ? 'Enter Classroom' : 'Launch Session Room'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </Link>
            </div>
          )}

          {/* Quick Action Buttons Row */}
          <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t('teacherQuickActions')}:
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/teacher/live-classes"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-red-600 hover:border-red-300 transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-red-500" />
                Schedule Class
              </Link>
              <Link
                to="/teacher/learning-materials"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-sky-500" />
                Upload Tute
              </Link>
              <Link
                to="/teacher/quizzes"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                Create Quiz
              </Link>
              <Link
                to="/teacher/announcements"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-amber-600 hover:border-amber-300 transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
                Post Notice
              </Link>
            </div>
          </div>

          {/* Two-Column Section: Upcoming Live Sessions & Recent Uploads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Upcoming Live Sessions List */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{t('teacherUpcomingLive')}</h3>
                </div>
                <Link
                  to="/teacher/live-classes"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  {t('actionViewAll')} &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {liveSessions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No scheduled live classes.</p>
                ) : (
                  liveSessions.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs hover:border-slate-300 transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.className} • {new Date(item.scheduledDate).toLocaleDateString()} ({item.startTime?.substring(0, 5)})
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.status === 'LIVE'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'COMPLETED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Uploaded Materials & Quizzes */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{t('teacherRecentUploads')}</h3>
                </div>
                <Link
                  to="/teacher/learning-materials"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  {t('actionViewAll')} &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {materials.length === 0 && quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No materials or quizzes created yet.</p>
                ) : (
                  materials.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs hover:border-slate-300 transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.className} {item.topic ? `• ${item.topic}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 shrink-0">
                        PDF TUTE
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Module Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Link
              to="/teacher/classes"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-blue-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                  {t('navAssignedClasses')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  View your academic classes, enrolled students, and syllabus schedule.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionViewAll')} &rarr;
              </span>
            </Link>

            <Link
              to="/teacher/live-classes"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-red-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-sm">
                  {t('navLiveClasses')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Schedule interactive sessions, configure LiveKit rooms, and start classes.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionCreateNew')} &rarr;
              </span>
            </Link>

            <Link
              to="/teacher/recorded-lessons"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-purple-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <PlaySquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors text-sm">
                  {t('navRecordedLessons')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Embed YouTube unlisted video lessons for students to replay anytime.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionViewAll')} &rarr;
              </span>
            </Link>

            <Link
              to="/teacher/learning-materials"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-sky-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-sm">
                  {t('navMaterials')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Upload class worksheets, revision tutorials, and study notes for students.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionCreateNew')} &rarr;
              </span>
            </Link>

            <Link
              to="/teacher/quizzes"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">
                  {t('navQuizzes')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Create MCQ quizzes, set pass marks and time limits, and review student results.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionCreateNew')} &rarr;
              </span>
            </Link>

            <Link
              to="/teacher/announcements"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-amber-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-sm">
                  {t('navAnnouncements')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Broadcast urgent reminders, class schedule changes, and notices to students.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                {t('actionCreateNew')} &rarr;
              </span>
            </Link>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
