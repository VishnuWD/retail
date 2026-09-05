import { db } from '@/lib/db';
import { supplierSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL'; // ACTIVE, INACTIVE, ALL
    const hasOutstanding = searchParams.get('hasOutstanding') === 'true';

    const where = {
      businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (hasOutstanding) {
      where.purchaseOrders = {
        some: {
          dueAmount: { gt: 0 },
          status: { not: 'CANCELLED' }
        }
      };
    }

    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        include: {
          purchaseOrders: {
            where: {
              status: { not: 'CANCELLED' }
            },
            select: {
              totalAmount: true,
              paidAmount: true,
              dueAmount: true,
              createdAt: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.supplier.count({ where }),
    ]);

    // Format results with aggregate summaries
    const formatted = suppliers.map(s => {
      const orders = s.purchaseOrders || [];
      const totalPurchases = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const paid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
      const outstanding = orders.reduce((sum, o) => sum + o.dueAmount, 0);
      
      const lastPurchase = orders.length > 0 
        ? orders.reduce((max, o) => o.createdAt > max ? o.createdAt : max, orders[0].createdAt)
        : null;

      return {
        id: s.id,
        name: s.name,
        companyName: s.companyName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        taxNumber: s.taxNumber,
        notes: s.notes,
        isActive: s.isActive,
        createdAt: s.createdAt,
        purchaseOrdersCount: orders.length,
        totalPurchases,
        paid,
        outstanding,
        lastPurchase
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        suppliers: formatted,
        meta: {
          page,
          pages: Math.ceil(total / limit),
          total,
        }
      }
    });
  } catch (error) {
    console.error('Fetch suppliers error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve suppliers directory.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Only OWNER, MANAGER, INVENTORY can add suppliers
    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to create suppliers.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { name, companyName, phone, email, taxNumber, address, notes } = parsed.data;

    // Check duplicate name
    const existing = await db.supplier.findFirst({
      where: {
        businessId,
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_SUPPLIER', message: `Supplier with name "${name}" already exists.` } },
        { status: 409 }
      );
    }

    const supplier = await db.supplier.create({
      data: {
        businessId,
        name,
        companyName: companyName || null,
        phone: phone || null,
        email: email || null,
        taxNumber: taxNumber || null,
        address: address || null,
        notes: notes || null,
        isActive: true
      }
    });

    // Log audit
    await db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'SUPPLIER_CREATED',
        details: `Supplier "${name}" registered by User: ${userId}`
      }
    });

    return NextResponse.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to register supplier.' } },
      { status: 500 }
    );
  }
}
