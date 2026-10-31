import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ChildSelector from '../../components/ChildSelector';
import MockPaymentGatewayModal from '../../components/MockPaymentGatewayModal';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  Receipt,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { formatValidDate } from '../../utils/dateUtils';

export default function ParentPaymentStatusPage() {
  const { t } = useLanguage();

  const [childrenList, setChildrenList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    try {
      return localStorage.getItem('wishwin_parent_selected_child_id') || '';
    } catch (e) {
      return '';
    }
  });

  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Modal & Receipt View Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchPaymentData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch children list
      const res = await api.get('/parent/children');
      const kids = res.data?.data || [];
      setChildrenList(kids);

      if (kids.length > 0) {
        const storedId = localStorage.getItem('wishwin_parent_selected_child_id');
        const activeKid = kids.find((k) => String(k.id) === String(storedId)) || kids[0];
        setSelectedStudentId(String(activeKid.id));
        await fetchPaymentData(activeKid.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching parent children:', err);
      setError('Failed to load linked students.');
      setLoading(false);
    }
  };

  const fetchPaymentData = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      const [statusRes, historyRes] = await Promise.allSettled([
        api.get(`/payments/status/${studentId}`),
        api.get(`/payments/history/${studentId}`),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value?.data?.data) {
        setPaymentStatus(statusRes.value.data.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value?.data?.data) {
        setPaymentHistory(historyRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching payment status & history:', err);
      setError('Failed to retrieve payment records for this student.');
    } finally {
      setLoading(false);
    }
  };

  const currentChild =
    childrenList.find((c) => String(c.id) === String(selectedStudentId)) || childrenList[0];

  const currentStatus =
    paymentStatus?.status || (paymentStatus?.isPaid ? 'ACTIVE' : 'PAYMENT_NEEDED');
  const validDateFormatted = formatValidDate(paymentStatus?.validUntil);
  const canRenew = paymentStatus?.canRenew ?? (currentStatus !== 'ACTIVE');

  return (
    <DashboardLayout>
      <PageHeader
        title="Fee Payment Status & History"
        subtitle="Review monthly pass validity, next renewal dates, and full payment receipts for your children."
        breadcrumbs={[
          { label: t('roleParent', 'Parent'), href: '/parent/dashboard' },
          { label: 'Payment Status' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={() => fetchPaymentData(selectedStudentId)} className="mb-4" />}

      {/* Child Switcher Dropdown */}
      {childrenList.length > 0 && (
        <ChildSelector
          childrenList={childrenList}
          selectedChildId={selectedStudentId}
          onSelect={(newId) => setSelectedStudentId(String(newId))}
        />
      )}

      {loading ? (
        <LoadingSpinner message="Loading payment status & transaction history..." />
      ) : !currentChild ? (
        <EmptyState
          icon={CreditCard}
          title="No Student Linked"
          description="Create a student account first to track class fees and payments."
        />
      ) : (
        <div className="space-y-6">
          {/* Top Subscription Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  currentStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : currentStatus === 'PAYMENT_NEEDED'
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                <CreditCard className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Monthly Class Pass</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
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
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {paymentStatus?.validUntil ? (
                    <>
                      Valid Date: <strong className="text-slate-800 font-semibold">{validDateFormatted}</strong>{' '}
                      &bull; Renewal Cycle: <strong className="text-blue-700">{paymentStatus.renewalLabel}</strong>
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
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
              >
                <CreditCard className="w-4 h-4" />
                <span>{currentStatus === 'ACTIVE' ? 'Renew for Next Month' : 'Pay Monthly Fee'}</span>
              </button>
            )}
          </div>

          {/* Payment History Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Payment History & Receipts
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete billing transaction records for {currentChild.name}.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {paymentHistory.length} {paymentHistory.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No past payment transactions found for this student.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Transaction Ref</th>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {formatValidDate(item.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-700 font-semibold">
                          {item.transaction_id}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {item.billing_month}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                            {item.payment_method?.includes('CARD') ? (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                Card (•• {item.card_last4 || '4242'})
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                Bank Slip
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          LKR {Number(item.amount)?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.payment_status || 'COMPLETED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition inline-flex items-center gap-1 font-semibold"
                            title="View Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {currentChild && (
        <MockPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={currentChild}
          categories={[2, 3, 4]}
          purpose="MONTHLY_RENEWAL"
          onSuccess={() => fetchPaymentData(selectedStudentId)}
        />
      )}

      {/* Printable / View Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Payment Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-blue-700">{activeReceipt.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <strong className="text-slate-900">{currentChild.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Paid:</span>
                <span className="font-mono text-slate-700">{formatValidDate(activeReceipt.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Cycle:</span>
                <span className="text-slate-700">{activeReceipt.billing_month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <strong className="text-emerald-700 text-sm font-bold">
                  LKR {Number(activeReceipt.amount)?.toLocaleString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Through:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatValidDate(activeReceipt.valid_until)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
