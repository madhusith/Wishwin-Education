import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, Calendar, Search, Megaphone } from 'lucide-react';
import api from '../../services/api';

export default function StudentAnnouncementsPage() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching student announcements:', err);
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = announcements.filter(
    (a) =>
      !search.trim() ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={t('navAnnouncements')}
        subtitle="Important center notices, class updates, and special announcements."
        breadcrumbs={[
          { label: t('roleStudent') || 'Student', href: '/student/dashboard' },
          { label: t('navAnnouncements') || 'Announcements' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchAnnouncements} className="mb-4" />}

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-6 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading announcements..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Announcements"
          description="There are no active announcements posted right now."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.priority === 'URGENT'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : item.priority === 'IMPORTANT'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.priority === 'URGENT'
                      ? '🔴 URGENT'
                      : item.priority === 'IMPORTANT'
                      ? '⚡ IMPORTANT'
                      : '📢 NORMAL'}
                  </span>
                  {item.className && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.className}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
