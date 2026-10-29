import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ChildSelector from '../../components/ChildSelector';
import { User, BookOpen, Mail, Phone, Calendar, GraduationCap, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { formatValidDate } from '../../utils/dateUtils';

export default function ParentStudentDetailsPage() {
  const [data, setData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    try {
      return localStorage.getItem('wishwin_parent_selected_child_id') || '';
    } catch (e) {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedStudentId ? { studentId: selectedStudentId } : {};
      const res = await api.get('/parent/child-summary', { params });
      const resData = res.data?.data || null;
      setData(resData);
      if (resData?.child?.id && !selectedStudentId) {
        setSelectedStudentId(String(resData.child.id));
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const child = data?.child;
  const childrenList = data?.children || [];
  const enrolledClasses = data?.enrolledClasses || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Details & Profile"
        subtitle="View identification, enrolled academic classes, and teacher contacts for your child."
        breadcrumbs={[
          { label: 'Parent', href: '/parent/dashboard' },
          { label: 'Student Details' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Child Switcher Dropdown */}
      {childrenList.length > 0 && (
        <ChildSelector
          childrenList={childrenList}
          selectedChildId={selectedStudentId || child?.id}
          onSelect={(newId) => setSelectedStudentId(String(newId))}
        />
      )}

      {loading ? (
        <LoadingSpinner message="Loading student profile..." />
      ) : !child ? (
        <EmptyState
          icon={User}
          title="No Student Linked"
          description="No student account is linked to this parent profile."
        />
      ) : (
        <div className="space-y-5">
          {/* Student Profile Card - Clean & Simple */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Personal Information
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {child.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Full Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{child.name}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Student ID</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  WW-STU-00{child.id}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Registered Email</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{child.email}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Contact Phone</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{child.phone}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Academic Grade</span>
                <span className="font-bold text-blue-700 text-sm mt-0.5 block">
                  {enrolledClasses[0]?.grade_name || 'Grade 5'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[11px] block">Enrollment Date</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {new Date(child.registeredAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Classes Card - Clean & Simple */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Enrolled Classes & Assigned Teachers ({enrolledClasses.length})
            </h3>

            <div className="space-y-3">
              {enrolledClasses.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No enrolled classes.</p>
              ) : (
                enrolledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {cls.grade_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Enrolled: {new Date(cls.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cls.class_name}</h4>
                      {cls.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {cls.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                      <div>
                        Teacher: <strong className="text-slate-800">{cls.teacher_name}</strong>
                      </div>
                      {cls.teacher_email && (
                        <span className="text-slate-500">{cls.teacher_email}</span>
                      )}
                      {cls.teacher_phone && (
                        <span className="text-slate-500">{cls.teacher_phone}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
