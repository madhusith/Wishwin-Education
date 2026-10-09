import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  FileText,
  Download,
  Eye,
  Search,
  BookOpen,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  // PDF Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (topicFilter) params.topic = topicFilter;

      const res = await api.get('/materials', { params });
      if (res.data?.data) {
        setMaterials(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load learning materials:', err);
      setError(err.response?.data?.message || 'Failed to load learning materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, topicFilter]);

  const uniqueTopics = Array.from(
    new Set(materials.map((m) => m.topic).filter(Boolean))
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="PDF Tutes & Learning Materials"
        subtitle="Access downloadable scholarship revision tutorials, class worksheets, and past question papers."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Learning Materials' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchMaterials} className="mb-4" />}

      {/* Search and Topic Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search papers, worksheets, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {uniqueTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter by Topic:
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

      {/* Materials Cards Grid */}
      {loading ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
          <LoadingSpinner message="Loading tutorials and papers..." />
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No materials uploaded yet"
          description="Your teachers have not uploaded any PDF materials for your enrolled classes yet. Check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between p-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.fileSizeFormatted}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.gradeName} &bull; {item.className}
                    </span>
                    {item.topic && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {item.topic}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Teacher: {item.creatorName}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(item)}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </button>

                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-LMS PDF Viewer Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewMaterial(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-4xl w-full h-[85vh] p-6 shadow-2xl border border-slate-100 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {previewMaterial.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewMaterial.gradeName} &bull; {previewMaterial.className} &bull; {previewMaterial.fileSizeFormatted}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                src={previewMaterial.fileUrl}
                title={previewMaterial.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
