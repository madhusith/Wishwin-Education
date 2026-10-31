import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  UserPlus,
  BookOpen,
  Settings,
  User,
  Plus,
  Calendar,
  CheckCircle2,
  Mail,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import ManageStudentClassesModal from '../../components/ManageStudentClassesModal';
import CreateStudentAccountModal from '../../components/CreateStudentAccountModal';
import MockPaymentGatewayModal from '../../components/MockPaymentGatewayModal';
import { formatValidDate } from '../../utils/dateUtils';
import ChildSelector from '../../components/ChildSelector';

export default function ParentManageStudentsPage() {
  const { t } = useLanguage();
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

  // Modals
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
      console.error('Error fetching parent student management data:', err);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const child = data?.child;
  const childrenList = data?.children || [];
  const enrolledClasses = data?.enrolledClasses || [];
  const enrolledCategoryIds = data?.enrolledCategoryIds || [];
  const paymentStatus = data?.paymentStatus || {
    isPaid: false,
    status: 'DUE',
    renewalNotice: 'Every class expires monthly. Renewal date is every 2nd week of each month.',
    renewalLabel: '2nd week of every month',
  };

  const gradeNames = [...new Set(enrolledClasses.map((c) => c.grade_name))].join(', ');

  return (
    <DashboardLayout>
      <PageHeader
        title={t('navManageStudents', 'Manage Students')}
        subtitle="Register child accounts and assign or change their enrolled classes."
        breadcrumbs={[
          { label: t('roleParent', 'Parent'), href: '/parent/dashboard' },
          { label: t('navManageStudents', 'Manage Students') },
        ]}
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('parentAddStudent', 'Create Student Account')}</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message={t('loading', 'Loading student accounts...')} />
      ) : !child ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-2xs max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Student Accounts Created</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Primary students cannot self-register. Create an account for your child and choose their class categories (Grade 04, Grade 05, or Quiz Class).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('parentAddStudent', 'Create First Student Account')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Child Switcher Dropdown */}
          {childrenList.length > 0 && (
            <ChildSelector
              childrenList={childrenList}
              selectedChildId={selectedStudentId || child.id}
              onSelect={(newId) => setSelectedStudentId(String(newId))}
            />
          )}

          {/* Student Account Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-base">
                  {child.firstName?.[0]}
                  {child.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {child.name}
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {child.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student ID: <strong className="text-slate-700 font-mono">WW-STU-00{child.id}</strong> • Username: <strong className="text-blue-700 font-mono">{child.email?.split('@')[0]}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Subscription & Renewal Status */}
            {(() => {
              const currentStatus = paymentStatus.status || (paymentStatus.isPaid ? 'ACTIVE' : 'PAYMENT_NEEDED');
              const canRenew = paymentStatus.canRenew ?? (currentStatus !== 'ACTIVE');
              const validDateFormatted = formatValidDate(paymentStatus.validUntil);

              return (
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        currentStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : currentStatus === 'PAYMENT_NEEDED'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">Monthly Class Fee Status:</strong>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            currentStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : currentStatus === 'PAYMENT_NEEDED'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {currentStatus === 'ACTIVE' && t('statusActive', 'Active')}
                          {currentStatus === 'PAYMENT_NEEDED' && t('statusPaymentNeeded', 'Payment Needed')}
                          {currentStatus === 'PAYMENT_OVERDUE' && t('statusPaymentOverdue', 'Payment Overdue')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {paymentStatus.validUntil ? (
                          <>
                            Valid Date: <strong className="text-slate-800 font-semibold">{validDateFormatted}</strong>{' '}
                            &bull; Next renewal: <strong className="text-blue-700">{paymentStatus.renewalLabel}</strong>
                          </>
                        ) : (
                          <>
                            Every class expires monthly. Active students must renew by the{' '}
                            <strong className="text-amber-800">2nd week of each month (14th)</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {canRenew && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs ${
                        currentStatus === 'ACTIVE'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{currentStatus === 'ACTIVE' ? 'Renew for Next Month' : 'Pay Monthly Fee'}</span>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Enrolled Categories Spotlight */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Assigned Class Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {enrolledCategoryIds.includes(2) && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Grade 04 (Special Paper Part 01 & 02)
                    </span>
                  )}
                  {enrolledCategoryIds.includes(3) && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Grade 05 (Special Paper Part 01 & 02)
                    </span>
                  )}
                  {enrolledCategoryIds.includes(4) && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Quiz Class (MCQ Practice Tests)
                    </span>
                  )}
                  {enrolledCategoryIds.length === 0 && (
                    <span className="text-xs text-slate-400">No categories selected.</span>
                  )}
                </div>
              </div>

              {/* Active Enrolled Classes Grid */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enrolled Classes ({enrolledClasses.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsManageClassesOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add or Change Classes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enrolledClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{cls.class_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 text-blue-800">
                          {cls.grade_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Teacher: <strong className="text-slate-700">{cls.teacher_name}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Login Instructions / Helper */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Student Login Instructions</p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Your child can log in directly at the login page using username{' '}
                    <strong className="font-mono">{child.email?.split('@')[0]}</strong> and the password you created.
                  </p>
                </div>
              </div>
            </div>
          </div>
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

      {/* Create Student Account Modal */}
      <CreateStudentAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Mock Payment Gateway Modal */}
      {child && (
        <MockPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={child}
          categories={enrolledCategoryIds}
          purpose="MONTHLY_RENEWAL"
          onSuccess={fetchData}
        />
      )}
    </DashboardLayout>
  );
}
