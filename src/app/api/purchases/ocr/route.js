import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { processSupplierInvoice, approveAndGeneratePurchase } from '@/lib/services/ai/ocr';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized session.' }, { status: 401 });
    }

    const session = await verifyJWT(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
    }

    const { businessId, userId } = session;
    const body = await request.json();
    const { action, invoiceUrl, ocrRecordId, supplierId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action parameter is required.' }, { status: 400 });
    }

    if (action === 'PROCESS') {
      if (!invoiceUrl) {
        return NextResponse.json({ success: false, error: 'Invoice URL is required for processing.' }, { status: 400 });
      }

      const ocrRecord = await processSupplierInvoice(invoiceUrl, businessId);
      return NextResponse.json({ success: true, data: ocrRecord }, { status: 201 });
    }

    if (action === 'APPROVE') {
      if (!ocrRecordId || !supplierId) {
        return NextResponse.json({ success: false, error: 'ocrRecordId and supplierId are required for approval.' }, { status: 400 });
      }

      const result = await approveAndGeneratePurchase(ocrRecordId, supplierId, userId);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('OCR Route POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
