import { NextResponse } from 'next/server';
import { WhatsAppProvider } from '@/lib/integrations/messaging/messaging';
import { formatWhatsAppPhone, generateWhatsAppInvoice } from '@/lib/utils';
import { db } from '@/lib/db';

const whatsapp = new WhatsAppProvider();

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, invoiceNumber, format = 'pdf', sale } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer phone number is required.' } },
        { status: 400 }
      );
    }

    const formattedPhone = formatWhatsAppPhone(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid 10-digit mobile number provided.' } },
        { status: 400 }
      );
    }

    // Origin detection
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    // Look up sale if not passed in body
    let saleRecord = sale;
    if (!saleRecord && invoiceNumber) {
      try {
        saleRecord = await db.sale.findFirst({
          where: { invoiceNumber },
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        });
      } catch (e) {
        console.warn('DB lookup failed, using client payload:', e.message);
      }
    }

    const customerName = saleRecord?.customer?.name || saleRecord?.customerName || 'Valued Customer';
    const totalAmount = Number(saleRecord?.totalAmount || saleRecord?.total || 0);

    // Build public digital invoice link
    const invoiceUrl = `${origin}/print/${invoiceNumber || 'latest'}?type=a4`;

    // Generate formatted text message as backup or caption
    const { text, url: whatsappWebUrl } = generateWhatsAppInvoice({
      phone: formattedPhone,
      invoiceNumber: invoiceNumber || 'INV-SALE',
      storeName: 'Green Mart Kirana & Superstore',
      storePhone: '+91 98765 43210',
      items: saleRecord?.items || [],
      subtotal: saleRecord?.subtotal || totalAmount,
      discount: saleRecord?.discountAmount || 0,
      tax: saleRecord?.taxAmount || 0,
      total: totalAmount,
      customerName,
      invoiceUrl
    });

    // Determine media attachment type (document/pdf or image)
    const mediaType = format === 'image' ? 'image' : 'document';

    // Dispatch via WhatsApp Provider (Meta Cloud API if configured, else Simulated)
    const result = await whatsapp.sendInvoice({
      to: formattedPhone,
      invoiceNumber: invoiceNumber || 'INV-SALE',
      customerName,
      amount: totalAmount,
      downloadUrl: invoiceUrl,
      mediaType,
      caption: `🧾 Tax Invoice #${invoiceNumber || 'SALE'} from Green Mart Kirana. Total: ₹${totalAmount.toFixed(2)}`
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: result.mode, // 'CLOUD_API' or 'SIMULATED'
        messageId: result.messageId,
        recipient: formattedPhone,
        format: mediaType,
        invoiceUrl,
        whatsappWebUrl,
        message: result.mode === 'CLOUD_API'
          ? `Invoice ${mediaType.toUpperCase()} dispatched directly to +${formattedPhone} via WhatsApp Cloud API.`
          : `Receipt ${mediaType.toUpperCase()} prepared for +${formattedPhone}. (Simulated API Mode)`
      }
    });

  } catch (error) {
    console.error('WhatsApp Send API Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to send WhatsApp message.' } },
      { status: 500 }
    );
  }
}
