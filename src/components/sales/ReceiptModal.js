'use client';

import { useState } from 'react';
import { Printer, FileText, Share2, X, Check, QrCode, Sparkles } from 'lucide-react';
import { printReceiptDirectly, generateReceiptHtml } from '@/lib/printer/receiptPrinter';
import { formatCurrency } from '@/lib/utils';
import { useStorage } from '@/lib/storage/StorageContext';

export default function ReceiptModal({ sale, isOpen, onClose }) {
  const { business } = useStorage();
  const [paperSize, setPaperSize] = useState('58mm');
  const [isPrinting, setIsPrinting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sale) return null;

  const bizName = sale.business?.name || business?.name || 'Green Mart Kirana & Superstore';
  const bizPhone = sale.business?.phone || business?.phone || '+91 98765 43210';
  const bizAddress = sale.business?.address || business?.address || 'Indiranagar, Bengaluru, Karnataka';
  const bizGstin = sale.business?.taxNumber || business?.taxNumber || '29ABCDE1234F1Z5';
  const bizUpi = sale.business?.upiId || business?.upiId || 'greenmart@upi';
  const receiptFooter = sale.business?.receiptFooter || business?.receiptFooter || 'Thank you for shopping with us! Visit again.';

  const invoiceNumber = sale.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
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

  const handlePrint = async () => {
    setIsPrinting(true);
    await printReceiptDirectly(sale, business, paperSize);
    setIsPrinting(false);
  };

  const handleWhatsApp = () => {
    const phone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
    const itemsText = items.map(i => `• ${i.productNameSnapshot || i.name} (x${i.quantity || 1}) - ₹${i.lineTotal || (i.unitPrice * (i.quantity || 1))}`).join('%0A');
    const msg = `*${bizName} - Invoice #${invoiceNumber}*%0A%0A*Items:*%0A${itemsText}%0A%0A*Total Amount:* ₹${totalAmount}%0A*Status:* Completed%0A%0A${receiptFooter}`;
    
    const url = phone 
      ? `https://wa.me/91${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const openA4Page = () => {
    const targetId = sale.id || sale.invoiceNumber;
    window.open(`/print/${targetId}?type=a4`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Receipt Preview</h3>
            <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              #{invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 58mm / 80mm Switcher */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  paperSize === '58mm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  paperSize === '80mm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Paper Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div 
            className={`bg-white shadow-md border border-slate-300 p-4 font-mono text-black leading-tight select-none ${
              paperSize === '58mm' ? 'w-[58mm] text-[11px]' : 'w-[80mm] text-xs'
            }`}
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5">
              <div className="font-black uppercase tracking-tight text-sm">{bizName}</div>
              <div className="text-[10px] text-slate-600 leading-tight">{bizAddress}</div>
              <div className="text-[10px] font-bold">Phone: {bizPhone}</div>
              {bizGstin && <div className="text-[9px]">GSTIN: {bizGstin}</div>}
            </div>

            <div className="border-t border-dashed border-black pt-1.5 mt-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Bill: #{invoiceNumber}</span>
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

            {/* Items Header */}
            <div className="border-t border-dashed border-black pt-1.5 mt-1">
              <div className="flex justify-between border-b border-dashed border-black pb-1 font-bold text-[10px]">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/4 text-center">QTY</span>
                <span className="w-1/4 text-right">AMT</span>
              </div>
              
              <div className="divide-y divide-dashed divide-slate-200 pt-1 text-[10px]">
                {items.map((item, idx) => {
                  const name = item.productNameSnapshot || item.name || 'Item';
                  const qty = item.quantity || 1;
                  const price = Number(item.unitPrice || 0);
                  const tot = Number(item.lineTotal || (price * qty));
                  return (
                    <div key={item.id || idx} className="py-1">
                      <div className="font-bold text-slate-950 truncate">{name}</div>
                      <div className="flex justify-between text-slate-600 text-[9px] mt-0.5">
                        <span className="w-1/2">@{price.toFixed(2)}</span>
                        <span className="w-1/4 text-center font-bold">{qty}</span>
                        <span className="w-1/4 text-right font-bold text-slate-900">₹{tot.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-black pt-1.5 mt-1 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax:</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm border-t border-b border-dashed border-black py-1 my-1">
                <span>TOTAL:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="space-y-0.5 text-[9px] pt-1">
              <div className="flex justify-between font-bold">
                <span>Paid ({payments.map(p => p.method).join(', ')}):</span>
                <span>₹{paidAmount.toFixed(2)}</span>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between font-bold text-red-600">
                  <span>Udhaar Balance:</span>
                  <span>₹{dueAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="border-t border-dashed border-black pt-2 mt-2 text-center flex flex-col items-center justify-center space-y-1">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=upi://pay?pa=${bizUpi}%26pn=${encodeURIComponent(bizName)}%26am=${totalAmount}%26cu=INR`} 
                alt="UPI QR Code"
                className="h-16 w-16 object-contain mx-auto"
              />
              <div className="text-[8px] font-bold text-slate-600">Scan & Pay with any UPI App</div>
            </div>

            {/* Footer */}
            <div className="border-t border-dashed border-black pt-2 mt-2 text-center text-[9px] leading-tight font-semibold">
              {receiptFooter}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Share2 size={14} className="text-emerald-600" /> WhatsApp
            </button>
            <button
              onClick={openA4Page}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <FileText size={14} className="text-indigo-600" /> A4 Tax Invoice
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer size={15} />
            <span>{isPrinting ? 'Printing...' : `Print Receipt (${paperSize})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
