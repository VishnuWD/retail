import { db } from '@/lib/db';
import { supplierSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    const supplier = await db.supplier.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        purchaseOrders: {
          where: {
            status: { not: 'CANCELLED' }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier profile not found.' } },
        { status: 404 }
      );
    }

    // Compile historical summaries
    const orders = await db.purchaseOrder.findMany({
      where: {
        supplierId: id,
        businessId,
        status: { not: 'CANCELLED' }
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      }
    });

    const totalPurchases = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const outstanding = orders.reduce((sum, o) => sum + o.dueAmount, 0);

    // Get unique products supplied by this supplier
    // We can query unique products by scanning items inside all POs of this supplier!
    const uniqueProducts = await db.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          supplierId: id,
          businessId
        }
      },
      distinct: ['productId'],
      select: {
        productId: true,
        productNameSnapshot: true,
        unitCost: true,
        product: {
          select: {
            name: true,
            brand: true,
            sku: true,
            sellingPrice: true,
            inventory: {
              select: {
                quantity: true
              }
            }
          }
        }
      }
    });

    const formattedProducts = uniqueProducts
      .filter(p => p.productId !== null)
      .map(p => ({
        id: p.productId,
        name: p.product?.name || p.productNameSnapshot,
        brand: p.product?.brand || '—',
        sku: p.product?.sku || '—',
        lastCost: p.unitCost,
        sellingPrice: p.product?.sellingPrice || 0,
        stock: p.product?.inventory?.quantity || 0
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        summary: {
          totalPurchases,
          paid,
          outstanding,
          productsCount: formattedProducts.length
        },
        recentPurchases: supplier.purchaseOrders,
        suppliedProducts: formattedProducts
      }
    });
  } catch (error) {
    console.error('Fetch supplier detail failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve supplier details.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id } = await params;

    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to edit supplier profiles.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = supplierSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await db.supplier.findFirst({
      where: { id, businessId }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier profile not found.' } },
        { status: 404 }
      );
    }

    const updated = await db.supplier.update({
      where: { id },
      data: parsed.data
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'SUPPLIER_UPDATED',
        details: `Supplier details updated for "${supplier.name}" by User: ${userId}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update supplier failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update supplier profile.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id } = await params;

    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to delete suppliers.' } },
        { status: 403 }
      );
    }

    // Verify supplier exists
    const supplier = await db.supplier.findFirst({
      where: { id, businessId }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier profile not found.' } },
        { status: 404 }
      );
    }

    // Check if supplier has historical transactions
    const historyCount = await db.purchaseOrder.count({
      where: { supplierId: id, businessId }
    });

    if (historyCount > 0) {
      // Toggle active status to false instead of deleting physically
      await db.supplier.update({
        where: { id },
        data: { isActive: false }
      });

      await db.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'SUPPLIER_DEACTIVATED',
          details: `Supplier "${supplier.name}" has historical purchases. Set isActive to false instead of delete. User: ${userId}`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Supplier has transactions. Marked as inactive to protect invoice logs.',
        deactivated: true
      });
    }

    // Safe to delete completely
    await db.supplier.delete({
      where: { id }
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'SUPPLIER_DELETED',
        details: `Supplier "${supplier.name}" physically deleted by User: ${userId}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully.',
      deactivated: false
    });
  } catch (error) {
    console.error('Delete supplier failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete supplier.' } },
      { status: 500 }
    );
  }
}
