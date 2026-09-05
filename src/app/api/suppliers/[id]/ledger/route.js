import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id: supplierId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify supplier exists
    const supplier = await db.supplier.findFirst({
      where: { id: supplierId, businessId }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier profile not found.' } },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const [ledgerEntries, total] = await Promise.all([
      db.supplierLedger.findMany({
        where: {
          supplierId,
          businessId
        },
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.supplierLedger.count({
        where: { supplierId, businessId }
      })
    ]);

    // Calculate current aggregate outstanding from all POs (safety fallback)
    const orders = await db.purchaseOrder.findMany({
      where: {
        supplierId,
        businessId,
        status: { not: 'CANCELLED' }
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      }
    });

    const outstandingBalance = orders.reduce((sum, o) => sum + o.dueAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        ledger: ledgerEntries,
        outstandingBalance,
        meta: {
          page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Fetch supplier ledger failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve supplier ledger logs.' } },
      { status: 500 }
    );
  }
}
