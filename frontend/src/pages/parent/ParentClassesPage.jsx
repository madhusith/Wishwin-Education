import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { BookOpen, User, Calendar, Mail, GraduationCap } from 'lucide-react';
import api from '../../services/api';

export default function ParentClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/classes');
      setClasses(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching parent classes:', err);
      setError('Failed to load child classes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Child Class Information"
        subtitle="Registered classes, assigned teachers, and academic details for your child."
        breadcrumbs={[
          { label: 'Parent', href: '/parent/dashboard' },
          { label: 'Classes' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchClasses} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message="Loading class information..." />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Classes Enrolled"
          description="Your child is not enrolled in any classes yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  {cls.gradeName}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {cls.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                {cls.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cls.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Teacher: <strong className="text-slate-800">{cls.teacherName}</strong>
                  </span>
                </div>
                {cls.teacherEmail && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cls.teacherEmail}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
