import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Sanitizes and normalizes phone numbers for WhatsApp API.
 * Ensures valid international country code (e.g. 91 for India) without duplicating it.
 */
export function formatWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/\D/g, '');
  if (!cleaned) return '';

  // Strip leading zero if present (e.g. 09876543210 -> 9876543210)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  // If 10-digit Indian phone number, prepend 91
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }

  // If 12 digits starting with 91, it's already well-formatted
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }

  // If 11 digits starting with 91 (some truncated numbers), check validity
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Builds a structured, beautiful plain-text receipt and WhatsApp API link.
 */
export function generateWhatsAppInvoice({
  phone = '',
  invoiceNumber = '',
  storeName = 'Green Mart Kirana',
  storePhone = '',
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  total = 0,
  customerName = 'Valued Customer',
  date = new Date(),
  upiId = '',
  footerNote = '',
  invoiceUrl = ''
}) {
  const formattedPhone = formatWhatsAppPhone(phone);
  
  let formattedDate = '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch {
    formattedDate = '';
  }

  const itemsLines = items.map((item, idx) => {
    const name = item.productNameSnapshot || item.name || `Item ${idx + 1}`;
    const qty = item.quantity || 1;
    const lineTotal = item.lineTotal !== undefined 
      ? Number(item.lineTotal) 
      : (Number(item.unitPrice || 0) * qty);
    return `• ${name} (x${qty}) — ₹${lineTotal.toFixed(2)}`;
  }).join('\n');

  let text = `🧾 *${storeName.toUpperCase()} - TAX INVOICE*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Invoice #:* ${invoiceNumber || 'INV-SALE'}\n` +
    (formattedDate ? `*Date:* ${formattedDate}\n` : '') +
    `*Customer:* ${customerName || 'Walk-in Customer'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 *ITEMS PURCHASED:*\n` +
    `${itemsLines || '• Retail Merchandise'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Subtotal:* ₹${Number(subtotal || total).toFixed(2)}\n`;

  if (Number(discount) > 0) {
    text += `*Discount:* -₹${Number(discount).toFixed(2)}\n`;
  }
  if (Number(tax) > 0) {
    text += `*GST / Tax:* ₹${Number(tax).toFixed(2)}\n`;
  }

  text += `*GRAND TOTAL:* *₹${Number(total).toFixed(2)}*\n` +
    `*Status:* Paid & Completed\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🙏 *Thank you for shopping with ${storeName}!*`;

  if (storePhone) {
    text += `\n📞 Support / Delivery: ${storePhone}`;
  }
  if (upiId) {
    text += `\n💳 UPI Payment: ${upiId}`;
  }
  if (footerNote) {
    text += `\n${footerNote}`;
  }
  if (invoiceUrl) {
    text += `\n\n📄 *Official PDF & Digital Receipt:*\n${invoiceUrl}`;
  }

  const encodedText = encodeURIComponent(text);

  // Use official universal WhatsApp send link
  const url = formattedPhone 
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return {
    url,
    phone: formattedPhone,
    text
  };
}

/**
 * Reliably dispatches a WhatsApp URL avoiding browser popup blockers.
 */
export function openWhatsAppLink(url) {
  if (typeof window === 'undefined' || !url) return;

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
