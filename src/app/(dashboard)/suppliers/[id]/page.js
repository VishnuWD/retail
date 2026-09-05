'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  FileText,
  DollarSign, 
  Plus, 
  CreditCard,
  History,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function SupplierDetailPage({ params }) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.id;
  const router = useRouter();

  const [supplier, setSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [error, setError] = useState(null);

  // Record Payment Modal Form State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  // Toggle Supplier Status
  const [toggleProcessing, setToggleProcessing] = useState(false);

  // Fetch supplier details
  const fetchSupplierDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      const json = await res.json();
      if (res.ok) {
        setSupplier(json.data);
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve supplier profile.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier ledger logs
  const fetchSupplierLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/ledger?limit=100`);
      const json = await res.json();
      if (res.ok) {
        setLedger(json.data.ledger);
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
    fetchSupplierLedger();
  }, [supplierId]);

  // Submit payment record
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    setPayProcessing(true);
    setPayError(null);

    const payload = {
      supplierId,
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
        setPayAmount('');
        setPayReference('');
        setPayNote('');
        
        // Refresh details & ledger logs
        fetchSupplierDetails();
        fetchSupplierLedger();
      } else {
        throw new Error(json.error?.message || 'Failed to log supplier payment.');
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayProcessing(false);
    }
  };

  // Toggle supplier Active/Inactive status
  const handleToggleStatus = async () => {
    if (!supplier) return;
    setToggleProcessing(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !supplier.isActive })
      });
      if (res.ok) {
        fetchSupplierDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggleProcessing(false);
    }
  };

  // Delete Supplier profile
  const handleDeleteSupplier = async () => {
    if (!confirm('Are you sure you want to delete this supplier profile? If history exists, it will automatically toggle active state off instead of deleting.')) {
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        router.push('/suppliers');
      } else {
        alert(json.error?.message || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 bg-slate-50 h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold">Retrieving supplier directory details...</span>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-md mx-auto mt-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <h3 className="font-bold text-lg">Supplier Profile Not Found</h3>
        <p className="text-sm mt-1">{error}</p>
        <Link href="/suppliers" className="mt-4 inline-block px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm">
          Back to Suppliers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Navigation Back Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/suppliers" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Supplier Account Profile</span>
            <h2 className="text-xl font-extrabold text-slate-900">{supplier.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={toggleProcessing}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold shadow-sm ${
              supplier.isActive 
                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100'
            }`}
          >
            {supplier.isActive ? 'Mark Inactive' : 'Activate Profile'}
          </button>
          <button
            onClick={handleDeleteSupplier}
            className="p-2 border border-red-200 text-red-500 bg-white hover:bg-red-50 rounded-lg shadow-sm"
            title="Delete supplier"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <DollarSign size={16} /> Record Payment (Settle)
          </button>
        </div>
      </div>

      {/* Overview Panels and Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Supplier contact Details overview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Supplier Card</h3>
          
          <div className="space-y-3 text-slate-700">
            {supplier.companyName && (
              <div className="flex items-start gap-2">
                <Briefcase size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Company</span>
                  <span className="text-slate-800 font-bold">{supplier.companyName}</span>
                </div>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Phone</span>
                  <span className="text-slate-800 font-bold font-mono">{supplier.phone}</span>
                </div>
              </div>
            )}

            {supplier.email && (
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Email</span>
                  <span className="text-slate-800 font-medium">{supplier.email}</span>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Address</span>
                  <span className="text-slate-800">{supplier.address}</span>
                </div>
              </div>
            )}

            {supplier.taxNumber && (
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tax / GSTIN</span>
                  <span className="text-slate-800 font-mono font-bold uppercase">{supplier.taxNumber}</span>
                </div>
              </div>
            )}
          </div>

          {supplier.notes && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Internal Notes</span>
              <p className="text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg font-medium leading-relaxed">
                {supplier.notes}
              </p>
            </div>
          )}
        </div>

        {/* Financial outstanding cards */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Purchases</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(supplier.summary.totalPurchases)}
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">Value of all shipments logged</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Paid</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(supplier.summary.paid)}
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">Settle payments recorded</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28 border-b-4 border-b-indigo-600">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Outstanding Due</span>
            <div className="text-xl font-extrabold text-indigo-700 mt-1">
              {formatCurrency(supplier.summary.outstanding)}
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">We owe this supplier</span>
          </div>

        </div>

      </div>

      {/* Main Tabs: Supplier Ledger Logs vs Supplied Catalog Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Supplied Catalog Products */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[32rem]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm flex items-center gap-1.5 shrink-0">
            <Package size={16} /> Supplied Products ({supplier.summary.productsCount})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-4 text-xs font-semibold">
            {supplier.suppliedProducts?.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 py-10">
                <span>No products linked to supplier</span>
              </div>
            ) : (
              supplier.suppliedProducts.map(p => (
                <div key={p.id} className="py-3 flex justify-between items-center gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{p.name}</span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-0.5">SKU: {p.sku} | Brand: {p.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-medium">Last Cost: {formatCurrency(p.lastCost)}</span>
                    <span className="font-extrabold text-indigo-700 block mt-0.5">Stock: {p.stock} units</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Columns: Supplier Double-entry Ledger Logs */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[32rem]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm flex justify-between items-center shrink-0">
            <span className="flex items-center gap-1.5"><History size={16} /> Supplier Ledger History</span>
            <button 
              onClick={fetchSupplierLedger}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-bold"
            >
              Refresh Logs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingLedger ? (
              <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="animate-spin text-indigo-600" size={16} /> Loading ledger...
              </div>
            ) : ledger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic text-xs">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-2">Date</th>
                    <th scope="col" className="px-4 py-2">Description</th>
                    <th scope="col" className="px-4 py-2 text-right">Credit (+)</th>
                    <th scope="col" className="px-4 py-2 text-right">Debit (-)</th>
                    <th scope="col" className="px-4 py-2 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50 text-slate-700">
                  {ledger.map((log) => {
                    const isCredit = log.type === 'CREDIT' || log.type === 'CHARGE';
                    const displayAmt = Math.abs(log.amount);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-800 block text-xs">{log.note}</span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5 block uppercase tracking-wide">
                            Ref: {log.referenceType} ({log.user?.name})
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-600">
                          {isCredit ? `+${formatCurrency(displayAmt)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                          {!isCredit ? `-${formatCurrency(displayAmt)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 bg-slate-50">
                          {formatCurrency(log.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* RECORD PAYMENT SETTLEMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5"><CreditCard size={18} /> Record Supplier Payment</h3>
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
              <span className="font-bold text-indigo-800">We currently owe:</span>
              <span className="text-base font-extrabold text-indigo-700">{formatCurrency(supplier.summary.outstanding)}</span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-right font-extrabold"
                  placeholder="₹ Amount to pay"
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
                  <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="OTHER">Other Method</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Transaction / Ref ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none font-mono text-xs placeholder-slate-300"
                  placeholder="e.g. UPI Ref Number"
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Internal Notes</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none placeholder-slate-400"
                  placeholder="e.g. Cleared stock bills for August"
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
                  Submit Settle Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
