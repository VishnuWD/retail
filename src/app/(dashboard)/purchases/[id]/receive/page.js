'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Truck,
  Package,
  Layers,
  Calendar,
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function ReceiveStockPage({ params }) {
  const resolvedParams = use(params);
  const poId = resolvedParams.id;
  const router = useRouter();

  const [po, setPo] = useState(null);
  const [itemsToReceive, setItemsToReceive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    async function fetchPO() {
      try {
        const res = await fetch(`/api/purchases/${poId}`);
        const json = await res.json();
        if (res.ok) {
          setPo(json.data);
          
          // Map items to receive form fields
          setItemsToReceive(json.data.items.map(item => {
            const remaining = item.orderedQuantity - item.receivedQuantity;
            return {
              purchaseOrderItemId: item.id,
              name: item.productNameSnapshot,
              sku: item.skuSnapshot || '—',
              ordered: item.orderedQuantity,
              previouslyReceived: item.receivedQuantity,
              remaining,
              receiveNow: remaining // default to full remaining
            };
          }));
        } else {
          throw new Error(json.error?.message || 'Failed to fetch purchase order details.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPO();
  }, [poId]);

  const handleUpdateReceiveQty = (itemId, val) => {
    setItemsToReceive(itemsToReceive.map(item => {
      if (item.purchaseOrderItemId === itemId) {
        const numeric = parseInt(val) || 0;
        return {
          ...item,
          receiveNow: Math.min(item.remaining, Math.max(0, numeric))
        };
      }
      return item;
    }));
  };

  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    const activeIntakes = itemsToReceive.filter(i => i.receiveNow > 0);
    if (activeIntakes.length === 0) {
      setSubmitError('Enter a receive quantity greater than 0 for at least one item.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      items: activeIntakes.map(i => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        receiveNow: i.receiveNow
      }))
    };

    try {
      const res = await fetch(`/api/purchases/${poId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok) {
        router.push(`/purchases/${poId}`);
      } else {
        throw new Error(json.error?.message || 'Failed to submit stock intake.');
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 bg-slate-50 h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold">Loading stock receiver panel...</span>
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

  return (
    <div className="space-y-6">
      
      {/* Top back header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/purchases/${poId}`} className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Stock receiving workflow</span>
            <h2 className="text-xl font-extrabold text-slate-900">Check-In Products for PO #{po.purchaseOrderNumber}</h2>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 p-3.5 border border-red-200 text-xs font-semibold text-red-600 flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmitIntake} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs font-semibold">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Truck size={16} /> Enter Received Shipment Quantities
        </div>

        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">Product Name</th>
              <th scope="col" className="px-6 py-3">SKU</th>
              <th scope="col" className="px-6 py-3 text-right">Ordered</th>
              <th scope="col" className="px-6 py-3 text-right">Previously Received</th>
              <th scope="col" className="px-6 py-3 text-right w-28">Receive Now</th>
              <th scope="col" className="px-6 py-3 text-right">Remaining Order</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
            {itemsToReceive.map((item) => {
              const diff = item.remaining - item.receiveNow;
              return (
                <tr key={item.purchaseOrderItemId} className="hover:bg-slate-50 align-middle">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{item.sku}</td>
                  <td className="px-6 py-4 text-right font-bold">{item.ordered}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-500">{item.previouslyReceived}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1 text-right text-xs font-extrabold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      max={item.remaining}
                      value={item.receiveNow}
                      onChange={e => handleUpdateReceiveQty(item.purchaseOrderItemId, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-indigo-600 bg-slate-50">
                    {diff} units
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Submit Actions */}
        <div className="flex justify-end gap-2 p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <Link
            href={`/purchases/${poId}`}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-bold flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirm Stock Intake
          </button>
        </div>
      </form>

    </div>
  );
}
