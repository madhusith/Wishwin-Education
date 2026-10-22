import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell,
  Plus,
  AlertCircle,
  Megaphone,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  Search,
} from 'lucide-react';
import api from '../../services/api';

export default function TeacherAnnouncementsPage() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'NORMAL',
    target_type: 'ALL',
    target_class_id: '',
    start_date: '',
    end_date: '',
    active: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

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
      const [annRes, classRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/classes'),
      ]);
      if (annRes.data?.data) setAnnouncements(annRes.data.data);
      if (classRes.data?.data) setClasses(classRes.data.data);
    } catch (err) {
      console.error('Failed to load teacher announcements:', err);
      setError('Failed to load announcements data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      message: '',
      priority: 'NORMAL',
      target_type: 'ALL',
      target_class_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      active: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      message: item.message,
      priority: item.priority || 'NORMAL',
      target_type: item.target_type || 'ALL',
      target_class_id: item.target_class_id || item.targetClassId || '',
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : '',
      active: item.active !== undefined ? Boolean(item.active) : true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formData.message.trim()) {
      setFormError('Message content is required.');
      return;
    }
    if (formData.target_type === 'CLASS' && !formData.target_class_id) {
      setFormError('Please select a target class.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        target_type: formData.target_type,
        target_class_id: formData.target_type === 'CLASS' ? formData.target_class_id : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        active: formData.active ? 1 : 0,
      };

      if (editingItem) {
        await api.put(`/announcements/${editingItem.id}`, payload);
      } else {
        await api.post('/announcements', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setFormError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await api.delete(`/announcements/${deleteDialog.item.id}`);
      setDeleteDialog({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert(err.response?.data?.message || 'Failed to delete announcement.');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const priorityBadge = (p) => {
    if (p === 'URGENT') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-200">
          🔴 URGENT
        </span>
      );
    }
    if (p === 'IMPORTANT') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          ⚡ IMPORTANT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
        📢 NORMAL
      </span>
    );
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      !search.trim() ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={t('navAnnouncements')}
        subtitle="Publish notices, exam schedules, and urgent alerts for your students."
        breadcrumbs={[
          { label: t('roleTeacher') || 'Teacher', href: '/teacher/dashboard' },
          { label: t('navAnnouncements') || 'Announcements' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post Notice</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Search Bar */}
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

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
            <LoadingSpinner message="Loading announcements..." />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements published"
            description="Create your first notice to broadcast updates to your classes."
            action={
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Post Notice
              </button>
            }
          />
        ) : (
          filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {priorityBadge(item.priority)}
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Target: {item.target_type}
                  </span>
                  {item.className && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Class: {item.className}
                    </span>
                  )}
                  {item.active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Posted: {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                  </span>
                  {item.start_date && (
                    <span>Valid from: {new Date(item.start_date).toLocaleDateString()}</span>
                  )}
                  {item.end_date && (
                    <span>Expires: {new Date(item.end_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit Announcement"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setDeleteDialog({
                      isOpen: true,
                      item,
                      loading: false,
                    })
                  }
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? 'Edit Announcement' : 'Post Announcement'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Grade 04 Special Revision Paper Scheduled"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide clear notice details, guidelines, or instructions..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  required
                />
              </div>

              {/* Priority & Target Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  >
                    <option value="NORMAL">Normal (Info)</option>
                    <option value="IMPORTANT">Important (Amber)</option>
                    <option value="URGENT">Urgent (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Audience
                  </label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="CLASS">Specific Class</option>
                  </select>
                </div>
              </div>

              {/* Target Class Dropdown */}
              {formData.target_type === 'CLASS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Target Class *
                  </label>
                  <select
                    value={formData.target_class_id}
                    onChange={(e) => setFormData({ ...formData, target_class_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeName || 'Class'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Immediately Active (Display on announcement banners)
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {formSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Announcement?"
        message={`Are you sure you want to delete "${deleteDialog.item?.title}"? It will no longer appear on user dashboards.`}
        confirmText="Delete Announcement"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null, loading: false })}
      />
    </DashboardLayout>
  );
}
