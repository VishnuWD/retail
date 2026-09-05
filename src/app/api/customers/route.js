import { db } from '@/lib/db';
import { customerSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = {
      businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve customers.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    
    // Validate
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { name, phone, email, address } = parsed.data;

    // Check duplicate phone in business scope
    if (phone) {
      const existing = await db.customer.findFirst({
        where: {
          businessId,
          phone,
        },
      });

      if (existing) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'DUPLICATE_CUSTOMER', 
              message: `Customer with phone number "${phone}" already exists.`,
              customer: existing
            } 
          },
          { status: 409 }
        );
      }
    }

    const customer = await db.customer.create({
      data: {
        businessId,
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        outstandingCredit: 0.0,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to register customer.' } },
      { status: 500 }
    );
  }
}
