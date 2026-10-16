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
  UserPlus,
  Plus,
  CheckCircle,
  X,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-child switcher state
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Create Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [childForm, setChildForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    categories: [3], // default Grade 05
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdSuccessData, setCreatedSuccessData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedStudentId ? { studentId: selectedStudentId } : {};
      const [summaryRes, annRes] = await Promise.all([
        api.get('/parent/child-summary', { params }),
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

  const handleCategoryToggle = (catId) => {
    setChildForm((prev) => {
      const exists = prev.categories.includes(catId);
      if (exists) {
        if (prev.categories.length === 1) return prev; // Keep at least one
        return { ...prev, categories: prev.categories.filter((c) => c !== catId) };
      } else {
        return { ...prev, categories: [...prev.categories, catId] };
      }
    });
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!childForm.firstName || !childForm.lastName || !childForm.username || !childForm.password) {
      setCreateError('Please complete all required fields.');
      return;
    }
    if (childForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/parent/children', childForm);
      setCreatedSuccessData({
        ...res.data?.data,
        plainPassword: childForm.password,
      });
      // Refresh list and switch to newly created child
      if (res.data?.data?.studentId) {
        setSelectedStudentId(res.data.data.studentId);
      }
      fetchData();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setCreatedSuccessData(null);
    setCreateError('');
    setChildForm({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      categories: [3],
    });
  };

  const child = summaryData?.child;
  const childrenList = summaryData?.children || [];
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
        title={`${t('parentWelcome')}, ${user?.firstName || t('roleParent')}!`}
        subtitle={t('parentSubtitle')}
        breadcrumbs={[{ label: t('roleParent'), href: '/parent/dashboard' }, { label: t('navDashboard') }]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message={t('loading')} />
      ) : !child ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Student Accounts Linked</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Students cannot self-register. Please create a student account for your child and enroll them in Grade 04, Grade 05, or Quiz Class.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('parentAddStudent')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Linked Student Strip with Switcher & Add Button */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-slate-500">{t('parentStudent')}:</span>

              {childrenList.length > 1 ? (
                <select
                  value={selectedStudentId || child.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              ) : (
                <strong className="text-slate-900 font-bold text-sm">{child.name}</strong>
              )}

              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {enrolledClasses[0]?.grade_name || 'Enrolled'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {child.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('parentAddStudent')}</span>
              </button>

              <Link
                to="/parent/student-details"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 flex items-center gap-1"
              >
                {t('actionViewDetails')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Clean Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase">{t('parentEnrolledClasses')}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.enrolledClassesCount}</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-emerald-600 uppercase">{t('parentAvgQuizMarks')}</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats.avgScorePercentage}%</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-blue-600 uppercase">{t('parentTestsDone')}</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{stats.quizzesAttemptedCount}</p>
            </Link>

            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block"
            >
              <p className="text-[11px] font-semibold text-amber-600 uppercase">{t('parentLiveSessions')}</p>
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
                  <h3 className="font-bold text-slate-900 text-sm">{t('parentUpcomingLive')}</h3>
                </div>
                <Link
                  to="/parent/classes"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  {t('actionViewAll')} &rarr;
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
                  <h3 className="font-bold text-slate-900 text-sm">{t('parentCenterNotices')}</h3>
                </div>
                <Link
                  to="/parent/announcements"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  {t('actionViewAll')} &rarr;
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

      {/* Create Student Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {t('parentAddStudent')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Create student login credentials and enroll in class categories
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {createdSuccessData ? (
                /* Success View with Credentials Confirmation */
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {t('parentStudentCreatedSuccess')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Give these login credentials to your child so they can sign in at the login page.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-900">{createdSuccessData.firstName} {createdSuccessData.lastName}</strong>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Username / ID:</span>
                      <strong className="text-blue-700 font-mono font-bold">{createdSuccessData.username}</strong>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Student Email:</span>
                      <span className="text-slate-700 font-mono">{createdSuccessData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Password:</span>
                      <strong className="text-emerald-700 font-mono font-bold">{createdSuccessData.plainPassword}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    Done & View Dashboard
                  </button>
                </div>
              ) : (
                /* Account Creation Form */
                <form onSubmit={handleCreateChild} className="space-y-4">
                  {createError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                      {createError}
                    </div>
                  )}

                  {/* Child Names */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={childForm.firstName}
                        onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                        placeholder="e.g. Kasun"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={childForm.lastName}
                        onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                        placeholder="e.g. Silva"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Child Username & Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        {t('parentChildUsername')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={childForm.username}
                        onChange={(e) => setChildForm({ ...childForm, username: e.target.value })}
                        placeholder="e.g. kasun04"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        {t('parentChildPassword')} *
                      </label>
                      <input
                        type="password"
                        required
                        value={childForm.password}
                        onChange={(e) => setChildForm({ ...childForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* 3 Class Categories Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('parentSelectCategories')} *
                    </label>
                    <div className="space-y-2">
                      {/* Grade 04 */}
                      <label
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          childForm.categories.includes(2)
                            ? 'bg-blue-50/60 border-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={childForm.categories.includes(2)}
                          onChange={() => handleCategoryToggle(2)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <strong className="text-slate-900 font-bold block">Grade 04</strong>
                          <span className="text-[11px] text-slate-500">
                            Special Paper Part 01 & Special Paper Part 02
                          </span>
                        </div>
                      </label>

                      {/* Grade 05 */}
                      <label
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          childForm.categories.includes(3)
                            ? 'bg-blue-50/60 border-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={childForm.categories.includes(3)}
                          onChange={() => handleCategoryToggle(3)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <strong className="text-slate-900 font-bold block">Grade 05</strong>
                          <span className="text-[11px] text-slate-500">
                            Special Paper Part 01 & Special Paper Part 02
                          </span>
                        </div>
                      </label>

                      {/* Quiz Class */}
                      <label
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          childForm.categories.includes(4)
                            ? 'bg-blue-50/60 border-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={childForm.categories.includes(4)}
                          onChange={() => handleCategoryToggle(4)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <strong className="text-slate-900 font-bold block">Quiz Class</strong>
                          <span className="text-[11px] text-slate-500">
                            Normal MCQ Practice Quizzes & Timed Assessments
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      {t('actionCancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-60 transition"
                    >
                      {isSubmitting ? 'Creating...' : t('parentAddStudent')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
