import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  Sparkles,
  RefreshCw,
  Printer,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const CATEGORY_PRICING = {
  2: { id: 2, name: 'Grade 04 Scholarship', price: 2500, desc: 'Special Papers 01 & 02' },
  3: { id: 3, name: 'Grade 05 Scholarship', price: 2500, desc: 'Special Papers 01 & 02 + Math' },
  4: { id: 4, name: 'Quiz Class Practice', price: 1500, desc: 'MCQ Practice & Assessments' },
};

export default function MockPaymentGatewayModal({
  isOpen,
  onClose,
  student,
  categories = [3],
  customAmount = null,
  purpose = 'REGISTRATION', // 'REGISTRATION' | 'MONTHLY_RENEWAL' | 'CLASS_CHANGE'
  onSuccess,
}) {
  const { t } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'BANK' | 'WALLET'
  const [cardForm, setCardForm] = useState({
    cardNumber: '4242 •••• •••• 4242',
    rawCardNumber: '4242424242424242',
    expiry: '12/28',
    cvv: '789',
    cardName: student?.name || 'Nimal Silva',
  });

  const [bankRef, setBankRef] = useState('');
  const [walletPhone, setWalletPhone] = useState('0771234567');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [receipt, setReceipt] = useState(null);

  if (!isOpen) return null;

  // Calculate total amount
  const categoryList = (categories || []).map((catId) => CATEGORY_PRICING[catId] || {
    id: catId,
    name: `Class Category #${catId}`,
    price: 2500,
  });

  const calculatedTotal = customAmount !== null
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

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessing(true);

    try {
      setProcessingStep('Connecting to Wishwin Mock Payment Gateway...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep('Authorizing card with issuing bank...');
      await new Promise((r) => setTimeout(r, 600));

      const payload = {
        studentId: student?.id,
        categories: categories,
        amount: calculatedTotal,
        paymentMethod: paymentMethod === 'CARD' ? 'MOCK_CARD' : paymentMethod === 'BANK' ? 'MOCK_BANK_SLIP' : 'MOCK_WALLET',
        cardLast4: paymentMethod === 'CARD' ? cardForm.rawCardNumber.slice(-4) : 'BANK',
        notes: `${purpose} - Monthly Subscription`,
      };

      const res = await api.post('/payments/mock-charge', payload);
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
    setPaymentError('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Wishwin Secure Payment
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mock Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                256-Bit SSL Encrypted &bull; No Real Money Charged
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {receipt ? (
            /* SUCCESS RECEIPT VIEW */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Payment Successful!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Course access has been activated and enrolled in the system.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-2.5 text-left shadow-2xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-blue-700">{receipt.transactionId}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-900">{student?.name || 'Enrolled Student'}</strong>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Amount Paid:</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    LKR {receipt.amount?.toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="font-semibold text-slate-700">Monthly Pass ({receipt.billingMonth})</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-bold text-slate-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                    {receipt.validUntil} (2nd week)
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Monthly Renewal Rule:</strong>
                    Every class expires monthly. The next renewal date for active students is the <strong>2nd week of next month</strong>.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Continue & Return
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT CHECKOUT FORM VIEW */
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Policy Notice Box */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-bold text-amber-950 block">
                    Monthly Class Expiration & Renewal Policy
                  </strong>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Every enrolled class expires monthly. Active students must renew their monthly fee by the{' '}
                    <strong>2nd week of each month (14th)</strong> to maintain active status and access live classes.
                  </p>
                </div>
              </div>

              {/* Order & Class Summary */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Student:</span>
                  <strong className="text-slate-900 font-bold">
                    {student?.name || 'Kasun Silva'} ({student?.email || 'Student Account'})
                  </strong>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Enrolled Courses / Classes:
                  </span>
                  {categoryList.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        <span className="text-[11px] text-slate-400">({cat.desc})</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">
                        LKR {cat.price.toLocaleString()} / mo
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">Total Monthly Amount:</span>
                  <span className="font-black text-blue-700 text-lg">
                    LKR {calculatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Mock Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'CARD'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'BANK'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'WALLET'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Genie / Koko</span>
                  </button>
                </div>
              </div>

              {/* Method Detail Forms */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Mock Card Details (Visa / MasterCard)
                    </span>
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
                    <div className="relative">
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="4242 4242 4242 4242"
                        required
                      />
                      <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">
                        VISA / MC
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardForm.expiry}
                        onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="12/28"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardForm.cardName}
                      onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. Kasun Silva"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'BANK' && (
                <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">Commercial Bank of Ceylon</p>
                    <p className="text-[11px] text-slate-500">Account: 1000-8849-2910 &bull; Branch: Nugegoda</p>
                    <p className="text-[11px] text-slate-500">Wishwin Education Pvt Ltd</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Bank Deposit / Transfer Reference #
                    </label>
                    <input
                      type="text"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      placeholder="e.g. REF-COM-984210"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'WALLET' && (
                <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Mobile Number (Genie / Koko / EzCash)
                    </label>
                    <input
                      type="tel"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      placeholder="0771234567"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A mock authorization push notification will be simulated.
                  </p>
                </div>
              )}

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{processingStep || 'Processing Payment...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay LKR {calculatedTotal.toLocaleString()} & Activate</span>
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
