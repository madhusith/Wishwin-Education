import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
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
} from 'lucide-react';
import api from '../../services/api';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error('Failed to load announcements:', err);
      setError('Failed to load announcements.');
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
      priority: item.priority,
      target_type: item.target_type,
      target_class_id: item.target_class_id || '',
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : '',
      active: item.active,
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
        target_class_id:
          formData.target_type === 'CLASS' && formData.target_class_id
            ? parseInt(formData.target_class_id, 10)
            : null,
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Announcements"
        subtitle="Publish instant priority notices, class alerts, and center-wide announcements."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Announcements' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
            <LoadingSpinner message="Loading announcements..." />
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements published"
            description="Create your first announcement to display across user dashboards."
            action={
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Create Announcement
              </button>
            }
          />
        ) : (
          announcements.map((item) => (
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
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {item.message}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Author: {item.creatorName || 'Admin'}</span>
                  {item.start_date && (
                    <span>From: {new Date(item.start_date).toLocaleDateString()}</span>
                  )}
                  {item.end_date && (
                    <span>Until: {new Date(item.end_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"
                  title="Edit announcement"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => triggerDelete(item)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete announcement"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Announcement' : 'Create New Announcement'}
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 5 Revision Class this Saturday"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Message *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed notice text..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">ALL (Everyone)</option>
                    <option value="STUDENTS">STUDENTS Only</option>
                    <option value="TEACHERS">TEACHERS Only</option>
                    <option value="PARENTS">PARENTS Only</option>
                    <option value="CLASS">Specific Class</option>
                  </select>
                </div>
              </div>

              {formData.target_type === 'CLASS' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Target Class *
                  </label>
                  <select
                    required
                    value={formData.target_class_id}
                    onChange={(e) => setFormData({ ...formData, target_class_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.gradeName}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheckbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="activeCheckbox" className="text-xs font-semibold text-slate-700 select-none">
                  Display actively on banner
                </label>
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
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingItem ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Announcement?"
        message={`Are you sure you want to remove "${deleteDialog.item?.title}"? It will immediately disappear from all user banners.`}
        confirmText="Delete Announcement"
        confirmVariant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null, loading: false })}
      />
    </DashboardLayout>
  );
}
