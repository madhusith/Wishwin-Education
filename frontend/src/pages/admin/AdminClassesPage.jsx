import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  BookOpen,
  Plus,
  Users,
  GraduationCap,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [gradeFilter, setGradeFilter] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    gradeId: '',
    name: '',
    teacherId: '',
    description: '',
    status: 'ACTIVE',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    classItem: null,
    loading: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (gradeFilter) params.gradeId = gradeFilter;

      const [classRes, gradeRes, teacherRes] = await Promise.all([
        api.get('/classes', { params }),
        api.get('/classes/grades'),
        api.get('/admin/users', { params: { role: 'TEACHER', status: 'ACTIVE' } }),
      ]);

      if (classRes.data?.data) setClasses(classRes.data.data);
      if (gradeRes.data?.data) setGrades(gradeRes.data.data);
      if (teacherRes.data?.data) setTeachers(teacherRes.data.data);
    } catch (err) {
      console.error('Failed to fetch class management data:', err);
      setError(err.response?.data?.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gradeFilter]);

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData({
      gradeId: grades[0]?.id || '',
      name: '',
      teacherId: '',
      description: '',
      status: 'ACTIVE',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingClass(c);
    setFormData({
      gradeId: c.gradeId,
      name: c.name,
      teacherId: c.teacherId || '',
      description: c.description || '',
      status: c.status,
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
        teacherId: formData.teacherId ? parseInt(formData.teacherId, 10) : null,
      };

      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save class:', err);
      setFormError(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const triggerDelete = (c) => {
    setDeleteDialog({
      isOpen: true,
      classItem: c,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.classItem) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await api.delete(`/classes/${deleteDialog.classItem.id}`);
      setDeleteDialog({ isOpen: false, classItem: null, loading: false });
      fetchData();
    } catch (err) {
      console.error('Failed to delete class:', err);
      alert(err.response?.data?.message || 'Failed to delete class.');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Class Management"
        subtitle="Configure academic classes, assign subject teachers, and manage class configurations."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Classes' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Grade Level Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filter Grade:
          </span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {classes.length} {classes.length === 1 ? 'class' : 'classes'} listed
        </span>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner message="Loading academic classes..." />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes configured"
          description="Create your first academic class and assign a teacher."
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Create Class Now
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {c.gradeName}
                  </span>
                  {c.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      <XCircle className="w-3 h-3 text-slate-400" />
                      Inactive
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {c.name}
                </h3>

                {c.description && (
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                {/* Assigned Teacher Card */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Teacher
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {c.teacherName}
                    </p>
                  </div>
                </div>

                {/* Enrolled Students Counter */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Enrolled Students:
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {c.studentCount}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/admin/enrollments?classId=${c.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Enrollments</span>
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition"
                    title="Edit class"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => triggerDelete(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition"
                    title="Delete class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClass ? 'Edit Academic Class' : 'Create New Academic Class'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    required
                    value={formData.gradeId}
                    onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Grade</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 5 Scholarship Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Teacher (Step E4)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Class objectives, curriculum description, or instructions..."
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
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Academic Class?"
        message={`Are you sure you want to delete "${deleteDialog.classItem?.name}"? All associated lesson records and enrollments will be deleted.`}
        confirmText="Delete Class"
        confirmVariant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, classItem: null, loading: false })}
      />
    </DashboardLayout>
  );
}
