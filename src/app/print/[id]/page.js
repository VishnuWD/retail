'use client';

import { use, useState, useEffect } from 'react';
import { Loader2, AlertCircle, Printer, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function StandalonePrintInvoicePage({ params }) {
  const resolvedParams = use(params);
  const saleId = resolvedParams?.id || 'latest';
  
  const [sale, setSale] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paperSize, setPaperSize] = useState('58mm'); // '58mm' | '80mm' | 'a4'

  useEffect(() => {
    // Read query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const size = urlParams.get('size');
    
    if (type === 'a4') {
      setPaperSize('a4');
    } else if (size === '80mm' || type === '80mm') {
      setPaperSize('80mm');
    } else if (size === '58mm' || type === 'thermal') {
      setPaperSize('58mm');
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch store settings
        const settingsRes = await apiClient.get('/api/settings');
        const bizData = settingsRes.data?.business || settingsRes.data || {};
        setBusiness(bizData);

        const configuredPaper = bizData?.capabilities?.printPaperSize || '58mm';
        if (!type && !size) {
          setPaperSize(configuredPaper === '80mm' ? '80mm' : '58mm');
        }

        // 2. Fetch sale invoice details
        let targetId = saleId;
        if (targetId === 'latest') {
          const salesListRes = await apiClient.get('/api/sales?limit=1');
          const latestSale = salesListRes.data?.sales?.[0] || salesListRes.data?.[0];
          if (latestSale) {
            targetId = latestSale.id || latestSale.invoiceNumber;
          }
        }

        const saleRes = await apiClient.get(`/api/sales/${targetId}`);
        if (saleRes.success && saleRes.data) {
          setSale(saleRes.data);
        } else {
          // Fallback query from sales list
          const allSalesRes = await apiClient.get('/api/sales');
          const list = allSalesRes.data?.sales || allSalesRes.data || [];
          const found = list.find(s => s.id === targetId || s.invoiceNumber === targetId) || list[0];
          if (found) {
            setSale(found);
          } else {
            throw new Error(saleRes.error?.message || 'Invoice record not found.');
          }
        }
      } catch (err) {
        console.error('Receipt print load error:', err);
        setError(err.message || 'Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [saleId]);

  // Auto trigger browser print once loaded if requested
  useEffect(() => {
    if (!loading && sale) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autoprint') === 'true') {
        const timer = setTimeout(() => {
          window.print();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, sale]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-3 text-slate-500 font-semibold bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
        <span className="text-xs font-bold text-slate-600">Generating receipt preview...</span>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white p-6 text-center text-red-600 font-semibold space-y-3">
        <AlertCircle size={36} className="text-red-500" />
        <h3 className="font-bold text-base">Unable to generate receipt</h3>
        <p className="text-xs text-slate-400 font-medium">{error || 'Invoice record not available'}</p>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Close Window
        </button>
      </div>
    );
  }

  const bizName = sale.business?.name || business?.name || 'Green Mart Kirana & Superstore';
  const bizPhone = sale.business?.phone || business?.phone || '+91 98765 43210';
  const bizAddress = sale.business?.address || business?.address || 'Indiranagar, Bengaluru, Karnataka';
  const bizGstin = sale.business?.taxNumber || business?.taxNumber || '29ABCDE1234F1Z5';
  const bizUpi = sale.business?.upiId || business?.upiId || 'greenmart@upi';
  const receiptFooter = sale.business?.receiptFooter || business?.receiptFooter || 'Thank you for shopping with us! Visit again.';

  const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const customerName = sale.customer?.name || sale.customerName || 'Walk-in Customer';
  const customerPhone = sale.customer?.phone || '';
  const cashierName = sale.user?.name || sale.createdBy || 'Store Operator';

  const items = sale.items || [];
  const subtotal = Number(sale.subtotal || sale.totalAmount || 0);
  const discountAmount = Number(sale.discountAmount || 0);
  const taxAmount = Number(sale.taxAmount || 0);
  const totalAmount = Number(sale.totalAmount || subtotal);
  const paidAmount = Number(sale.paidAmount !== undefined ? sale.paidAmount : totalAmount);
  const dueAmount = Number(sale.dueAmount || 0);

  const payments = (sale.payments && sale.payments.length > 0)
    ? sale.payments
    : [{ method: sale.paymentMethod || 'CASH', amount: paidAmount }];

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 flex flex-col items-center">
      {/* Precision Print Styling for 58mm, 80mm POS Thermal & A4 */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0 !important;
            size: ${paperSize === '58mm' ? '58mm auto' : paperSize === '80mm' ? '80mm auto' : 'A4'} !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, [data-no-print] {
            display: none !important;
            visibility: hidden !important;
          }
          .receipt-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: ${paperSize === '58mm' ? '2mm 3mm' : paperSize === '80mm' ? '3mm 4mm' : '10mm'} !important;
            width: ${paperSize === '58mm' ? '58mm' : paperSize === '80mm' ? '80mm' : '100%'} !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Floating Toolbar (Hidden during print) */}
      <div className="no-print sticky top-3 max-w-lg w-full bg-white/95 backdrop-blur border border-slate-200 shadow-xl p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 z-50 text-xs font-bold mb-6" data-no-print>
        {/* Paper Size Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setPaperSize('58mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              paperSize === '58mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            58mm POS
          </button>
          <button
            type="button"
            onClick={() => setPaperSize('80mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              paperSize === '80mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            80mm Thermal
          </button>
          <button
            type="button"
            onClick={() => setPaperSize('a4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              paperSize === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A4 Invoice
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 cursor-pointer transition-all"
          >
            <Printer size={14} /> Print Now
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. 58mm STANDARD POS THERMAL RECEIPT                                      */}
      {/* ========================================================================= */}
      {paperSize === '58mm' && (
        <div className="receipt-container w-[58mm] max-w-[58mm] bg-white mx-auto p-3 font-mono text-black text-[11px] leading-tight space-y-2 shadow-xl border border-slate-300 rounded-lg select-none">
          {/* Store Header */}
          <div className="text-center space-y-0.5">
            <div className="text-sm font-black uppercase tracking-tight">{bizName}</div>
            <div className="text-[10px] text-slate-700 leading-tight">{bizAddress}</div>
            <div className="text-[10px] font-bold">Ph: {bizPhone}</div>
            {bizGstin && <div className="text-[9px] font-semibold">GSTIN: {bizGstin}</div>}
          </div>

          <div className="border-t border-dashed border-black pt-1.5 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Bill: #{sale.invoiceNumber}</span>
              <span>{saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Op: {cashierName}</span>
              <span>{saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between font-bold truncate">
              <span>Cust: {customerName}</span>
              {customerPhone && <span>{customerPhone}</span>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-dashed border-black pt-1.5">
            <div className="flex justify-between border-b border-dashed border-black pb-1 font-extrabold text-[10px]">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/4 text-center">QTY</span>
              <span className="w-1/4 text-right">AMT</span>
            </div>
            <div className="divide-y divide-dashed divide-slate-200 text-[10px] pt-1">
              {items.map((item, idx) => {
                const name = item.productNameSnapshot || item.name || 'Item';
                const qty = item.quantity || 1;
                const price = item.unitPrice || 0;
                const total = item.lineTotal || (price * qty);
                return (
                  <div key={item.id || idx} className="py-1">
                    <div className="font-bold text-slate-950 truncate">{name}</div>
                    <div className="flex justify-between text-slate-700 text-[9px] mt-0.5">
                      <span className="w-1/2 text-slate-500">@{price.toFixed(2)}</span>
                      <span className="w-1/4 text-center font-bold">{qty}</span>
                      <span className="w-1/4 text-right font-extrabold text-slate-900">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals & Tax */}
          <div className="border-t border-dashed border-black pt-1.5 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Discount:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Tax (GST):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm border-t border-b border-dashed border-black py-1">
              <span>NET TOTAL:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="space-y-0.5 text-[9px] pt-0.5">
            <div className="flex justify-between font-bold">
              <span>Paid ({payments.map(p => p.method).join(', ')}):</span>
              <span>₹{paidAmount.toFixed(2)}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between font-extrabold text-red-700">
                <span>Udhaar Balance:</span>
                <span>₹{dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* QR Code for Instant UPI Payment Verification */}
          <div className="border-t border-dashed border-black pt-2 text-center flex flex-col items-center justify-center space-y-1">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=upi://pay?pa=${bizUpi}%26pn=${encodeURIComponent(bizName)}%26am=${totalAmount}%26cu=INR`} 
              alt="UPI QR Code"
              className="h-16 w-16 object-contain mx-auto"
            />
            <div className="text-[8px] font-bold text-slate-600">Scan to pay / verify receipt</div>
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-dashed border-black pt-2 text-center text-[9px] leading-tight font-semibold">
            {receiptFooter}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 80mm WIDE DESKTOP THERMAL RECEIPT                                      */}
      {/* ========================================================================= */}
      {paperSize === '80mm' && (
        <div className="receipt-container w-[80mm] max-w-[80mm] bg-white mx-auto p-4 font-mono text-black text-xs leading-normal space-y-3 shadow-xl border border-slate-300 rounded-lg select-none">
          {/* Store Branding */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-black uppercase tracking-tight">{bizName}</h2>
            <p className="text-[11px] text-slate-700 leading-tight">
              {bizAddress}<br />
              Phone: {bizPhone}
            </p>
            {bizGstin && <p className="text-[10px] font-bold">GSTIN: {bizGstin}</p>}
          </div>

          {/* Invoice Metadata */}
          <div className="border-t border-dashed border-black pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-bold">Invoice: #{sale.invoiceNumber}</span>
              <span>{saleDate.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>Cashier: {cashierName}</span>
              <span>{saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Customer: {customerName}</span>
              {customerPhone && <span>{customerPhone}</span>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-dashed border-black pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dashed border-black font-extrabold text-[11px]">
                  <th className="pb-1.5 w-1/2">Item Description</th>
                  <th className="pb-1.5 text-center w-1/6">Qty</th>
                  <th className="pb-1.5 text-right w-1/6">Rate</th>
                  <th className="pb-1.5 text-right w-1/6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {items.map((item, idx) => {
                  const name = item.productNameSnapshot || item.name || 'Item';
                  const qty = item.quantity || 1;
                  const price = item.unitPrice || 0;
                  const total = item.lineTotal || (price * qty);
                  return (
                    <tr key={item.id || idx} className="align-top text-xs">
                      <td className="py-1.5 pr-1">
                        <div className="font-bold text-slate-950 line-clamp-2">{name}</div>
                        {item.discountAmount > 0 && (
                          <div className="text-[10px] text-slate-600">Disc: -₹{item.discountAmount.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="py-1.5 text-center font-bold">{qty}</td>
                      <td className="py-1.5 text-right text-slate-700">₹{price.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-extrabold text-slate-950">₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotal and Tax Breakdown */}
          <div className="border-t border-dashed border-black pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal Amount:</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Special Bill Discount:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Output GST (CGST + SGST):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-b border-dashed border-black py-2 mt-1">
              <span>TOTAL PAYABLE:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment details */}
          <div className="border-t border-dashed border-black pt-2 space-y-1 text-xs">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Payment Mode:</span>
              <span>{payments.map(p => `${p.method} (₹${p.amount.toFixed(0)})`).join(', ')}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-red-700 font-extrabold">
                <span>Credit Outstanding:</span>
                <span>₹{dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="border-t border-dashed border-black pt-3 text-center space-y-1 flex flex-col items-center justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=upi://pay?pa=${bizUpi}%26pn=${encodeURIComponent(bizName)}%26am=${totalAmount}%26cu=INR`} 
              alt="UPI QR Code"
              className="h-20 w-20 object-contain mx-auto"
            />
            <span className="text-[10px] font-bold text-slate-600">Scan to pay with any UPI App</span>
          </div>

          {/* Footer note */}
          <div className="border-t border-dashed border-black pt-3 text-center text-xs leading-relaxed font-bold">
            {receiptFooter}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PROFESSIONAL FULL A4 RETAIL TAX INVOICE                                */}
      {/* ========================================================================= */}
      {paperSize === 'a4' && (
        <div className="receipt-container max-w-[210mm] min-h-[297mm] bg-white mx-auto p-10 font-sans text-slate-800 shadow-2xl border border-slate-300 rounded-xl my-4 flex flex-col justify-between select-none">
          <div className="space-y-6">
            {/* Top Business Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-indigo-700 uppercase tracking-tight">{bizName}</h1>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm">
                  {bizAddress}<br />
                  Phone: {bizPhone} • UPI: {bizUpi}
                </p>
                {bizGstin && <p className="text-xs font-bold text-slate-800">GSTIN: {bizGstin}</p>}
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs uppercase tracking-wider rounded-lg border border-indigo-100">
                  Tax Invoice
                </span>
                <div className="text-xs font-semibold text-slate-600 space-y-0.5 pt-1">
                  <p>Invoice No: <span className="font-bold text-slate-900">{sale.invoiceNumber}</span></p>
                  <p>Date: {saleDate.toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                  <p>Time: {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Cashier: {cashierName}</p>
                </div>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To (Customer)</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">{customerName}</span>
                  {customerPhone && <span className="text-slate-600 block mt-0.5 font-mono">{customerPhone}</span>}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Payment Status: </span>
                  <span className="font-bold text-emerald-600 uppercase">{sale.paymentStatus || 'PAID'}</span>
                </div>
              </div>
            </div>

            {/* Table of Items */}
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
              <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">#</th>
                  <th scope="col" className="px-4 py-3">Item Description</th>
                  <th scope="col" className="px-4 py-3 text-center">Qty</th>
                  <th scope="col" className="px-4 py-3 text-right">Rate</th>
                  <th scope="col" className="px-4 py-3 text-right">Discount</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-slate-800">
                {items.map((item, idx) => {
                  const name = item.productNameSnapshot || item.name || 'Item';
                  const qty = item.quantity || 1;
                  const price = item.unitPrice || 0;
                  const discount = item.discountAmount || 0;
                  const total = item.lineTotal || (price * qty);
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{name}</div>
                        {item.skuSnapshot && <div className="text-[10px] text-slate-400 font-mono">{item.skuSnapshot}</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{qty}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(price)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{discount > 0 ? `-${formatCurrency(discount)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals and Terms */}
          <div className="pt-8 border-t border-slate-200 mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Settlement</span>
                <div className="space-y-1">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 font-bold">{p.method}:</span>
                      <span className="text-slate-900 font-extrabold">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  {dueAmount > 0 && (
                    <div className="flex gap-2 text-red-600 font-bold">
                      <span>Udhaar Due:</span>
                      <span>{formatCurrency(dueAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST (CGST + SGST):</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-black text-indigo-700">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-8 text-slate-400 text-[11px] border-t border-slate-100 font-medium">
              {receiptFooter}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
