// Client-Side Canvas Receipt Image Generator
// Generates crisp, high-resolution PNG receipt images & handles native Web Share / Clipboard copy.

import { openWhatsAppLink } from '../utils';

export function renderReceiptToCanvas({
  storeName = 'Green Mart Kirana & Superstore',
  storeAddress = 'Indiranagar, Bengaluru, Karnataka',
  storePhone = '+91 98765 43210',
  storeGstin = '29ABCDE1234F1Z5',
  invoiceNumber = 'INV-1001',
  customerName = 'Walk-in Customer',
  customerPhone = '',
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  total = 0,
  date = new Date(),
  footerNote = 'Thank you for shopping with us! Visit again.'
}) {
  if (typeof document === 'undefined') return null;

  const width = 500;
  const baseHeight = 440;
  const itemRowHeight = 26;
  const height = baseHeight + (items.length * itemRowHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Decorative border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  let y = 38;

  // Header Store Brand
  ctx.fillStyle = '#1e1b4b';
  ctx.font = '900 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(storeName.toUpperCase(), width / 2, y);

  y += 22;
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(storeAddress, width / 2, y);

  y += 18;
  ctx.fillText(`Phone: ${storePhone}   •   GSTIN: ${storeGstin}`, width / 2, y);

  y += 20;
  // Dashed separator
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, y);
  ctx.lineTo(width - 24, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Invoice & Customer Info
  y += 22;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Invoice #: ${invoiceNumber}`, 24, y);

  let dateStr = '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    dateStr = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    dateStr = String(date || '');
  }

  ctx.textAlign = 'right';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(dateStr, width - 24, y);

  y += 20;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Customer: ${customerName} ${customerPhone ? `(${customerPhone})` : ''}`, 24, y);

  y += 18;
  // Table Header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(20, y, width - 40, 24);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(20, y, width - 40, 24);

  y += 16;
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 28, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', width - 120, y);
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL', width - 28, y);

  y += 12;

  // Items List
  items.forEach((item) => {
    y += 22;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '500 12px system-ui, -apple-system, sans-serif';
    const name = item.productNameSnapshot || item.name || 'Item';
    const cleanName = name.length > 30 ? name.slice(0, 28) + '...' : name;
    ctx.fillText(cleanName, 28, y);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`x${item.quantity || 1}`, width - 120, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    const lineTotal = item.lineTotal !== undefined 
      ? Number(item.lineTotal) 
      : ((Number(item.unitPrice) || 0) * (item.quantity || 1));
    ctx.fillText(`₹${lineTotal.toFixed(2)}`, width - 28, y);
  });

  y += 18;
  // Dashed separator
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(24, y);
  ctx.lineTo(width - 24, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Subtotals & Discounts
  y += 22;
  ctx.textAlign = 'left';
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Subtotal:', 28, y);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${Number(subtotal || total).toFixed(2)}`, width - 28, y);

  if (Number(discount) > 0) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('Discount Savings:', 28, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₹${Number(discount).toFixed(2)}`, width - 28, y);
  }

  if (Number(tax) > 0) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('GST / Tax:', 28, y);
    ctx.textAlign = 'right';
    ctx.fillText(`₹${Number(tax).toFixed(2)}`, width - 28, y);
  }

  y += 28;
  // Grand Total Banner
  ctx.fillStyle = '#eef2ff';
  ctx.fillRect(20, y - 18, width - 40, 36);
  ctx.strokeStyle = '#c7d2fe';
  ctx.strokeRect(20, y - 18, width - 40, 36);

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#312e81';
  ctx.fillText('GRAND TOTAL (PAID):', 28, y + 5);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#4338ca';
  ctx.font = '900 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`₹${Number(total).toFixed(2)}`, width - 28, y + 5);

  y += 38;
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText('✔ PAYMENT RECEIVED & INVOICE ISSUED', width / 2, y);

  y += 22;
  ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(footerNote, width / 2, y);

  return canvas;
}

/**
 * Downloads receipt image as PNG file
 */
export async function downloadReceiptPng(saleData, customFilename) {
  const canvas = renderReceiptToCanvas(saleData);
  if (!canvas) return;

  const filename = customFilename || `Receipt-${saleData.invoiceNumber || 'Sale'}.png`;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the receipt image to clipboard for instant pasting (Ctrl+V) into WhatsApp Web/Desktop.
 */
export async function copyReceiptImageToClipboard(saleData) {
  const canvas = renderReceiptToCanvas(saleData);
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        console.warn('Clipboard write failed:', err);
        resolve(false);
      }
    }, 'image/png');
  });
}

/**
 * Native Web Share: directly sends PNG receipt to WhatsApp on mobile/tablets.
 * Falls back to clipboard copy + WhatsApp Web opener on desktop.
 */
export async function shareReceiptImage(saleData, whatsAppUrl) {
  const canvas = renderReceiptToCanvas(saleData);
  if (!canvas) return;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        if (whatsAppUrl) openWhatsAppLink(whatsAppUrl);
        resolve('fallback');
        return;
      }

      const file = new File([blob], `Receipt-${saleData.invoiceNumber || 'Sale'}.png`, { type: 'image/png' });

      // Check if native Web Share with files is supported (Android/iOS/Mac)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Tax Invoice #${saleData.invoiceNumber}`,
            text: `Tax Invoice from ${saleData.storeName || 'Green Mart'}`
          });
          resolve('shared');
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            resolve('aborted');
            return;
          }
        }
      }

      // Desktop fallback: Copy image to clipboard and open WhatsApp
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        }
      } catch (e) {
        console.warn('Clipboard copy error:', e);
      }

      if (whatsAppUrl) {
        openWhatsAppLink(whatsAppUrl);
      }
      resolve('copied');
    }, 'image/png');
  });
}
