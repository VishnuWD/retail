import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId } = session;

    const business = await db.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business settings not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: business });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve settings.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId, userId } = session;
    const body = await request.json();

    const { name, legalName, phone, email, address, taxNumber, capabilities, currency, logo } = body;

    const updated = await db.business.update({
      where: { id: businessId },
      data: {
        name,
        legalName: legalName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        taxNumber: taxNumber || null,
        currency: currency || undefined,
        logo: logo || null,
        capabilities: capabilities || undefined
      }
    });

    // Log Audit Log
    await db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'SETTINGS_UPDATED',
        details: `Shop settings updated by User: ${userId}`
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings.' }, { status: 500 });
  }
}
