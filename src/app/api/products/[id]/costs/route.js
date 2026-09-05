import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id: productId } = await params;

    // Verify product exists
    const product = await db.product.findFirst({
      where: { id: productId, businessId }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } },
        { status: 404 }
      );
    }

    // Query historical purchase order item records
    const purchaseItems = await db.purchaseOrderItem.findMany({
      where: {
        productId,
        purchaseOrder: {
          businessId,
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        purchaseOrder: {
          purchaseDate: 'desc'
        }
      }
    });

    // 1. Cost History Log
    const history = purchaseItems.map(item => ({
      id: item.id,
      poNumber: item.purchaseOrder.purchaseOrderNumber,
      poId: item.purchaseOrder.id,
      purchaseDate: item.purchaseOrder.purchaseDate,
      supplierName: item.purchaseOrder.supplier.name,
      supplierId: item.purchaseOrder.supplier.id,
      unitCost: item.unitCost,
      quantity: item.orderedQuantity
    }));

    // 2. Supplier Price Comparison (latest cost per supplier)
    const supplierComparisonMap = {};
    purchaseItems.forEach(item => {
      const sup = item.purchaseOrder.supplier;
      if (!supplierComparisonMap[sup.id]) {
        supplierComparisonMap[sup.id] = {
          supplierId: sup.id,
          supplierName: sup.name,
          companyName: sup.companyName || '—',
          lastCost: item.unitCost,
          lastPurchaseDate: item.purchaseOrder.purchaseDate
        };
      }
    });

    const supplierComparison = Object.values(supplierComparisonMap);

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          defaultPurchasePrice: product.purchasePrice
        },
        history,
        comparison: supplierComparison
      }
    });
  } catch (error) {
    console.error('Fetch product cost history failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve product cost logs.' } },
      { status: 500 }
    );
  }
}
