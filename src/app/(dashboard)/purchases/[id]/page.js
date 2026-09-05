'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  Calendar,
  User,
  Tag,
  Barcode,
  Boxes,
  TrendingDown,
  Clock,
  RotateCcw,
  CheckCircle,
  X,
  CreditCard,
  Truck,
  DollarSign,
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function PurchaseDetailPage({ params }) {
  const { t, tp, tc, tu, tb, ts } = useLanguage();
  const resolvedParams = use(params);
  const poId = resolvedParams.id;
  const router = useRouter();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal forms
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelProcessing, setCancelProcessing] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  // Fetch purchase details
  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases/${poId}`);
      const json = await res.json();
      if (res.ok) {
        setPo(json.data);
        // Pre-fill payment amount with outstanding due
        setPayAmount(String(json.data.dueAmount));
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve purchase details.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [poId]);

  // Cancel PO handler
  const handleCancelPO = async (e) => {
    e.preventDefault();
    setCancelProcessing(true);
    try {
      const res = await fetch(`/api/purchases/${poId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      const json = await res.json();
      if (res.ok) {
        setCancelModalOpen(false);
        setCancelReason('');
        fetchPODetails();
      } else {
        throw new Error(json.error?.message || 'Failed to cancel purchase.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelProcessing(false);
    }
  };

  // Record payment handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    setPayProcessing(true);
    setPayError(null);

    const payload = {
      supplierId: po.supplierId,
      purchaseOrderId: poId,
      amount: parseFloat(payAmount),
      method: payMethod,
      reference: payReference || null,
      note: payNote || null
    };

    try {
      const res = await fetch('/api/suppliers/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok) {
        setPaymentModalOpen(false);
        setPayReference('');
        setPayNote('');
        fetchPODetails();
      } else {
        throw new Error(json.error?.message || 'Failed to log supplier payment.');
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayProcessing(false);
    }
  };

  const printPO = () => {
    window.open(`/purchases/${poId}/print`, '_blank', 'width=800,height=900');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 bg-slate-50 h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold">Retrieving purchase order details...</span>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-md mx-auto mt-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <h3 className="font-bold text-lg">Purchase Order Not Found</h3>
        <p className="text-sm mt-1">{error}</p>
        <Link href="/purchases" className="mt-4 inline-block px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm">
          Back to Purchases
        </Link>
      </div>
    );
  }

  const canReceive = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';
  const canPay = po.status !== 'CANCELLED' && po.paymentStatus !== 'PAID';

  return (
    <div className="space-y-6">
      
      {/* Header navigations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/purchases" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Wholesale purchase record</span>
            <h2 className="text-xl font-extrabold text-slate-900">{po.purchaseOrderNumber}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          {canReceive && (
            <Link
              href={`/purchases/${poId}/receive`}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
            >
              <Truck size={16} /> Receive Stock Intake
            </Link>
          )}
          {canPay && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm"
            >
              <DollarSign size={16} /> Record Payment
            </button>
          )}
          {po.status !== 'CANCELLED' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold shadow-sm"
            >
              <Trash2 size={16} /> Cancel Order
            </button>
          )}
          <button
            onClick={printPO}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm"
          >
            <Printer size={16} /> Print / PDF PO
          </button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PO metadata details summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold text-slate-700">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Purchase Overview</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Purchase Date</span>
                <span className="text-slate-800 font-bold">{new Date(po.purchaseDate).toLocaleDateString()}</span>
              </div>
            </div>
            {po.expectedDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Expected Arrival</span>
                  <span className="text-slate-800 font-bold">{new Date(po.expectedDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Logged Operator</span>
                <span className="text-slate-800">{po.user?.name}</span>
              </div>
            </div>
            {po.supplierInvoiceNumber && (
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Supplier Invoice #</span>
                  <span className="text-slate-800 font-mono font-bold uppercase">{po.supplierInvoiceNumber}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-slate-400" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Status Code</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase mt-1 ${
                  po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                  po.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  po.status === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {po.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Wholesale Vendor</span>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-800">
              <Link href={`/suppliers/${po.supplierId}`} className="hover:text-indigo-600">
                <span className="block font-extrabold text-sm">{po.supplier.name}</span>
                {po.supplier.companyName && <span className="block text-[10px] text-slate-400 mt-0.5">{po.supplier.companyName}</span>}
              </Link>
            </div>
          </div>

          {po.notes && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Remarks / Notes</span>
              <p className="text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg font-medium leading-relaxed">
                {po.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Items table and Financial splits */}
        <div className="md:col-span-2 space-y-6">
          
          {/* PO items grid snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs font-semibold">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Snapshot Purchase Line Items
            </div>

            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Product Name</th>
                  <th scope="col" className="px-4 py-3 text-right">Ordered</th>
                  <th scope="col" className="px-4 py-3 text-right">Received</th>
                  <th scope="col" className="px-4 py-3 text-right">Unit Cost</th>
                  <th scope="col" className="px-4 py-3 text-right">Discount</th>
                  <th scope="col" className="px-4 py-3 text-right">GST Rate</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                {po.items.map(item => {
                  const remaining = item.orderedQuantity - item.receivedQuantity;
                  return (
                    <tr key={item.id} className="align-middle">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{tp(item.productNameSnapshot)}</span>
                        {item.skuSnapshot && <span className="text-[9px] text-slate-400 font-bold block mt-0.5">SKU: {item.skuSnapshot}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{item.orderedQuantity}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={item.receivedQuantity === item.orderedQuantity ? 'text-emerald-600' : 'text-amber-600'}>
                          {item.receivedQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitCost)}</td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{item.taxRate}%</td>
                      <td className="px-4 py-3 text-right text-slate-900 font-extrabold">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals panel */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col items-end gap-1.5 text-slate-500">
              <div className="flex justify-between w-48">
                <span>Subtotal:</span>
                <span className="text-slate-800 font-bold">{formatCurrency(po.subtotal)}</span>
              </div>
              {po.discountAmount > 0 && (
                <div className="flex justify-between w-48 text-red-600">
                  <span>PO Discount:</span>
                  <span>-{formatCurrency(po.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-48">
                <span>GST Tax Total:</span>
                <span className="text-slate-800 font-bold">{formatCurrency(po.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-48 text-sm font-extrabold text-indigo-600 border-t border-slate-200 pt-1.5 mt-1">
                <span>Total Cost:</span>
                <span>{formatCurrency(po.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Settle status card */}
          <div className="grid grid-cols-3 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total PO Amount</span>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {formatCurrency(po.totalAmount)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Paid Amount</span>
              <div className="text-lg font-extrabold text-emerald-600 mt-1">
                {formatCurrency(po.paidAmount)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24 border-l-4 border-l-amber-500">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Outstanding Due</span>
              <div className="text-lg font-extrabold text-amber-700 mt-1">
                {formatCurrency(po.dueAmount)}
              </div>
            </div>

          </div>

          {/* Payments allocation lists */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Payments Mapped to PO</h3>
            
            {po.payments?.length === 0 ? (
              <div className="text-slate-400 italic">No payments logged against this PO yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {po.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="text-slate-400" size={16} />
                      <div>
                        <span className="font-bold text-slate-800 capitalize">{p.method}</span>
                        {p.reference && <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{p.reference}</span>}
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CANCEL MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCancelModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5"><Trash2 size={18} className="text-red-500" /> Cancel Purchase Order</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCancelPO} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  placeholder="e.g. Cancelled shipment / Cost revisions"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelProcessing}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {cancelProcessing ? 'Processing Reversals...' : 'Confirm Reversal Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5"><CreditCard size={18} /> Settle Payment against PO</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {payError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-800">PO Outstanding:</span>
              <span className="text-base font-extrabold text-indigo-700">{formatCurrency(po.dueAmount)}</span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={po.dueAmount}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none text-right font-extrabold text-slate-900"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method *</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none bg-white"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                >
                  <option value="UPI">UPI (QR/GPay)</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank NetTransfer</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="OTHER">Other Method</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Transaction / Ref ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none font-mono text-xs placeholder-slate-300"
                  placeholder="e.g. GPay Transaction ID"
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Remarks</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none placeholder-slate-400"
                  placeholder="Settle stock bill"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {payProcessing ? <Loader2 size={14} className="animate-spin" /> : null}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

