import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, BookOpen, AlertCircle, CheckCircle2, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import MockPaymentGatewayModal, { CATEGORY_PRICING } from './MockPaymentGatewayModal';

export default function ManageStudentClassesModal({
  isOpen,
  onClose,
  student,
  initialCategoryIds = [],
  onSuccess,
}) {
  const { t } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategories(
        Array.isArray(initialCategoryIds) && initialCategoryIds.length > 0
          ? initialCategoryIds
          : [3]
      );
      setError('');
      setSuccessMsg('');
      setIsPaymentModalOpen(false);
    }
  }, [isOpen, initialCategoryIds]);

  if (!isOpen || !student) return null;

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const totalAmount = selectedCategories.reduce(
    (sum, catId) => sum + (CATEGORY_PRICING[catId]?.price || 2500),
    0
  );

  const handleSaveWithoutPayment = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccessMsg('');

    if (selectedCategories.length === 0) {
      setError(t('parentSelectAtLeastOneCategory', 'Please select at least one class category.'));
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/parent/children/${student.id}/enrollments`, {
        categories: selectedCategories,
      });

      setSuccessMsg(t('parentClassesUpdatedSuccess', 'Enrolled classes updated successfully!'));
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update student enrollments:', err);
      setError(err.response?.data?.message || 'Failed to update enrolled classes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('parentManageClasses', 'Manage Enrolled Classes')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{student.name || student.firstName}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSaveWithoutPayment} className="p-5 space-y-4">
            {/* Monthly Expiry Notice Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="font-bold block">Monthly Renewal Notice:</strong>
                Every class expires monthly. Active students must renew their monthly fee by the{' '}
                <strong>2nd week of each month</strong>.
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Category Checkboxes with Fees */}
            <div className="space-y-2.5">
              {/* Grade 04 */}
              <div
                onClick={() => toggleCategory(2)}
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-3 transition ${
                  selectedCategories.includes(2)
                    ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  {selectedCategories.includes(2) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="block font-bold">
                      {t('parentGrade4Desc', 'Grade 04 Scholarship')}
                    </span>
                    <span className="font-mono font-bold text-blue-700">LKR 2,500</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Special Paper Part 01 & Special Paper Part 02
                  </span>
                </div>
              </div>

              {/* Grade 05 */}
              <div
                onClick={() => toggleCategory(3)}
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-3 transition ${
                  selectedCategories.includes(3)
                    ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  {selectedCategories.includes(3) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="block font-bold">
                      {t('parentGrade5Desc', 'Grade 05 Scholarship')}
                    </span>
                    <span className="font-mono font-bold text-blue-700">LKR 2,500</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Special Paper Part 01 & 02 + Math Class
                  </span>
                </div>
              </div>

              {/* Quiz Class */}
              <div
                onClick={() => toggleCategory(4)}
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-3 transition ${
                  selectedCategories.includes(4)
                    ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  {selectedCategories.includes(4) ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="block font-bold">
                      {t('parentQuizClassDesc', 'Quiz Class Practice')}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">LKR 1,500</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Weekly MCQ practice tests and timed quizzes
                  </span>
                </div>
              </div>
            </div>

            {/* Total Fee Row */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Monthly Course Total:</span>
              <span className="font-black text-blue-700 text-sm">
                LKR {totalAmount.toLocaleString()} / mo
              </span>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  {submitting ? 'Saving...' : 'Save Only'}
                </button>

                <button
                  type="button"
                  disabled={submitting || selectedCategories.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay & Renew (LKR {totalAmount.toLocaleString()})</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mock Payment Gateway Modal */}
      <MockPaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={student}
        categories={selectedCategories}
        customAmount={totalAmount}
        purpose="MONTHLY_RENEWAL"
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
