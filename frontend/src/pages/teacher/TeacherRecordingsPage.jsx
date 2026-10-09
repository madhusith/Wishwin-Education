import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  PlaySquare,
  Plus,
  Play,
  Edit2,
  Trash2,
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  EyeOff,
  X,
  Video,
  Tv,
} from 'lucide-react';
import api from '../../services/api';

// Helper to extract YouTube ID for instant preview
function extractPreviewVideoId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export default function TeacherRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    topic: '',
    description: '',
    youtubeUrl: '',
    published: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Active Video Preview Player Modal
  const [activePlayerItem, setActivePlayerItem] = useState(null);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (classFilter) params.classId = classFilter;

      const [recRes, classRes] = await Promise.all([
        api.get('/recordings', { params }),
        api.get('/classes'),
      ]);

      if (recRes.data?.data) setRecordings(recRes.data.data);
      if (classRes.data?.data) setClasses(classRes.data.data);
    } catch (err) {
      console.error('Failed to load recordings:', err);
      setError(err.response?.data?.message || 'Failed to load recorded lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, classFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      classId: classes[0]?.id || '',
      title: '',
      topic: '',
      description: '',
      youtubeUrl: '',
      published: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      classId: item.classId,
      title: item.title,
      topic: item.topic || '',
      description: item.description || '',
      youtubeUrl: item.youtubeUrl,
      published: item.published,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        classId: parseInt(formData.classId, 10),
      };

      if (editingItem) {
        await api.put(`/recordings/${editingItem.id}`, payload);
      } else {
        await api.post('/recordings', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save recording:', err);
      setFormError(err.response?.data?.message || 'Failed to save recording.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const triggerDelete = (item) => {
    setDeleteDialog({
      isOpen: true,
      item,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await api.delete(`/recordings/${deleteDialog.item.id}`);
      setDeleteDialog({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      console.error('Failed to delete recording:', err);
      alert(err.response?.data?.message || 'Failed to delete recording.');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const previewId = extractPreviewVideoId(formData.youtubeUrl);

  return (
    <DashboardLayout>
      <PageHeader
        title="Recorded Lessons"
        subtitle="Publish YouTube unlisted video lessons for your classes so students can replay and revise anytime."
        breadcrumbs={[
          { label: 'Teacher', href: '/teacher/dashboard' },
          { label: 'Recorded Lessons' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recorded Lesson</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by lesson title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.gradeName}] {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Recordings */}
      {loading ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
          <LoadingSpinner message="Loading recorded lessons..." />
        </div>
      ) : recordings.length === 0 ? (
        <EmptyState
          icon={PlaySquare}
          title="No recorded lessons found"
          description="Embed your unlisted YouTube recordings so students can watch them inside the LMS."
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Add First Recording
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden group/thumb"
                  onClick={() => setActivePlayerItem(item)}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {item.topic && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                      {item.topic}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate">
                      {item.gradeName} &bull; {item.className}
                    </span>

                    {item.published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3 text-slate-400" /> Draft
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActivePlayerItem(item)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview Video</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition"
                    title="Edit recording"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => triggerDelete(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition"
                    title="Delete recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Recorded Lesson' : 'Add New Recorded Lesson'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                disabled={formSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4">
                <ErrorMessage message={formError} />
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Class *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.gradeName}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Mathematics: Fractions & Decimals Part 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Syllabus Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fractions, Logic, etc."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visibility
                  </label>
                  <select
                    value={formData.published ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, published: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="true">Published (Visible to students)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YouTube Video Link (Unlisted or Public) *
                </label>
                <div className="relative">
                  <Video className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Instant YouTube Thumbnail Preview */}
              {previewId && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                    alt="Preview"
                    className="w-24 h-14 object-cover rounded-lg shadow-2xs"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Valid YouTube Link
                    </span>
                    <p className="text-xs text-slate-600 mt-1">Video ID: <code>{previewId}</code></p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Revision Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered in this lesson..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !previewId}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingItem ? 'Save Changes' : 'Publish Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-LMS Video Player Modal */}
      {activePlayerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActivePlayerItem(null)}
          />

          <div className="relative bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activePlayerItem.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {activePlayerItem.gradeName} &bull; {activePlayerItem.className} &bull; Topic: {activePlayerItem.topic || 'General'}
                </p>
              </div>
              <button
                onClick={() => setActivePlayerItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Iframe */}
            <div className="mt-4 aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${activePlayerItem.youtubeVideoId}?rel=0&autoplay=1`}
                title={activePlayerItem.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {activePlayerItem.description && (
              <p className="mt-4 text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                {activePlayerItem.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Recorded Lesson?"
        message={`Are you sure you want to remove "${deleteDialog.item?.title}"? Students will no longer be able to watch this video.`}
        confirmText="Delete Lesson"
        confirmVariant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null, loading: false })}
      />
    </DashboardLayout>
  );
}
