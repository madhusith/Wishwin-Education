import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  CheckSquare,
  Square,
  Lock,
  UserPlus,
  CreditCard,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Printer,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { CATEGORY_PRICING } from './MockPaymentGatewayModal';
import { formatValidDate } from '../utils/dateUtils';

export default function CreateStudentAccountModal({ isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: Info & Classes, 2: Mock Payment Gateway
  const [childForm, setChildForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    categories: [3], // default Grade 05
  });

  // Mock Card Form for Step 2
  const [cardForm, setCardForm] = useState({
    cardNumber: '4242 4242 4242 4242',
    rawCardNumber: '4242424242424242',
    expiry: '12/28',
    cvv: '789',
    cardName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdSuccessData, setCreatedSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleCategoryToggle = (catId) => {
    setChildForm((prev) => {
      const exists = prev.categories.includes(catId);
      const updated = exists
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories: updated };
    });
  };

  // Calculate monthly total
  const totalAmount = childForm.categories.reduce(
    (sum, catId) => sum + (CATEGORY_PRICING[catId]?.price || 2500),
    0
  );

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setCreateError('');
    if (childForm.categories.length === 0) {
      setCreateError(t('parentSelectAtLeastOneCategory', 'Please select at least one class category.'));
      return;
    }
    if (childForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    setCardForm((prev) => ({
      ...prev,
      cardName: `${childForm.firstName} ${childForm.lastName}`.trim() || 'Parent Account',
    }));
    setStep(2); // Go to mock payment gateway
  };

  const handleQuickFillCard = () => {
    setCardForm({
      cardNumber: '4242 4242 4242 4242',
      rawCardNumber: '4242424242424242',
      expiry: '12/28',
      cvv: '789',
      cardName: `${childForm.firstName} ${childForm.lastName}`.trim() || 'Kasun Silva',
    });
    setCreateError('');
  };

  const handleFinalSubmitWithPayment = async (e) => {
    e.preventDefault();
    setCreateError('');

    try {
      setIsSubmitting(true);
      const res = await api.post('/parent/children', {
        ...childForm,
        paymentDetails: {
          amount: totalAmount,
          paymentMethod: 'MOCK_CARD',
          cardLast4: cardForm.rawCardNumber.slice(-4),
        },
      });

      setCreatedSuccessData({
        ...res.data.data,
        plainPassword: childForm.password,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error during student registration & payment:', err);
      setCreateError(err.response?.data?.message || 'Failed to complete registration and payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedSuccessData(null);
    setCreateError('');
    setStep(1);
    setChildForm({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      categories: [3],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {step === 2 ? <CreditCard className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {step === 2 ? 'Mock Payment Gateway' : t('parentAddStudent', 'Create Student Account')}
                </h3>
                {step === 2 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Mock Sandbox
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {step === 2
                  ? 'Complete mock course fee payment to activate student enrollment'
                  : 'Enter child credentials & select class categories'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {createdSuccessData ? (
            /* Success View with Credentials & Payment Confirmation */
            <div className="text-center space-y-4 py-1">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg">
                  Student Account & Payment Approved!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  The child account is active and class enrollments are activated.
                </p>
              </div>

              {/* Login Credentials Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Login Credentials
                </span>

                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900">
                    {createdSuccessData.firstName} {createdSuccessData.lastName}
                  </strong>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Username:</span>
                  <strong className="text-blue-700 font-mono font-bold text-sm">
                    {createdSuccessData.username}
                  </strong>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Student Email:</span>
                  <span className="text-slate-700 font-mono">{createdSuccessData.email}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Password:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    {createdSuccessData.plainPassword}
                  </strong>
                </div>

                {createdSuccessData.paymentReceipt && (
                  <div className="pt-1.5 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {createdSuccessData.paymentReceipt.transactionId}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Paid Amount:</span>
                      <strong className="text-emerald-700 font-bold">
                        LKR {createdSuccessData.paymentReceipt.amount?.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Access Valid Until:</span>
                      <span className="font-bold text-blue-700">
                        {formatValidDate(createdSuccessData.paymentReceipt.validUntil)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Renewal Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-left text-[11px] text-amber-900 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Renewal Notice:</strong>
                  Every class expires monthly. Active students must renew their monthly fee by the{' '}
                  <strong>2nd week of each month</strong>.
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : step === 1 ? (
            /* STEP 1: STUDENT DETAILS & CLASS SELECTION */
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {createError}
                </div>
              )}

              {/* Monthly Expiry Notice Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="font-bold block">Class Expiration & Renewal:</strong>
                  Every class expires monthly. Renewal is required every{' '}
                  <strong>2nd week of the month</strong> for active students.
                </div>
              </div>

              {/* Child First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={childForm.firstName}
                    onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                    placeholder="e.g. Kasun"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={childForm.lastName}
                    onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                    placeholder="e.g. Silva"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Child Username & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('parentChildUsername', 'Child Username')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={childForm.username}
                    onChange={(e) => setChildForm({ ...childForm, username: e.target.value })}
                    placeholder="e.g. kasun04"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('parentChildPassword', 'Temporary Password')} *
                  </label>
                  <input
                    type="password"
                    required
                    value={childForm.password}
                    onChange={(e) => setChildForm({ ...childForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Class Categories Selection with Fees */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {t('parentSelectCategories', 'Select Enrolled Classes')} *
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600">
                    Total: LKR {totalAmount.toLocaleString()} / mo
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Grade 04 */}
                  <div
                    onClick={() => handleCategoryToggle(2)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      childForm.categories.includes(2)
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {childForm.categories.includes(2) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Grade 04 Scholarship</span>
                        <span className="text-[11px] text-slate-500">Special Papers 01 & 02</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-blue-700">LKR 2,500</span>
                  </div>

                  {/* Grade 05 */}
                  <div
                    onClick={() => handleCategoryToggle(3)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      childForm.categories.includes(3)
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {childForm.categories.includes(3) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Grade 05 Scholarship</span>
                        <span className="text-[11px] text-slate-500">Papers 01, 02 & Math</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-blue-700">LKR 2,500</span>
                  </div>

                  {/* Quiz Class */}
                  <div
                    onClick={() => handleCategoryToggle(4)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      childForm.categories.includes(4)
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {childForm.categories.includes(4) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Quiz Class Practice</span>
                        <span className="text-[11px] text-slate-500">MCQ Quizzes & Assessments</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-blue-700">LKR 1,500</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  {t('actionCancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Proceed to Payment (LKR {totalAmount.toLocaleString()})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: MOCK PAYMENT GATEWAY */
            <form onSubmit={handleFinalSubmitWithPayment} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {createError}
                </div>
              )}

              {/* Order Breakdown Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                  <span>Student Name:</span>
                  <strong className="text-slate-900">
                    {childForm.firstName} {childForm.lastName} ({childForm.username})
                  </strong>
                </div>

                <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                  <span>Selected Classes:</span>
                  <span className="font-bold text-blue-700">
                    {childForm.categories.length} Category(s)
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-800 pt-1 font-bold">
                  <span>First Month Access Fee:</span>
                  <span className="text-emerald-700 text-base font-black">
                    LKR {totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 leading-relaxed">
                  &bull; Class access is valid for 1 month.
                  <br />
                  &bull; Renewal date is every <strong>2nd week of the month</strong>.
                </div>
              </div>

              {/* Mock Card Form */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Mock Card Details</span>
                  <button
                    type="button"
                    onClick={handleQuickFillCard}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Auto-fill Test Card
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="12/28"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="•••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardForm.cardName}
                    onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Cardholder Name"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay LKR {totalAmount.toLocaleString()} & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
