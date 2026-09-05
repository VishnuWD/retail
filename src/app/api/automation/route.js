import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing.' }, { status: 400 });
    }

    const rules = await db.automationRule.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('Automation GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, trigger, conditions, actions, isActive = true } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json({ success: false, error: 'Missing required rule parameters: name, trigger, actions.' }, { status: 400 });
    }

    const newRule = await db.automationRule.create({
      data: {
        businessId,
        name,
        trigger,
        conditions,
        actions,
        isActive
      }
    });

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (error) {
    console.error('Automation POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
