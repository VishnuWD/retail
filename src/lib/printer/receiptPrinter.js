// Universal Thermal & Invoice Receipt Printer Service for Kirana POS
// Generates self-contained, print-isolated thermal receipts (58mm, 80mm, A4)
// and handles direct invisible iframe printing without rendering full browser UI.

export function generateReceiptHtml(sale, business = {}, paperSize = '58mm') {
  const bizName = sale?.business?.name || business?.name || 'Green Mart Kirana & Superstore';
  const bizAddress = sale?.business?.address || business?.address || 'Indiranagar, Bengaluru, Karnataka';
  const bizPhone = sale?.business?.phone || business?.phone || '+91 98765 43210';
  const bizGstin = sale?.business?.taxNumber || business?.taxNumber || '29ABCDE1234F1Z5';
  const bizUpi = sale?.business?.upiId || business?.upiId || 'greenmart@upi';
  const receiptFooter = sale?.business?.receiptFooter || business?.receiptFooter || 'Thank you for shopping with us! Visit again.';

  const invoiceNumber = sale?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const saleDate = sale?.createdAt ? new Date(sale.createdAt) : new Date();
  const customerName = sale?.customer?.name || sale?.customerName || 'Walk-in Customer';
  const customerPhone = sale?.customer?.phone || '';
  const cashierName = sale?.user?.name || sale?.createdBy || 'Store Operator';

  const items = sale?.items || [];
  const subtotal = Number(sale?.subtotal || sale?.totalAmount || 0);
  const discountAmount = Number(sale?.discountAmount || 0);
  const taxAmount = Number(sale?.taxAmount || 0);
  const totalAmount = Number(sale?.totalAmount || subtotal);
  const paidAmount = Number(sale?.paidAmount !== undefined ? sale.paidAmount : totalAmount);
  const dueAmount = Number(sale?.dueAmount || 0);

  const payments = (sale?.payments && sale?.payments.length > 0)
    ? sale.payments
    : [{ method: sale?.paymentMethod || 'CASH', amount: paidAmount }];

  const is58mm = paperSize === '58mm';
  const is80mm = paperSize === '80mm';
  const isA4 = paperSize === 'a4';

  const widthCss = is58mm ? '54mm' : (is80mm ? '76mm' : '100%');
  const maxContentWidth = is58mm ? '48mm' : (is80mm ? '72mm' : '190mm');
  const fontSize = is58mm ? '10px' : (is80mm ? '11px' : '13px');
  const qrSize = is58mm ? '60' : '80';

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=upi://pay?pa=${bizUpi}%26pn=${encodeURIComponent(bizName)}%26am=${totalAmount}%26cu=INR`;

  if (isA4) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; padding: 10px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
    .biz-name { font-size: 22px; font-weight: 800; color: #4338ca; text-transform: uppercase; }
    .biz-info { color: #64748b; font-size: 12px; margin-top: 4px; }
    .invoice-tag { text-align: right; }
    .invoice-title { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
    .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-area { display: flex; justify-content: space-between; margin-top: 10px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 15px; color: #4338ca; padding: 8px 0; margin-top: 6px; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="biz-name">${bizName}</div>
      <div class="biz-info">${bizAddress}<br>Ph: ${bizPhone} ${bizGstin ? `• GSTIN: ${bizGstin}` : ''}</div>
    </div>
    <div class="invoice-tag">
      <div class="invoice-title">Tax Invoice</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
        <strong>#${invoiceNumber}</strong><br>
        ${saleDate.toLocaleDateString('en-IN', { dateStyle: 'medium' })} ${saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>

  <div class="customer-box">
    <div>
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Customer</div>
      <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${customerName}</div>
      ${customerPhone ? `<div style="font-size: 12px; color: #64748b;">${customerPhone}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Cashier</div>
      <div style="font-weight: 600; color: #334155;">${cashierName}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Item Description</th>
        <th class="text-center" style="width: 70px;">Qty</th>
        <th class="text-right" style="width: 100px;">Rate</th>
        <th class="text-right" style="width: 90px;">Discount</th>
        <th class="text-right" style="width: 110px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => {
        const name = item.productNameSnapshot || item.name || 'Item';
        const qty = item.quantity || 1;
        const price = Number(item.unitPrice || 0);
        const disc = Number(item.discountAmount || 0);
        const tot = Number(item.lineTotal || (price * qty));
        return `<tr>
          <td style="color: #94a3b8;">${idx + 1}</td>
          <td><strong style="color: #0f172a;">${name}</strong></td>
          <td class="text-center">${qty}</td>
          <td class="text-right">₹${price.toFixed(2)}</td>
          <td class="text-right">${disc > 0 ? `-₹${disc.toFixed(2)}` : '—'}</td>
          <td class="text-right" style="font-weight: 700;">₹${tot.toFixed(2)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="totals-area">
    <div style="font-size: 12px; color: #475569;">
      <strong>Payment Mode:</strong> ${payments.map(p => `${p.method} (₹${Number(p.amount || 0).toFixed(0)})`).join(', ')}
      ${dueAmount > 0 ? `<div style="color: #dc2626; font-weight: 700; margin-top: 4px;">Udhaar Due: ₹${dueAmount.toFixed(2)}</div>` : ''}
    </div>

    <div class="totals-box">
      <div class="totals-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${discountAmount > 0 ? `<div class="totals-row" style="color: #16a34a;"><span>Discount:</span><span>-₹${discountAmount.toFixed(2)}</span></div>` : ''}
      ${taxAmount > 0 ? `<div class="totals-row"><span>GST Tax:</span><span>₹${taxAmount.toFixed(2)}</span></div>` : ''}
      <div class="totals-row grand-total"><span>Total Amount:</span><span>₹${totalAmount.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="footer">${receiptFooter}</div>
</body>
</html>`;
  }

  // THERMAL RECEIPT (58mm & 80mm)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${invoiceNumber}</title>
  <style>
    @page {
      margin: 0 !important;
      size: ${paperSize === '58mm' ? '58mm auto' : '80mm auto'} !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: ${widthCss};
      max-width: ${widthCss};
      margin: 0 auto;
      padding: 3mm 2mm;
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: ${fontSize};
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 3px 0;
    }
    .double-divider {
      border-top: 2px dashed #000;
      margin: 4px 0;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .store-title {
      font-size: ${is58mm ? '13px' : '15px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .item-row {
      padding: 2px 0;
    }
    .item-name {
      font-weight: bold;
      word-break: break-word;
    }
    .qr-container {
      margin: 6px auto;
      text-align: center;
    }
    .qr-img {
      display: block;
      margin: 0 auto;
      width: ${qrSize}px;
      height: ${qrSize}px;
    }
  </style>
</head>
<body>
  <!-- Store Header -->
  <div class="text-center">
    <div class="store-title">${bizName}</div>
    <div style="font-size: 9px; margin-top: 2px;">${bizAddress}</div>
    <div style="font-size: 9px;">Phone: ${bizPhone}</div>
    ${bizGstin ? `<div style="font-size: 9px; font-weight: bold;">GSTIN: ${bizGstin}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Receipt Metadata -->
  <div style="font-size: 9px;">
    <div class="flex-row">
      <span>Bill: #${invoiceNumber}</span>
      <span>${saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
    </div>
    <div class="flex-row">
      <span>Cashier: ${cashierName}</span>
      <span>${saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="flex-row bold">
      <span>Cust: ${customerName}</span>
      ${customerPhone ? `<span>${customerPhone}</span>` : ''}
    </div>
  </div>

  <div class="divider"></div>

  <!-- Items Header -->
  <div class="flex-row bold" style="font-size: 9px;">
    <span style="flex: 2;">ITEM</span>
    <span style="flex: 1; text-align: center;">QTY</span>
    <span style="flex: 1; text-align: right;">AMT</span>
  </div>
  <div class="divider"></div>

  <!-- Items List -->
  ${items.map(item => {
    const name = item.productNameSnapshot || item.name || 'Item';
    const qty = item.quantity || 1;
    const price = Number(item.unitPrice || 0);
    const tot = Number(item.lineTotal || (price * qty));
    return `<div class="item-row">
      <div class="item-name">${name}</div>
      <div class="flex-row" style="font-size: 9px; color: #222;">
        <span style="flex: 2;">@ ${price.toFixed(2)}</span>
        <span style="flex: 1; text-align: center; font-weight: bold;">x${qty}</span>
        <span style="flex: 1; text-align: right; font-weight: bold;">₹${tot.toFixed(2)}</span>
      </div>
    </div>`;
  }).join('')}

  <div class="divider"></div>

  <!-- Totals Section -->
  <div style="font-size: 9px;">
    <div class="flex-row">
      <span>Subtotal:</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    ${discountAmount > 0 ? `
    <div class="flex-row">
      <span>Discount:</span>
      <span>-₹${discountAmount.toFixed(2)}</span>
    </div>` : ''}
    ${taxAmount > 0 ? `
    <div class="flex-row">
      <span>GST Tax:</span>
      <span>₹${taxAmount.toFixed(2)}</span>
    </div>` : ''}
  </div>

  <div class="double-divider"></div>

  <!-- Total Amount in Bold -->
  <div class="flex-row bold" style="font-size: ${is58mm ? '13px' : '15px'};">
    <span>TOTAL:</span>
    <span>₹${totalAmount.toFixed(2)}</span>
  </div>

  <div class="double-divider"></div>

  <!-- Payment Details -->
  <div style="font-size: 9px;">
    <div class="flex-row bold">
      <span>Paid (${payments.map(p => p.method).join(', ')}):</span>
      <span>₹${paidAmount.toFixed(2)}</span>
    </div>
    ${dueAmount > 0 ? `
    <div class="flex-row bold" style="color: #000;">
      <span>Udhaar Balance:</span>
      <span>₹${dueAmount.toFixed(2)}</span>
    </div>` : ''}
  </div>

  <!-- UPI QR Code -->
  <div class="qr-container">
    <img class="qr-img" src="${qrUrl}" alt="QR" />
    <div style="font-size: 8px; font-weight: bold; margin-top: 2px;">Scan & Pay / Verify</div>
  </div>

  <div class="divider"></div>

  <!-- Footer -->
  <div class="text-center" style="font-size: 8px; font-weight: bold; padding-top: 2px;">
    ${receiptFooter}
  </div>
</body>
</html>`;
}

// Invisible Iframe Direct Printing Function
// Sends ONLY the isolated thermal receipt to the printer spooler without full page clutter
export function printReceiptDirectly(sale, business = {}, paperSize = '58mm') {
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHtml(sale, business, paperSize);

      // Create an invisible iframe
      const iframe = document.createElement('iframe');
      iframe.id = `receipt_iframe_${Date.now()}`;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        iframe.remove();
        resolve(false);
        return;
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      let printed = false;
      const triggerPrint = () => {
        if (printed) return;
        printed = true;
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        } finally {
          setTimeout(() => {
            iframe.remove();
            resolve(true);
          }, 1500);
        }
      };

      // Wait for image/render to complete before printing
      if (iframe.contentWindow) {
        iframe.contentWindow.onload = () => {
          setTimeout(triggerPrint, 250);
        };
      }
      // Fallback timer if onload does not fire immediately
      setTimeout(triggerPrint, 500);
    } catch (err) {
      console.error('Failed to trigger direct receipt print:', err);
      resolve(false);
    }
  });
}
