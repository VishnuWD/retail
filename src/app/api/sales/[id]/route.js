import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id: saleId } = await params;

    const sale = await db.sale.findFirst({
      where: {
        id: saleId,
        businessId
      },
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        returns: {
          include: {
            items: true
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sale invoice could not be found.' } },
        { status: 404 }
      );
    }

    // Fetch corresponding inventory impact logs
    const inventoryImpacts = await db.inventoryTransaction.findMany({
      where: {
        businessId,
        referenceType: 'SALE',
        referenceId: saleId
      },
      include: {
        product: { select: { name: true, unit: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        inventoryImpacts: inventoryImpacts.map(impact => ({
          productId: impact.productId,
          productName: impact.product.name,
          quantity: impact.quantity,
          unit: impact.product.unit
        }))
      }
    });
  } catch (error) {
    console.error('Fetch sale detail failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve sale invoice details.' } },
      { status: 500 }
    );
  }
}
