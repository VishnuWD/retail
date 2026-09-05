import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:webhooks');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const subs = await db.webhookSubscription.findMany({
      where: { businessId: auth.businessId }
    });

    return NextResponse.json({ success: true, data: subs });
  } catch (error) {
    console.error('v1 webhooks GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request, 'write:webhooks');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { url, events, secret } = payload;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'url and events list are required.' } }, { status: 400 });
    }

    const signingSecret = secret || 'whsec_' + crypto.randomBytes(16).toString('hex');

    const newSub = await db.webhookSubscription.create({
      data: {
        businessId: auth.businessId,
        url,
        events,
        secret: signingSecret
      }
    });

    return NextResponse.json({ success: true, data: newSub }, { status: 201 });
  } catch (error) {
    console.error('v1 webhooks POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
