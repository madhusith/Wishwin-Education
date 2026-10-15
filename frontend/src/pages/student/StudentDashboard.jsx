import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { Video, FileText, CheckSquare, PlaySquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

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

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/student/live-classes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-red-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              {t('cardLiveTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('cardLiveDesc')}
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionJoinLive')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/recorded-lessons"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              {t('cardRecordingsTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('cardRecordingsDesc')}
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionWatchLesson')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/learning-materials"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              {t('cardMaterialsTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('cardMaterialsDesc')}
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionDownload')} &rarr;
          </span>
        </Link>

        <Link
          to="/student/quizzes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              {t('cardQuizzesTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('cardQuizzesDesc')}
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t('actionStartQuiz')} &rarr;
          </span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
