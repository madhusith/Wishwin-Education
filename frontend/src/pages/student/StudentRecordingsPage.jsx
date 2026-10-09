import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  PlaySquare,
  Play,
  Search,
  BookOpen,
  GraduationCap,
  Calendar,
  X,
  Tv,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  // Active Video Modal
  const [activeLesson, setActiveLesson] = useState(null);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (topicFilter) params.topic = topicFilter;

      const res = await api.get('/recordings', { params });
      if (res.data?.data) {
        setRecordings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student recordings:', err);
      setError(err.response?.data?.message || 'Failed to load recorded lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecordings();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, topicFilter]);

  // Extract unique topics for filter pills
  const uniqueTopics = Array.from(
    new Set(recordings.map((r) => r.topic).filter(Boolean))
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Recorded Lessons"
        subtitle="Watch and replay video lessons for your enrolled subjects to revise at your own pace."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Recorded Lessons' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchRecordings} className="mb-4" />}

      {/* Search and Topic Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lessons by topic or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {uniqueTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Topics:
            </span>
            <button
              onClick={() => setTopicFilter('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                topicFilter === ''
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Topics
            </button>
            {uniqueTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setTopicFilter(topic)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  topicFilter === topic
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
          <LoadingSpinner message="Loading video lessons..." />
        </div>
      ) : recordings.length === 0 ? (
        <EmptyState
          icon={PlaySquare}
          title="No recorded lessons available"
          description="Your teachers have not uploaded any video recordings for this subject yet. Please check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group cursor-pointer"
              onClick={() => setActiveLesson(item)}
            >
              <div>
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {item.topic && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                      {item.topic}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                    {item.gradeName} &bull; {item.className}
                  </span>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {item.creatorName}
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Watch Button */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch Lesson</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded In-LMS Player Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveLesson(null)}
          />

          <div className="relative bg-slate-900 text-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {activeLesson.gradeName} &bull; {activeLesson.className}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Iframe */}
            <div className="mt-4 aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeLesson.youtubeVideoId}?rel=0&autoplay=1&modestbranding=1`}
                title={activeLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {activeLesson.description && (
              <div className="mt-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Revision Notes & Description
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeLesson.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
