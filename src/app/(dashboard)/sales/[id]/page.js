'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Trash2, 
  RefreshCw, 
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
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';
import { useStorage } from '@/lib/storage/StorageContext';
import { printReceiptDirectly } from '@/lib/printer/receiptPrinter';
import ReceiptModal from '@/components/sales/ReceiptModal';

export default function SaleDetailPage({ params }) {
  const { t, tp, tc, tu, tb, ts } = useLanguage();
  const { business } = useStorage();
  const resolvedParams = use(params);
  const saleId = resolvedParams?.id || 'latest';
  const router = useRouter();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isPrintingDirect, setIsPrintingDirect] = useState(false);
  
  // Logged-in cashier role parameters
  const [userRole, setUserRole] = useState('CASHIER');

  // Modal actions
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelProcessing, setCancelProcessing] = useState(false);

  // Return processing Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnItems, setReturnItems] = useState([]); // Array of { saleItemId, quantity }
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [returnNote, setReturnNote] = useState('');
  const [returnProcessing, setReturnProcessing] = useState(false);
  const [returnErr, setReturnErr] = useState(null);

  // Fetch sale detail details
  const fetchSaleDetails = async () => {
    setLoading(true);
    try {
      const json = await apiClient.get(`/api/sales/${saleId}`);
      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'Failed to fetch invoice details.');
      }
      setSale(json.data);
      
      const saleReturns = json.data.returns || [];
      // Initialize return items quantities as 0
      setReturnItems((json.data.items || []).map(i => ({
        saleItemId: i.id,
        productId: i.productId,
        name: i.productNameSnapshot || i.name,
        maxQty: i.quantity - (saleReturns.reduce((sum, r) => {
          const retItem = (r.items || []).find(ri => ri.saleItemId === i.id);
          return sum + (retItem ? retItem.quantity : 0);
        }, 0)),
        quantity: 0
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read user role from session API or direct cookie
    const getSessionRole = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        // Since dashboard route reads and parses token in headers, we can fetch active user settings.
        // For simplicity, dashboard response doesn't return role directly. Let's make an API call or parse client cookie.
        // We can check if cashier block restrictions trigger correctly in frontend.
      } catch (e) {}
    };
    
    // Fallback: decode role from user cookies or let api reject it.
    // Let's decode or simply read and display role based on API status limits.
    // We fetch userRole headers dynamically or let server enforce it. Let's set standard verification.
    fetchSaleDetails();
  }, [saleId]);

  const handleCancelSale = async (e) => {
    e.preventDefault();
    setCancelProcessing(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to cancel sale.');
      }
      setCancelModalOpen(false);
      setCancelReason('');
      fetchSaleDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelProcessing(false);
    }
  };

  const handleReturnSale = async (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems.filter(i => i.quantity > 0);
    if (itemsToReturn.length === 0) {
      setReturnErr('Select at least one item and quantity to return.');
      return;
    }

    setReturnProcessing(true);
    setReturnErr(null);
    try {
      const res = await fetch(`/api/sales/${saleId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundMethod,
          note: returnNote,
          items: itemsToReturn.map(i => ({
            saleItemId: i.saleItemId,
            quantity: i.quantity
          }))
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to process return.');
      }
      setReturnModalOpen(false);
      setReturnNote('');
      fetchSaleDetails();
    } catch (err) {
      setReturnErr(err.message);
    } finally {
      setReturnProcessing(false);
    }
  };

  const updateReturnQty = (saleItemId, val) => {
    setReturnItems(returnItems.map(i => 
      i.saleItemId === saleItemId 
        ? { ...i, quantity: Math.min(i.maxQty, Math.max(0, parseInt(val) || 0)) }
        : i
    ));
  };

  const handleDirectPrint = async () => {
    setIsPrintingDirect(true);
    await printReceiptDirectly(sale, business);
    setIsPrintingDirect(false);
  };

  const printReceipt = () => {
    setReceiptModalOpen(true);
  };

  const printA4 = () => {
    window.open(`/print/${saleId}?type=a4`, '_blank', 'width=800,height=900');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 bg-slate-50 h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold">Retrieving sale invoice details...</span>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-md mx-auto mt-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <h3 className="font-bold text-lg">Invoice Not Found</h3>
        <p className="text-sm mt-1">{error}</p>
        <Link href="/sales" className="mt-4 inline-block px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm">
          Back to Sales Logs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Back button and Header controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Sale invoice log</span>
            <h2 className="text-xl font-extrabold text-slate-900">{sale.invoiceNumber}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          {sale.status !== 'CANCELLED' && (
            <>
              <button
                onClick={() => setReturnModalOpen(true)}
                disabled={sale.status === 'RETURNED'}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
              >
                <RotateCcw size={16} /> Process Return
              </button>
              <button
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold shadow-sm"
              >
                <Trash2 size={16} /> Cancel Sale
              </button>
            </>
          )}
          <button
            onClick={handleDirectPrint}
            disabled={isPrintingDirect}
            className="flex items-center gap-1 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
          >
            <Printer size={16} /> {isPrintingDirect ? 'Printing...' : 'Direct Print'}
          </button>
          <button
            onClick={() => setReceiptModalOpen(true)}
            className="flex items-center gap-1 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold shadow-sm"
          >
            <Eye size={16} /> Receipt Slip
          </button>
          <button
            onClick={printA4}
            className="flex items-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <FileText size={16} /> A4 / PDF
          </button>
        </div>
      </div>

      {/* Grid containing details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Sale Metadata</h3>
          
          <div className="space-y-3 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <div>
                <span className="text-xxs font-bold text-slate-400 block uppercase">Created At</span>
                <span className="text-slate-700">{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <div>
                <span className="text-xxs font-bold text-slate-400 block uppercase">Cashier Operator</span>
                <span className="text-slate-700">{sale.user?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-slate-400" />
              <div>
                <span className="text-xxs font-bold text-slate-400 block uppercase">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase mt-1 ${
                  sale.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {sale.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Customer billed */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block mb-2">Customer Profile</span>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-800">
              {sale.customer ? (
                <div>
                  <span className="block font-extrabold text-sm">{sale.customer.name}</span>
                  {sale.customer.phone && <span className="block font-mono text-slate-400 mt-1">Phone: {sale.customer.phone}</span>}
                  <span className="block text-slate-500 font-bold mt-2">
                    Udhaar Outstanding: {formatCurrency(sale.customer.outstandingCredit)}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Walk-in Customer</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Settle split payments, Inventory impact, list items */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Invoice Items table snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs font-semibold">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Snapshot Product Items
            </div>
            
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Product Name</th>
                  <th scope="col" className="px-4 py-3">SKU / Barcode</th>
                  <th scope="col" className="px-4 py-3 text-right">Price</th>
                  <th scope="col" className="px-4 py-3 text-right">Qty</th>
                  <th scope="col" className="px-4 py-3 text-right">Discount</th>
                  <th scope="col" className="px-4 py-3 text-right">Tax Class</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                {sale.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{tp(item.productNameSnapshot)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">
                      {item.skuSnapshot || '—'}<br />
                      {item.barcodeSnapshot || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">{item.taxRate}% GST</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-extrabold">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals panel */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col items-end gap-1.5 text-slate-500">
              <div className="flex justify-between w-48">
                <span>Subtotal:</span>
                <span className="text-slate-800 font-bold">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between w-48 text-red-600">
                  <span>Cart Discount:</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-48">
                <span>GST Tax:</span>
                <span className="text-slate-800 font-bold">{formatCurrency(sale.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-48 text-sm font-extrabold text-indigo-600 border-t border-slate-200 pt-1.5 mt-1">
                <span>Total Amount:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Split Payments list */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Settlement Split History</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sale.payments.map((p, idx) => (
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
          </div>

          {/* Inventory Impact ledger list */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Inventory Ledger Impact</h3>
            
            <div className="divide-y divide-slate-100">
              {sale.inventoryImpacts && sale.inventoryImpacts.length > 0 ? (
                sale.inventoryImpacts.map((impact, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <span className="font-bold text-slate-800">{impact.productName}</span>
                    <span className="font-extrabold text-red-600">{impact.quantity} {impact.unit}s</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 italic">No inventory impacts logged (Cancelled sale)</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* CANCEL MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCancelModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5"><Trash2 size={18} className="text-red-500" /> Cancel Invoice</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCancelSale} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  placeholder="e.g. Accidental Checkout / Customer Return"
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
                  {cancelProcessing ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS RETURN MODAL */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setReturnModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-150 z-50 flex flex-col max-h-[90vh] text-sm font-semibold">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5"><RotateCcw size={18} /> Process Item Returns</h3>
              <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSale} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {returnErr && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{returnErr}</span>
                </div>
              )}

              {/* Items Return configuration */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Quantities to Refund</label>
                
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div key={item.saleItemId} className="border border-slate-100 p-3 rounded-lg bg-slate-50 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-xxs text-slate-400 block mt-0.5">Max Returnable: {item.maxQty} units</span>
                      </div>
                      
                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          className="w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-bold text-right"
                          min="0"
                          max={item.maxQty}
                          value={item.quantity}
                          onChange={e => updateReturnQty(item.saleItemId, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Method selector */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Refund Method *</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value)}
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="UPI">UPI Refund</option>
                    <option value="CARD">Card Settle</option>
                    <option value="CREDIT">Store Credit Reversal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Return Notes</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none"
                    placeholder="Reason for return..."
                    value={returnNote}
                    onChange={e => setReturnNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {returnProcessing ? <Loader2 size={14} className="animate-spin" /> : null}
                  Submit Refund Return
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* THERMAL & TAX INVOICE RECEIPT MODAL */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        sale={sale}
      />

    </div>
  );
}
