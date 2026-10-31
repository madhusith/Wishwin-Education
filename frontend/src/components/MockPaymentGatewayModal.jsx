import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  RefreshCw,
  Printer,
} from 'lucide-react';
import api from '../services/api';
import { formatValidDate } from '../utils/dateUtils';

export const CATEGORY_PRICING = {
  2: { id: 2, name: 'Grade 04 Scholarship', price: 2500, desc: 'Special Papers 01 & 02' },
  3: { id: 3, name: 'Grade 05 Scholarship', price: 2500, desc: 'Special Papers 01 & 02' },
  4: { id: 4, name: 'Quiz Class Practice', price: 1500, desc: 'MCQ Practice & Tests' },
};

export default function MockPaymentGatewayModal({
  isOpen,
  onClose,
  student,
  categories = [3],
  customAmount = null,
  purpose = 'MONTHLY_RENEWAL',
  onSuccess,
}) {
  // Only 2 methods: CARD or RECEIPT
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'RECEIPT'

  const [cardForm, setCardForm] = useState({
    cardNumber: '4242 •••• •••• 4242',
    rawCardNumber: '4242424242424242',
    expiry: '12/28',
    cvv: '789',
    cardName: student?.name || 'Kasun Silva',
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [bankRef, setBankRef] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [receipt, setReceipt] = useState(null);

  if (!isOpen) return null;

  // Calculate total amount
  const categoryList = (categories || []).map(
    (catId) => CATEGORY_PRICING[catId] || { id: catId, name: `Class #${catId}`, price: 2500 }
  );

  const calculatedTotal =
    customAmount !== null
      ? customAmount
      : categoryList.reduce((sum, item) => sum + item.price, 0) || 2500;

  const handleQuickFillCard = () => {
    setCardForm({
      cardNumber: '4242 4242 4242 4242',
      rawCardNumber: '4242424242424242',
      expiry: '12/28',
      cvv: '789',
      cardName: student?.name || 'Kasun Silva',
    });
    setPaymentError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setPaymentError('');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (paymentMethod === 'RECEIPT' && !receiptFile && !bankRef.trim()) {
      setPaymentError('Please attach your deposit slip or enter a bank transfer reference number.');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'CARD') {
        setProcessingStep('Authorizing card with issuing bank...');
      } else {
        setProcessingStep('Uploading and submitting bank deposit slip...');
      }
      await new Promise((r) => setTimeout(r, 650));

      let res;
      if (paymentMethod === 'RECEIPT' && receiptFile) {
        const formData = new FormData();
        formData.append('studentId', student?.id);
        formData.append('categories', JSON.stringify(categories));
        formData.append('amount', calculatedTotal);
        formData.append('paymentMethod', 'MOCK_BANK_RECEIPT');
        formData.append('receipt', receiptFile);
        formData.append(
          'notes',
          `${purpose} - Bank Slip Upload (${receiptFile.name})${bankRef ? ' Ref: ' + bankRef : ''}`
        );
        res = await api.post('/payments/mock-charge', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = {
          studentId: student?.id,
          categories: categories,
          amount: calculatedTotal,
          paymentMethod: paymentMethod === 'CARD' ? 'MOCK_CARD' : 'MOCK_BANK_RECEIPT',
          cardLast4: paymentMethod === 'CARD' ? cardForm.rawCardNumber.slice(-4) : 'SLIP',
          notes: `${purpose} - ${
            paymentMethod === 'CARD'
              ? 'Card Checkout'
              : `Bank Transfer Ref: ${bankRef || 'Manual'}`
          }`,
        };
        res = await api.post('/payments/mock-charge', payload);
      }

      const data = res.data.data;
      setReceipt(data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleClose = () => {
    setReceipt(null);
    setReceiptFile(null);
    setBankRef('');
    setPaymentError('');
    setIsProcessing(false);
    onClose();
  };

  const isPendingApproval = receipt?.paymentStatus === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Clean Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Wishwin Payment</h3>
              <p className="text-[11px] text-slate-400">Class Fee Subscription</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {receipt ? (
            /* SUCCESS / PENDING RECEIPT VIEW */
            <div className="text-center space-y-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isPendingApproval
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {isPendingApproval ? (
                  <FileText className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isPendingApproval ? 'Slip Uploaded Successfully!' : 'Payment Successful!'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPendingApproval
                    ? `Receipt submitted for ${student?.name || 'student'}. Pending Admin verification & approval.`
                    : `Monthly class pass has been activated for ${student?.name || 'student'}.`}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-left">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isPendingApproval
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {isPendingApproval ? 'PENDING APPROVAL' : 'COMPLETED'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Receipt Ref:</span>
                  <span className="font-mono font-bold text-blue-700">{receipt.transactionId}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-900">{student?.name || 'Student'}</strong>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Amount:</span>
                  <strong className="text-emerald-700 font-bold">LKR {receipt.amount?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Valid Date:</span>
                  <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatValidDate(receipt.validUntil)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT CHECKOUT FORM */
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Order Summary Strip */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Paying for:</span>
                  <p className="font-bold text-slate-900">{student?.name || 'Student'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium">Total Fee:</span>
                  <p className="text-base font-extrabold text-blue-700">
                    LKR {calculatedTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 2 Payment Methods: Card vs Receipt Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CARD');
                      setPaymentError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'CARD'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('RECEIPT');
                      setPaymentError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'RECEIPT'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Receipt Upload</span>
                  </button>
                </div>
              </div>

              {/* OPTION 1: CARD FORM */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Credit / Debit Card (Visa / MasterCard)
                    </span>
                    <button
                      type="button"
                      onClick={handleQuickFillCard}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Auto-fill
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Card Number"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="MM/YY"
                      required
                    />
                    <input
                      type="password"
                      maxLength={4}
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="CVV"
                      required
                    />
                  </div>
                </div>
              )}

              {/* OPTION 2: RECEIPT UPLOAD */}
              {paymentMethod === 'RECEIPT' && (
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs">
                  {/* Bank Account Info */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-0.5">
                    <p className="font-bold text-slate-900">Commercial Bank of Ceylon</p>
                    <p className="text-[11px] text-slate-600">
                      Acc: <strong className="font-mono text-slate-900">1000-8849-2910</strong> &bull; Nugegoda Branch
                    </p>
                    <p className="text-[10px] text-slate-500">Wishwin Education Pvt Ltd</p>
                  </div>

                  {/* File Upload Box */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                      Upload Bank Deposit Slip / Receipt
                    </label>
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl cursor-pointer transition group">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {receiptFile ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[220px]">{receiptFile.name}</span>
                          <span className="text-[10px] text-slate-400">({Math.round(receiptFile.size / 1024)} KB)</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-blue-600 transition">
                          <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                          <span className="text-xs font-semibold">Click to choose image or PDF slip</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bank Ref / Slip No (Optional if slip attached)
                    </label>
                    <input
                      type="text"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      placeholder="e.g. REF-COM-984210"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              {paymentError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{processingStep || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {paymentMethod === 'CARD'
                          ? `Pay LKR ${calculatedTotal.toLocaleString()}`
                          : 'Submit Receipt'}
                      </span>
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
