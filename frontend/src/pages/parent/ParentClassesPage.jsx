import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { BookOpen, User, Calendar, Mail, Settings, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import ManageStudentClassesModal from '../../components/ManageStudentClassesModal';

export default function ParentClassesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedStudentId ? { studentId: selectedStudentId } : {};
      const res = await api.get('/parent/child-summary', { params });
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching parent classes:', err);
      setError('Failed to load child classes.');
    } finally {
      setLoading(false);
    }
  };

  const child = data?.child;
  const childrenList = data?.children || [];
  const classes = data?.enrolledClasses || [];
  const enrolledCategoryIds = data?.enrolledCategoryIds || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Child Class Information"
        subtitle="Registered classes, assigned teachers, and academic details for your child."
        breadcrumbs={[
          { label: t('roleParent', 'Parent'), href: '/parent/dashboard' },
          { label: t('navClasses', 'Classes') },
        ]}
        actions={
          child && (
            <button
              onClick={() => setIsManageClassesOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t('parentManageClasses', 'Manage Enrolled Classes')}</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Child Switcher (if multiple children) */}
      {childrenList.length > 1 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs mb-5 shadow-2xs">
          <span className="font-semibold text-slate-500">{t('parentSelectChild', 'Select Child')}:</span>
          <select
            value={selectedStudentId || child?.id}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {childrenList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message={t('loading', 'Loading class information...')} />
      ) : !child || classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Classes Enrolled"
          description="Your child is not enrolled in any classes yet."
          action={
            child && (
              <button
                onClick={() => setIsManageClassesOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                + {t('parentManageClasses', 'Add Classes / Grade')}
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  {cls.grade_name}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {cls.enrollment_status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{cls.class_name}</h3>
                {cls.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cls.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Teacher: <strong className="text-slate-800">{cls.teacher_name}</strong>
                  </span>
                </div>
                {cls.teacher_email && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cls.teacher_email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Student Classes Modal */}
      <ManageStudentClassesModal
        isOpen={isManageClassesOpen}
        onClose={() => setIsManageClassesOpen(false)}
        student={child}
        initialCategoryIds={enrolledCategoryIds}
        onSuccess={fetchData}
      />
    </DashboardLayout>
  );
}
