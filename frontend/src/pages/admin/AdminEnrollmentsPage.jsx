import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  BookOpen,
  GraduationCap,
  Calendar,
  X,
  Mail,
  Phone,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminEnrollmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlClassId = searchParams.get('classId');

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(urlClassId || '');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enroll Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  // Remove confirmation
  const [removeDialog, setRemoveDialog] = useState({
    isOpen: false,
    student: null,
    loading: false,
  });

  // Fetch classes list on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/classes');
        if (res.data?.data) {
          setClasses(res.data.data);
          // Set initial class if not already selected
          if (!selectedClassId && res.data.data.length > 0) {
            setSelectedClassId(String(res.data.data[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load classes for enrollment:', err);
        setError('Failed to load academic classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch enrolled students whenever selectedClassId changes
  const fetchEnrolledStudents = async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/classes/${classId}/students`);
      if (res.data?.data) {
        setEnrolledStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch class students:', err);
      setError(err.response?.data?.message || 'Failed to fetch enrolled students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchEnrolledStudents(selectedClassId);
      setSearchParams({ classId: selectedClassId });
    }
  }, [selectedClassId]);

  // Load students for modal
  const fetchAvailableStudents = async (search = '') => {
    try {
      const res = await api.get('/admin/students', { params: { search } });
      if (res.data?.data) {
        setAvailableStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students list:', err);
    }
  };

  const openEnrollModal = () => {
    setSelectedStudentId('');
    setStudentSearch('');
    setEnrollError(null);
    setModalOpen(true);
    fetchAvailableStudents();
  };

  const handleStudentSearchChange = (e) => {
    const val = e.target.value;
    setStudentSearch(val);
    fetchAvailableStudents(val);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedClassId) return;

    try {
      setEnrolling(true);
      setEnrollError(null);
      await api.post(`/classes/${selectedClassId}/students`, {
        studentId: parseInt(selectedStudentId, 10),
      });
      setModalOpen(false);
      fetchEnrolledStudents(selectedClassId);
    } catch (err) {
      console.error('Failed to enroll student:', err);
      setEnrollError(err.response?.data?.message || 'Failed to enroll student in this class.');
    } finally {
      setEnrolling(false);
    }
  };

  const triggerRemove = (s) => {
    setRemoveDialog({
      isOpen: true,
      student: s,
      loading: false,
    });
  };

  const confirmRemove = async () => {
    if (!removeDialog.student || !selectedClassId) return;
    try {
      setRemoveDialog((prev) => ({ ...prev, loading: true }));
      await api.delete(`/classes/${selectedClassId}/students/${removeDialog.student.studentId}`);
      setRemoveDialog({ isOpen: false, student: null, loading: false });
      fetchEnrolledStudents(selectedClassId);
    } catch (err) {
      console.error('Failed to remove student:', err);
      alert(err.response?.data?.message || 'Failed to remove student from class.');
      setRemoveDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const selectedClass = classes.find((c) => String(c.id) === String(selectedClassId));

  return (
    <DashboardLayout>
      <PageHeader
        title="Enrollment Management"
        subtitle="Manage student class assignments, view class rosters, and enroll students into academic cohorts."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Enrollments' },
        ]}
        actions={
          selectedClassId && (
            <button
              onClick={openEnrollModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onRetry={() => fetchEnrolledStudents(selectedClassId)} className="mb-4" />}

      {/* Class Selection Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
            Selected Class:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 max-w-md"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.gradeName}] {c.name} ({c.teacherName})
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Teacher: <strong className="text-slate-800">{selectedClass.teacherName}</strong>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Enrolled: <strong className="text-slate-800">{enrolledStudents.length} Students</strong>
            </span>
          </div>
        )}
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Loading class roster..." />
          </div>
        ) : enrolledStudents.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No students enrolled yet"
            description={`No students are currently enrolled in "${selectedClass?.name || 'this class'}".`}
            action={
              <button
                onClick={openEnrollModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Enroll First Student
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Student</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Enrollment Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {enrolledStudents.map((s) => (
                  <tr key={s.enrollmentId} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-600">{s.phone || 'No phone'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.enrollmentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => triggerRemove(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove student from this class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !enrolling && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Enroll Student in Class
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                disabled={enrolling}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enrollError && (
              <div className="mt-4">
                <ErrorMessage message={enrollError} />
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Class
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900">
                  {selectedClass?.name} ({selectedClass?.gradeName})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Search Student Name or Email
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={handleStudentSearchChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose a student --</option>
                  {availableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={enrolling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling || !selectedStudentId}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {enrolling && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        title="Remove Student from Class?"
        message={`Are you sure you want to remove ${removeDialog.student?.firstName} ${removeDialog.student?.lastName} from "${selectedClass?.name}"?`}
        confirmText="Remove Student"
        confirmVariant="danger"
        loading={removeDialog.loading}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveDialog({ isOpen: false, student: null, loading: false })}
      />
    </DashboardLayout>
  );
}
