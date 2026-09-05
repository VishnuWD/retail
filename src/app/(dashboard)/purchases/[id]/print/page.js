'use client';

import { use, useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function PrintPurchasePage({ params }) {
  const resolvedParams = use(params);
  const poId = resolvedParams.id;

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPO() {
      try {
        const json = await apiClient.get(`/api/purchases/${poId}`);
        if (json.success && json.data) {
          setPo(json.data);
        } else {
          // Fallback to list search
          const allPOs = await apiClient.get('/api/purchases');
          const list = Array.isArray(allPOs.data) ? allPOs.data : (allPOs.data?.purchases || []);
          const found = list.find(p => p.id === poId || p.purchaseOrderNumber === poId) || list[0];
          if (found) {
            setPo(found);
          } else {
            throw new Error(json.error?.message || 'Failed to fetch purchase order.');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPO();
  }, [poId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-2 text-slate-500 font-semibold bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        <span>Generating PO print preview...</span>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white p-6 text-center text-red-600 font-semibold space-y-2">
        <AlertTriangle size={32} />
        <h3 className="font-bold">Failed to load purchase order</h3>
        <p className="text-xs text-slate-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          body {
            margin: 0;
            padding: 15mm;
            background: #fff;
            color: #000;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          background-color: #f1f5f9;
        }
      `}</style>

      {/* Control bar */}
      <div className="no-print fixed top-4 right-4 bg-white border border-slate-200 shadow-lg p-2.5 rounded-xl flex gap-2 z-50 text-xs font-bold">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        >
          <Printer size={14} /> Print Page
        </button>
        <button
          onClick={() => window.close()}
          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          Close Window
        </button>
      </div>

      {/* Main Printable A4 PO sheet */}
      <div className="max-w-[210mm] min-h-[297mm] bg-white mx-auto p-8 font-sans text-slate-800 shadow-sm border border-slate-100 flex flex-col justify-between">
        
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight uppercase">Green Mart</h1>
              <p className="text-xs text-slate-500 font-medium">
                12, 80 Feet Road, Koramangala<br />
                Bengaluru, Karnataka - 560034<br />
                Phone: +91 9876543210 | email: purchase@greenmart.com
              </p>
            </div>
            
            <div className="text-right space-y-1">
              <h2 className="text-lg font-bold text-slate-900 uppercase">Purchase Order</h2>
              <div className="text-xs font-semibold text-slate-500 space-y-0.5">
                <p>PO #: <span className="text-slate-900 font-bold">{po.purchaseOrderNumber}</span></p>
                <p>Date: {new Date(po.purchaseDate).toLocaleDateString()}</p>
                {po.expectedDate && <p>Expected: {new Date(po.expectedDate).toLocaleDateString()}</p>}
                <p>Status: <span className="font-bold uppercase text-slate-700">{po.status.replace('_', ' ')}</span></p>
              </div>
            </div>
          </div>

          {/* Supplier details card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold">
              <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Supplier details</h3>
              <span className="text-slate-400 block uppercase text-[9px]">Name</span>
              <span className="text-slate-800 text-sm font-bold block mt-0.5">{po.supplier.name}</span>
              {po.supplier.companyName && (
                <span className="text-slate-500 block text-xxs mt-0.5">{po.supplier.companyName}</span>
              )}
              {po.supplier.phone && (
                <span className="text-slate-500 block text-xxs mt-0.5">Phone: {po.supplier.phone}</span>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold">
              <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Shipment details</h3>
              {po.supplierInvoiceNumber && (
                <p className="mb-1">Supplier Invoice #: <span className="font-bold text-slate-800 font-mono uppercase">{po.supplierInvoiceNumber}</span></p>
              )}
              <p>Operator: <span className="font-bold text-slate-800">{po.user?.name}</span></p>
            </div>
          </div>

          {/* Items Grid */}
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Product Description</th>
                <th scope="col" className="px-4 py-3 text-right">Ordered Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Received Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Unit Cost Price</th>
                <th scope="col" className="px-4 py-3 text-right">GST Rate</th>
                <th scope="col" className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
              {po.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.productNameSnapshot}</div>
                    {item.skuSnapshot && <span className="text-[10px] text-slate-400 font-bold block mt-0.5">SKU: {item.skuSnapshot}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{item.orderedQuantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-500">{item.receivedQuantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="px-4 py-3 text-right">{item.taxRate}%</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* Bottom Totals */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            
            {/* Pay status */}
            <div className="space-y-1.5 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Progress</span>
              <p>Status: <span className="font-bold uppercase text-slate-800">{po.paymentStatus}</span></p>
              <p>Paid Amount: <span className="font-extrabold text-slate-800">{formatCurrency(po.paidAmount)}</span></p>
              <p>Outstanding Due: <span className="font-extrabold text-indigo-700">{formatCurrency(po.dueAmount)}</span></p>
            </div>

            {/* Sum */}
            <div className="w-full sm:w-64 space-y-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">{formatCurrency(po.subtotal)}</span>
              </div>
              {po.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>PO Discount</span>
                  <span>-{formatCurrency(po.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Taxes</span>
                <span className="text-slate-800 font-bold">{formatCurrency(po.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-indigo-600">
                <span>Grand Total</span>
                <span>{formatCurrency(po.totalAmount)}</span>
              </div>
            </div>

          </div>

          <div className="text-center pt-12 text-slate-400 text-[10px] font-medium border-t border-slate-50 mt-12">
            This is an official wholesale purchase record document compiled in Green Mart.
          </div>
        </div>

      </div>
    </>
  );
}
