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
  PlaySquare,
  Calendar,
  Clock,
  Download,
  Play,
  ArrowRight,
  Sparkles,
  Award,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MockPaymentGatewayModal from '../../components/MockPaymentGatewayModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [liveSessions, setLiveSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [liveRes, matRes, recRes, quizRes, payRes] = await Promise.allSettled([
        api.get('/live-classes'),
        api.get('/materials'),
        api.get('/recordings'),
        api.get('/quizzes'),
        user?.id ? api.get(`/payments/status/${user.id}`) : Promise.resolve(null),
      ]);

      if (liveRes.status === 'fulfilled') setLiveSessions(liveRes.value.data?.data || []);
      if (matRes.status === 'fulfilled') setMaterials(matRes.value.data?.data || []);
      if (recRes.status === 'fulfilled') setRecordings(recRes.value.data?.data || []);
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value.data?.data || []);
      if (payRes.status === 'fulfilled' && payRes.value?.data?.data) {
        setPaymentStatus(payRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find next upcoming live class
  const nextLiveClass = liveSessions.find((s) => s.status === 'LIVE') ||
    liveSessions.find((s) => s.status === 'SCHEDULED');

  const pendingQuizzes = quizzes.filter((q) => !q.myAttempt);

  return (
    <DashboardLayout>
      <PageHeader
        title={`${t('studentWelcome')}, ${user?.firstName || t('roleStudent')}! 👋`}
        subtitle={t('studentSubtitle')}
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200">
            {t('studentPortalBadge')}
          </span>
        }
      />

      {/* Monthly Class Access & Renewal Banner */}
      <div className="mb-6 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              paymentStatus?.isPaid
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Monthly Class Pass:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  paymentStatus?.isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {paymentStatus?.isPaid ? 'ACTIVE • PAID' : 'RENEWAL DUE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {paymentStatus?.isPaid && paymentStatus.validUntil ? (
                <>
                  Valid through <strong className="text-slate-800">{paymentStatus.validUntil}</strong>{' '}
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

        <button
          type="button"
          onClick={() => setIsPaymentModalOpen(true)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs ${
            paymentStatus?.isPaid
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{paymentStatus?.isPaid ? 'Renew / View Gateway' : 'Pay Monthly Fee (Mock)'}</span>
        </button>
      </div>

      {/* Next Upcoming Live Class Spotlight (Phase K) */}
      {nextLiveClass && (
        <div className="mb-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  nextLiveClass.status === 'LIVE'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-blue-500/40 text-blue-100 border border-blue-400/30'
                }`}
              >
                {nextLiveClass.status === 'LIVE' ? '● LIVE RIGHT NOW' : 'UPCOMING CLASS'}
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                {nextLiveClass.className}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {nextLiveClass.title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/90 pt-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                {new Date(nextLiveClass.scheduledDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                {nextLiveClass.startTime?.substring(0, 5)} - {nextLiveClass.endTime?.substring(0, 5)}
              </span>
              {nextLiveClass.teacherName && (
                <span className="text-blue-200">
                  Teacher: <strong>{nextLiveClass.teacherName}</strong>
                </span>
              )}
            </div>
          </div>

          <Link
            to="/student/live-classes"
            className="shrink-0 self-start sm:self-center px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Video className="w-4 h-4 text-blue-700" />
            <span>{nextLiveClass.status === 'LIVE' ? 'Join Classroom Now' : 'View Live Room'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
          </Link>
        </div>
      )}

      {/* 4 Core Quick Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          to="/student/live-classes"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-red-600 transition-colors">
              {t('cardLiveTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Interactive sessions with teachers
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionJoinLive')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/recorded-lessons"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 hover:shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
              {t('cardRecordingsTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Replay recorded topic lessons
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionWatchLesson')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/learning-materials"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
              {t('cardMaterialsTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              PDF worksheets and tutes
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionDownload')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/quizzes"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
              {t('cardQuizzesTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {pendingQuizzes.length > 0 ? `${pendingQuizzes.length} pending tests` : 'MCQ practice quizzes'}
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionStartQuiz')} &rarr;
          </span>
        </Link>
      </div>

      {/* Two-Column Grid: Recent Tutes & Recent Recordings (Phase K) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent PDF Tutes & Notes (Latest 3) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">{t('cardMaterialsTitle')}</h3>
            </div>
            <Link
              to="/student/learning-materials"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              {t('actionViewAll')} &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {materials.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No materials uploaded yet.</p>
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
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 transition shrink-0"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Recorded Lessons (Latest 3) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PlaySquare className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">{t('cardRecordingsTitle')}</h3>
            </div>
            <Link
              to="/student/recorded-lessons"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              {t('actionViewAll')} &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {recordings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recorded lessons yet.</p>
            ) : (
              recordings.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to="/student/recorded-lessons"
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs hover:border-slate-300 transition group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.className} {item.topic ? `• ${item.topic}` : ''}
                    </p>
                  </div>
                  <span className="p-1.5 rounded-lg bg-white border border-slate-200 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mock Payment Gateway Modal */}
      {user && (
        <MockPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={{ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email }}
          categories={[2, 3, 4]}
          purpose="MONTHLY_RENEWAL"
          onSuccess={fetchDashboardData}
        />
      )}
    </DashboardLayout>
  );
}
