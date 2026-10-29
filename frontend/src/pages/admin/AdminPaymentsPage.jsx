import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  CreditCard,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  Download,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  User,
  GraduationCap,
  Calendar,
  DollarSign,
  ShieldCheck,
  X,
  Filter,
  Printer,
  ChevronDown,
  Archive,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatValidDate } from '../../utils/dateUtils';

export function getReceiptFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function AdminPaymentsPage() {
  const { t } = useLanguage();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    totalRevenue: 0,
    cardRevenue: 0,
    cardCount: 0,
    slipRevenue: 0,
    slipCount: 0,
    categoryBreakdown: {},
  });

  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(''); // Default to current month from backend

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected payment for inspection modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');

  // Rejection reason state
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Image zoom state in preview modal
  const [zoomLevel, setZoomLevel] = useState(1);

  // Financial Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchPayments = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedMonth) {
        params.month = selectedMonth;
      }

      const res = await api.get('/payments/admin/all', { params });
      if (res.data?.data) {
        setPayments(res.data.data.payments || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
        if (res.data.data.availableMonths) {
          setAvailableMonths(res.data.data.availableMonths);
        }
        if (!selectedMonth && res.data.data.selectedMonth) {
          setSelectedMonth(res.data.data.selectedMonth);
        }
      }
    } catch (err) {
      console.error('Failed to load admin payments:', err);
      setError(err.response?.data?.message || 'Failed to load payment records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, selectedMonth]);

  const handleOpenReviewModal = (payment) => {
    setSelectedPayment(payment);
    setZoomLevel(1);
    setShowRejectForm(false);
    setRejectReason('');
    setActionSuccessMessage('');
    setActionErrorMessage('');
  };

  const handleCloseReviewModal = () => {
    setSelectedPayment(null);
    setZoomLevel(1);
    setShowRejectForm(false);
    setRejectReason('');
    setActionSuccessMessage('');
    setActionErrorMessage('');
  };

  const handleApprove = async (paymentId) => {
    if (!paymentId) return;
    try {
      setIsProcessingAction(true);
      setActionErrorMessage('');
      setActionSuccessMessage('');

      const res = await api.put(`/payments/admin/${paymentId}/approve`);
      if (res.data?.success) {
        setActionSuccessMessage('Payment approved successfully! Student access has been activated.');
        await fetchPayments(true);
        if (selectedPayment && selectedPayment.id === paymentId) {
          setSelectedPayment((prev) => ({
            ...prev,
            payment_status: 'COMPLETED',
          }));
        }
        setTimeout(() => {
          handleCloseReviewModal();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to approve payment:', err);
      setActionErrorMessage(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async (paymentId) => {
    if (!paymentId) return;
    const finalReason = rejectReason.trim() || 'Bank slip verification failed or unclear image.';
    try {
      setIsProcessingAction(true);
      setActionErrorMessage('');
      setActionSuccessMessage('');

      const res = await api.put(`/payments/admin/${paymentId}/reject`, { reason: finalReason });
      if (res.data?.success) {
        setActionSuccessMessage('Payment has been rejected.');
        await fetchPayments(true);
        if (selectedPayment && selectedPayment.id === paymentId) {
          setSelectedPayment((prev) => ({
            ...prev,
            payment_status: 'REJECTED',
            notes: `${prev.notes || ''} [Rejected: ${finalReason}]`,
          }));
        }
        setTimeout(() => {
          handleCloseReviewModal();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to reject payment:', err);
      setActionErrorMessage(err.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExportCSV = () => {
    if (!payments.length) return;
    const headers = [
      'Transaction ID',
      'Billing Month',
      'Date',
      'Student Name',
      'Student Email',
      'Parent Name',
      'Payment Method',
      'Amount (LKR)',
      'Status',
      'Courses',
      'Notes',
    ];
    const rows = payments.map((p) => [
      `"${p.transaction_id}"`,
      `"${p.billing_month || ''}"`,
      `"${p.created_at || ''}"`,
      `"${p.student_first_name} ${p.student_last_name}"`,
      `"${p.student_email || ''}"`,
      `"${p.payer_first_name} ${p.payer_last_name}"`,
      `"${p.payment_method === 'MOCK_CARD' ? 'Card' : 'Bank Slip'}"`,
      p.amount,
      `"${p.payment_status}"`,
      `"${(p.categoryNames || []).join('; ')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Wishwin-Financial-Report-${selectedMonth || 'cycle'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isReceiptPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  };

  // Human readable label for active selected month
  const activeMonthLabel = useMemo(() => {
    const found = availableMonths.find((m) => m.value === selectedMonth);
    return found ? found.label : selectedMonth || 'Current Month';
  }, [selectedMonth, availableMonths]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header with Month Selector & Report Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <PageHeader
              title={t('navPayments', 'Payments & Approvals')}
              subtitle="Inspect bank deposit slips, verify course registrations, and manage monthly revenue settlement."
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Billing Month Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Financial Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial Report</span>
            </button>

            {/* Sleek Refresh Icon Button */}
            <button
              type="button"
              onClick={() => fetchPayments(true)}
              disabled={refreshing || loading}
              title="Refresh payments"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 shadow-2xs transition flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards (Scoped to Selected Month) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Monthly Revenue (Limit for this Month) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Monthly Verified Revenue
                </p>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  Monthly Limit
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                LKR {summary.totalRevenue?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {activeMonthLabel} &bull; Renews monthly
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Pending Approvals (Urgent Callout) */}
          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`rounded-2xl p-4 border shadow-2xs flex items-center justify-between cursor-pointer transition ${
              summary.pendingCount > 0
                ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/70'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Pending Approvals
                </p>
                {summary.pendingCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-amber-900 tracking-tight">
                {summary.pendingCount} Slips
              </p>
              <p className="text-[11px] text-amber-700 font-medium">
                {summary.pendingCount > 0 ? 'Requires admin review' : 'All slips reviewed'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Approved Count */}
          <div
            onClick={() => setStatusFilter('COMPLETED')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-blue-300 transition"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Approved Transactions
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {summary.completedCount}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active this month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Rejected */}
          <div
            onClick={() => setStatusFilter('REJECTED')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-rose-300 transition"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rejected Slips
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {summary.rejectedCount}
              </p>
              <p className="text-[11px] text-rose-500 font-medium">Declined in this cycle</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>All ({activeMonthLabel})</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">
                {summary.totalCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Approvals</span>
              {summary.pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-200 text-amber-900 font-black">
                  {summary.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">
                {summary.completedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">
                {summary.rejectedCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, parent, ref ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Loading payment transactions..." />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchPayments(true)} />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No Payment Records Found for This Cycle"
            description={
              statusFilter === 'PENDING'
                ? `No pending bank slip approvals in ${activeMonthLabel}.`
                : `No payments recorded for ${activeMonthLabel}. The monthly balance starts clean at LKR 0.`
            }
          />
        ) : (
          /* Table of Payments */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction / Date</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Payer (Parent)</th>
                    <th className="py-3 px-4">Courses / Grade</th>
                    <th className="py-3 px-4">Amount & Method</th>
                    <th className="py-3 px-4">Slip Preview</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payments.map((p) => {
                    const isPending = p.payment_status === 'PENDING';
                    const isCompleted = p.payment_status === 'COMPLETED';
                    const isRejected = p.payment_status === 'REJECTED';
                    const hasSlip = Boolean(p.receipt_url);
                    const slipUrl = hasSlip ? getReceiptFileUrl(p.receipt_url) : null;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isPending ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Transaction ID & Date */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                          <div className="font-bold text-slate-900">{p.transaction_id}</div>
                          <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {p.created_at || 'N/A'}
                          </div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {p.student_first_name} {p.student_last_name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.student_email}
                          </div>
                        </td>

                        {/* Payer (Parent) */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {p.payer_first_name} {p.payer_last_name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.payer_phone || p.payer_email}
                          </div>
                        </td>

                        {/* Courses / Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {p.categoryNames && p.categoryNames.length > 0 ? (
                              p.categoryNames.map((cName, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded text-[10px] font-semibold"
                                >
                                  {cName}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">General Fee</span>
                            )}
                          </div>
                        </td>

                        {/* Amount & Method */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 text-sm">
                            LKR {Number(p.amount)?.toLocaleString()}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            {p.payment_method === 'MOCK_CARD' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                <CreditCard className="w-3 h-3 text-slate-500" />
                                Card (Auto)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Building className="w-3 h-3 text-blue-600" />
                                Bank Slip
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Slip Preview Thumbnail */}
                        <td className="py-3.5 px-4">
                          {hasSlip ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(p)}
                              className="group relative flex items-center gap-2 p-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer transition text-left"
                            >
                              {isReceiptPdf(p.receipt_url) ? (
                                <div className="w-9 h-9 bg-red-100 text-red-600 rounded flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded bg-slate-200 overflow-hidden shrink-0 relative">
                                  <img
                                    src={slipUrl}
                                    alt="Slip"
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                </div>
                              )}
                              <div className="pr-2">
                                <span className="block text-[11px] font-bold text-blue-700 group-hover:underline flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  View Slip
                                </span>
                                <span className="text-[9px] text-slate-400">Click to inspect</span>
                              </div>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Direct Gateway
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 animate-pulse" />
                              Pending Approval
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(p)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Review</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(p.id)}
                                  title="Quick Approve"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenReviewModal(p)}
                                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCIAL REPORT MODAL (Monthly Settlement & Accounting) */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:fixed print:inset-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
              {/* Report Header Bar (hidden in print) */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Monthly Financial Settlement Report</h3>
                    <p className="text-[11px] text-slate-400">
                      Cycle: {activeMonthLabel} &bull; Generated for Wishwin Education Center
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-6 print:overflow-visible">
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      WISHWIN EDUCATION CENTER
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Scholarship & Academic Development Portal &bull; Financial Audit Report
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Report Cycle: <strong className="text-slate-700">{activeMonthLabel}</strong> &bull; Printed: {new Date().toLocaleDateString('en-CA')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Audited Statement
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Status: Balanced</p>
                  </div>
                </div>

                {/* Revenue Overview Stats Strip */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Revenue Collected
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      LKR {summary.totalRevenue?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {summary.completedCount} successful transactions
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Card vs Bank Slip Split
                    </span>
                    <div className="text-xs font-semibold text-slate-800 mt-1 space-y-0.5">
                      <div>Card: <strong>LKR {summary.cardRevenue?.toLocaleString()}</strong> ({summary.cardCount})</div>
                      <div>Bank Slip: <strong>LKR {summary.slipRevenue?.toLocaleString()}</strong> ({summary.slipCount})</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Cycle Pending Status
                    </span>
                    <p className="text-lg font-bold text-amber-700 mt-1">
                      {summary.pendingCount} Pending Slips
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {summary.rejectedCount} Rejected
                    </p>
                  </div>
                </div>

                {/* Course Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Class & Subject Revenue Distribution
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Subject / Grade</th>
                        <th className="py-2.5 px-3 text-center">Subscribed Students</th>
                        <th className="py-2.5 px-3 text-right">Standard Fee</th>
                        <th className="py-2.5 px-3 text-right">Revenue Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {summary.categoryBreakdown &&
                        Object.keys(summary.categoryBreakdown).map((catId) => {
                          const item = summary.categoryBreakdown[catId];
                          return (
                            <tr key={catId} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{item.count}</td>
                              <td className="py-2.5 px-3 text-right text-slate-500">
                                LKR {(catId === '4' ? 1500 : 2500).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                LKR {item.amount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Itemized Transaction Ledger */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Itemized Payment Ledger ({payments.length} Records)
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Trans ID</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Student Name</th>
                          <th className="py-2 px-3">Payer</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Amount (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono font-medium text-slate-700">{p.transaction_id}</td>
                            <td className="py-2 px-3 text-slate-500">{p.created_at}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {p.student_first_name} {p.student_last_name}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {p.payer_first_name} {p.payer_last_name}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {p.payment_method === 'MOCK_CARD' ? 'Card' : 'Bank Slip'}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  p.payment_status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.payment_status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.payment_status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {Number(p.amount)?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Verification Signatures (Print only) */}
                <div className="pt-8 grid grid-cols-2 gap-12 text-xs text-slate-600 border-t border-slate-200 mt-6">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Prepared by: Administrator</p>
                    <p className="text-[10px] text-slate-400">Wishwin LMS Accounting & Approvals</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2 text-right">
                    <p className="font-bold text-slate-800">Verified by: Center Director</p>
                    <p className="text-[10px] text-slate-400">Wishwin Education Center Pvt Ltd</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer (hidden in print) */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between print:hidden">
                <span className="text-[11px] text-slate-500">
                  Data retained in MySQL database for past 3+ months.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECEIPT INSPECTION & APPROVAL MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Topbar */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">Payment Review & Slip Verification</h3>
                      {selectedPayment.payment_status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                          Pending Approval
                        </span>
                      )}
                      {selectedPayment.payment_status === 'COMPLETED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {selectedPayment.payment_status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Ref: {selectedPayment.transaction_id} &bull; Cycle: {selectedPayment.billing_month || 'Current'} &bull; Uploaded on {selectedPayment.created_at}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseReviewModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alert Feedback Messages */}
              {actionSuccessMessage && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}
              {actionErrorMessage && (
                <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionErrorMessage}</span>
                </div>
              )}

              {/* Modal Body: Split 2 Columns */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Bank Slip Preview (7 cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      Uploaded Bank Slip / Receipt
                    </label>

                    {selectedPayment.receipt_url && (
                      <div className="flex items-center gap-1.5">
                        {!isReceiptPdf(selectedPayment.receipt_url) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono text-slate-500 w-8 text-center">
                              {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <a
                          href={getReceiptFileUrl(selectedPayment.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Full Tab</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Image or PDF Canvas */}
                  <div className="flex-1 min-h-[350px] max-h-[460px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center p-2">
                    {selectedPayment.receipt_url ? (
                      isReceiptPdf(selectedPayment.receipt_url) ? (
                        <object
                          data={`${getReceiptFileUrl(selectedPayment.receipt_url)}#toolbar=1`}
                          type="application/pdf"
                          className="w-full h-full min-h-[380px] rounded-lg"
                        >
                          <iframe
                            src={`${getReceiptFileUrl(selectedPayment.receipt_url)}#toolbar=1`}
                            className="w-full h-full min-h-[380px] border-0"
                            title="Receipt PDF"
                          />
                        </object>
                      ) : (
                        <div className="w-full h-full overflow-auto flex items-center justify-center">
                          <img
                            src={getReceiptFileUrl(selectedPayment.receipt_url)}
                            alt="Receipt Preview"
                            style={{ transform: `scale(${zoomLevel})` }}
                            className="max-w-full max-h-[420px] object-contain rounded-lg shadow-xs transition-transform duration-100 origin-center"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">No physical deposit slip</p>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          This transaction was charged via automated mock card checkout.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Transaction & Student Details (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-200">
                      Payment Particulars
                    </h4>

                    {/* Amount & Status Banner */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Total Amount Paid
                        </span>
                        <p className="text-xl font-black text-slate-900">
                          LKR {Number(selectedPayment.amount)?.toLocaleString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedPayment.payment_method === 'MOCK_CARD' ? 'Card Gateway' : 'Bank Transfer'}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                        <User className="w-3 h-3 text-blue-600" />
                        Student Beneficiary
                      </div>
                      <p className="font-bold text-slate-900 text-xs">
                        {selectedPayment.student_first_name} {selectedPayment.student_last_name}
                      </p>
                      <p className="text-[11px] text-slate-500">{selectedPayment.student_email}</p>
                    </div>

                    {/* Parent Info */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Parent / Payer
                      </div>
                      <p className="font-bold text-slate-900 text-xs">
                        {selectedPayment.payer_first_name} {selectedPayment.payer_last_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedPayment.payer_email} &bull; {selectedPayment.payer_phone || 'No phone'}
                      </p>
                    </div>

                    {/* Class / Subject Info */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Target Courses
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPayment.categoryNames && selectedPayment.categoryNames.length > 0 ? (
                          selectedPayment.categoryNames.map((name, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[10px]"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Class subscription</span>
                        )}
                      </div>
                    </div>

                    {/* Notes / Bank Ref */}
                    {selectedPayment.notes && (
                      <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600">
                        <strong className="text-slate-700">Notes / Reference: </strong>
                        {selectedPayment.notes}
                      </div>
                    )}

                    {/* Rejection Form Input */}
                    {showRejectForm && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-100">
                        <label className="block text-[11px] font-bold text-rose-900">
                          State Reason for Rejection:
                        </label>
                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Deposit slip image is illegible or amount doesn't match fee..."
                          className="w-full p-2 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200/60 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isProcessingAction}
                            onClick={() => handleReject(selectedPayment.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px]"
                          >
                            {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    {selectedPayment.payment_status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        {!showRejectForm && (
                          <button
                            type="button"
                            disabled={isProcessingAction}
                            onClick={() => setShowRejectForm(true)}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Slip</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => handleApprove(selectedPayment.id)}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5"
                        >
                          {isProcessingAction ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleCloseReviewModal}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                        >
                          Close Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
