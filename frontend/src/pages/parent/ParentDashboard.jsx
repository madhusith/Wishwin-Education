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
  User,
  Video,
  Award,
  BarChart3,
  ChevronRight,
  ExternalLink,
  UserPlus,
  Plus,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import CreateStudentAccountModal from '../../components/CreateStudentAccountModal';
import MockPaymentGatewayModal from '../../components/MockPaymentGatewayModal';
import { formatValidDate } from '../../utils/dateUtils';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-child switcher state
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    try {
      return localStorage.getItem('wishwin_parent_selected_child_id') || '';
    } catch (e) {
      return '';
    }
  });

  // Create Student Modal State (only used if 0 children linked)
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mock Payment Gateway Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedStudentId ? { studentId: selectedStudentId } : {};
      const [sumRes, annRes] = await Promise.all([
        api.get('/parent/child-summary', { params }),
        api.get('/announcements'),
      ]);

      setSummaryData(sumRes.data?.data || null);
      setAnnouncements(annRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
      setError('Failed to load child academic summary.');
    } finally {
      setLoading(false);
    }
  };

  const child = summaryData?.child;
  const childrenList = summaryData?.children || [];
  const enrolledClasses = summaryData?.enrolledClasses || [];
  const enrolledCategoryIds = summaryData?.enrolledCategoryIds || [3];
  const paymentStatus = summaryData?.paymentStatus || {
    isPaid: false,
    status: 'DUE',
    renewalNotice: 'Every class expires monthly. Renewal date is every 2nd week of each month.',
    renewalLabel: '2nd week of every month',
  };
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
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-2xs">
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
          {/* Active Student Selector Strip - Visible, Prominent & Clean */}
          <div className="bg-white px-5 py-4 sm:py-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-slate-600 tracking-wide">
                {t('parentStudent')}:
              </span>

              <select
                value={selectedStudentId || child.id}
                onChange={(e) => {
                  const val = e.target.value;
                  try {
                    localStorage.setItem('wishwin_parent_selected_child_id', val);
                  } catch (err) {}
                  setSelectedStudentId(val);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-sm sm:text-base rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email.split('@')[0]})` : ''}
                  </option>
                ))}
              </select>

              <span className="px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {enrolledClasses[0]?.grade_name || 'Grade 05'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {child.status}
              </span>
            </div>

            <Link
              to="/parent/student-details"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition self-start sm:self-auto shrink-0"
            >
              <span>{t('actionViewDetails', 'View Details')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Monthly Subscription & Renewal Status Strip */}
          {(() => {
            const currentStatus = paymentStatus.status || (paymentStatus.isPaid ? 'ACTIVE' : 'PAYMENT_NEEDED');
            const canRenew = paymentStatus.canRenew ?? (currentStatus !== 'ACTIVE');
            const validDateFormatted = formatValidDate(paymentStatus.validUntil);

            return (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      currentStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : currentStatus === 'PAYMENT_NEEDED'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Monthly Class Subscription</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          currentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : currentStatus === 'PAYMENT_NEEDED'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {currentStatus === 'ACTIVE' && t('statusActive', 'Active')}
                        {currentStatus === 'PAYMENT_NEEDED' && t('statusPaymentNeeded', 'Payment Needed')}
                        {currentStatus === 'PAYMENT_OVERDUE' && t('statusPaymentOverdue', 'Payment Overdue')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {paymentStatus.validUntil ? (
                        <>
                          Valid Date: <strong className="text-slate-800 font-semibold">{validDateFormatted}</strong>{' '}
                          &bull; Next renewal: <strong className="text-blue-700">{paymentStatus.renewalLabel}</strong>
                        </>
                      ) : (
                        <>
                          Every class expires monthly. Active students must renew by the{' '}
                          <strong className="text-amber-800">2nd week of each month (14th)</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {canRenew && (
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                        currentStatus === 'ACTIVE'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{currentStatus === 'ACTIVE' ? 'Renew for Next Month' : 'Pay Monthly Fee'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Clean Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block shadow-2xs"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase">{t('parentEnrolledClasses')}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.enrolledClassesCount}</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block shadow-2xs"
            >
              <p className="text-[11px] font-semibold text-emerald-600 uppercase">{t('parentAvgQuizMarks')}</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{stats.avgScorePercentage}%</p>
            </Link>

            <Link
              to="/parent/status"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block shadow-2xs"
            >
              <p className="text-[11px] font-semibold text-blue-600 uppercase">{t('parentTestsDone')}</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{stats.quizzesAttemptedCount}</p>
            </Link>

            <Link
              to="/parent/classes"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition block shadow-2xs"
            >
              <p className="text-[11px] font-semibold text-amber-600 uppercase">{t('parentLiveSessions')}</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{liveClasses.length}</p>
            </Link>
          </div>

          {/* Two-Column Grid: Live Schedule & Center Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Live Class Schedule */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
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
                          {session.className} • {new Date(session.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>

                      {session.meetingUrl && session.status === 'LIVE' && (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          Join <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center Announcements */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
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
                  <p className="text-xs text-slate-500 py-3 text-center">No announcements.</p>
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
      <CreateStudentAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Mock Payment Gateway Modal */}
      {child && (
        <MockPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={child}
          categories={enrolledCategoryIds}
          purpose="MONTHLY_RENEWAL"
          onSuccess={fetchData}
        />
      )}
    </DashboardLayout>
  );
}
