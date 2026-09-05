import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id: poId } = await params;

    const po = await db.purchaseOrder.findFirst({
      where: {
        id: poId,
        businessId
      },
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: true
          }
        },
        payments: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!po) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Purchase Order not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Fetch purchase order detail failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve purchase details.' } },
      { status: 500 }
    );
  }
}
