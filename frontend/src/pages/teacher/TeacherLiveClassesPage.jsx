import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Play,
  CheckCircle,
  X,
  Radio,
  BookOpen,
} from 'lucide-react';
import api from '../../services/api';

export default function TeacherLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  // Schedule / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    description: '',
    provider: 'LIVEKIT',
    meetingUrl: '',
    roomName: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
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

      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [liveRes, classRes] = await Promise.all([
        api.get('/live-classes', { params }),
        api.get('/classes'),
      ]);

      if (liveRes.data?.data) setLiveClasses(liveRes.data.data);
      if (classRes.data?.data) setMyClasses(classRes.data.data);
    } catch (err) {
      console.error('Failed to load teacher live classes:', err);
      setError(err.response?.data?.message || 'Failed to load live classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      classId: myClasses[0]?.id || '',
      title: '',
      description: '',
      provider: 'LIVEKIT',
      meetingUrl: '',
      roomName: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      status: 'SCHEDULED',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      classId: item.classId,
      title: item.title,
      description: item.description || '',
      provider: item.provider,
      meetingUrl: item.meetingUrl || '',
      roomName: item.roomName || '',
      scheduledDate: item.scheduledDate ? item.scheduledDate.split('T')[0] : '',
      startTime: item.startTime ? item.startTime.slice(0, 5) : '',
      endTime: item.endTime ? item.endTime.slice(0, 5) : '',
      status: item.status,
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
        await api.put(`/live-classes/${editingItem.id}`, payload);
      } else {
        await api.post('/live-classes', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save live class:', err);
      setFormError(err.response?.data?.message || 'Failed to save live class.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/live-classes/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to change status:', err);
      alert(err.response?.data?.message || 'Failed to update session status.');
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
      await api.delete(`/live-classes/${deleteDialog.item.id}`);
      setDeleteDialog({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      console.error('Failed to delete live class:', err);
      alert(err.response?.data?.message || 'Failed to delete live class.');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleJoinHost = async (item) => {
    try {
      const res = await api.post('/live/token', { liveClassId: item.id });
      if (res.data?.meetingUrl) {
        window.open(res.data.meetingUrl, '_blank', 'noopener,noreferrer');
      } else if (res.data?.roomName) {
        alert(`Host LiveKit Room: ${res.data.roomName}\nToken ready. Launching session.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not launch live room.');
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <Radio className="w-3.5 h-3.5 text-red-600" />
            LIVE NOW
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ⏰ SCHEDULED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            ✓ COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-500 border border-red-200">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Live Classes"
        subtitle="Schedule interactive live sessions, configure LiveKit rooms or Zoom links, and start teaching."
        breadcrumbs={[
          { label: 'Teacher', href: '/teacher/dashboard' },
          { label: 'Live Classes' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Class</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="LIVE">Live Now</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {liveClasses.length} {liveClasses.length === 1 ? 'session' : 'sessions'} listed
        </span>
      </div>

      {/* Live Sessions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
            <LoadingSpinner message="Loading live class schedules..." />
          </div>
        ) : liveClasses.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No live sessions scheduled"
            description="Create a live session to conduct lessons online with your students."
            action={
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Schedule First Class
              </button>
            }
          />
        ) : (
          liveClasses.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.status === 'LIVE' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(item.status)}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.gradeName} &bull; {item.className}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Provider: {item.provider}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {new Date(item.scheduledDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                  </span>
                  {item.roomName && (
                    <span className="text-[11px] text-slate-400">
                      Room: <code>{item.roomName}</code>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                {item.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'LIVE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Go Live</span>
                  </button>
                )}

                {item.status === 'LIVE' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>End Session</span>
                  </button>
                )}

                <button
                  onClick={() => handleJoinHost(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                  title="Launch room as Host"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Enter Room</span>
                </button>

                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"
                  title="Edit session"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => triggerDelete(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-50 transition"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Live Session' : 'Schedule Live Class'}
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
                  Select Assigned Class *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Class --</option>
                  {myClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.gradeName}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Title / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Paper 1 Revision Session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Keep revision books ready, question paper discussion..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform Provider *
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="LIVEKIT">LiveKit Cloud (In-LMS)</option>
                    <option value="ZOOM">Zoom Meeting</option>
                    <option value="OTHER">Other Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE NOW</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {formData.provider === 'LIVEKIT' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LiveKit Room Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left empty"
                    value={formData.roomName}
                    onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting URL (Zoom / Google Meet link) *
                  </label>
                  <input
                    type="url"
                    required={formData.provider === 'ZOOM'}
                    placeholder="https://zoom.us/j/123456789"
                    value={formData.meetingUrl}
                    onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

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
                  {editingItem ? 'Save Changes' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Live Class Session?"
        message={`Are you sure you want to cancel and delete "${deleteDialog.item?.title}"?`}
        confirmText="Delete Session"
        confirmVariant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null, loading: false })}
      />
    </DashboardLayout>
  );
}
