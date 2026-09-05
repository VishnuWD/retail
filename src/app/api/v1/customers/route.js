import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:customers');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = { businessId: auth.businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await db.customer.findMany({
      where,
      include: {
        ledgers: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    });

    const total = await db.customer.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: { total, pages: Math.ceil(total / limit), page, limit }
      }
    });
  } catch (error) {
    console.error('v1 customers GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request, 'write:customers');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { name, phone, email, address } = payload;

    if (!name) {
      return NextResponse.json({ success: false, error: { message: 'Customer name is required.' } }, { status: 400 });
    }

    // Phone uniqueness check
    if (phone) {
      const existingCustomer = await db.customer.findFirst({
        where: { businessId: auth.businessId, phone }
      });
      if (existingCustomer) {
        return NextResponse.json({ success: false, error: { message: `Customer with phone '${phone}' already exists.` } }, { status: 409 });
      }
    }

    const customer = await db.customer.create({
      data: {
        businessId: auth.businessId,
        name,
        phone,
        email,
        address
      }
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error('v1 customers POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
