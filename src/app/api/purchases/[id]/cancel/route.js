import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: poId } = await params;

    // Permissions check
    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to cancel purchases.' } },
        { status: 403 }
      );
    }

    const { reason } = await request.json().catch(() => ({ reason: '' }));

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch PurchaseOrder
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId, businessId },
        include: {
          items: true,
          supplier: true
        }
      });

      if (!po) {
        throw new Error('Purchase order not found.');
      }

      if (po.status === 'CANCELLED') {
        throw new Error('This purchase order is already cancelled.');
      }

      // 2. If stock was received, reverse stock balances
      for (const item of po.items) {
        if (item.productId && item.receivedQuantity > 0) {
          // Verify stock levels first to avoid negative inventory
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId }
          });

          const currentStock = inv?.quantity || 0;
          if (currentStock < item.receivedQuantity) {
            throw new Error(`Cannot cancel purchase. Only ${currentStock} units of "${item.productNameSnapshot}" remain in stock, but ${item.receivedQuantity} units were received. Reversing stock would result in negative inventory.`);
          }

          // Decrement stock count
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.receivedQuantity } }
          });

          // Create reversing transaction
          await tx.inventoryTransaction.create({
            data: {
              businessId,
              productId: item.productId,
              type: 'PURCHASE_RETURN',
              quantity: -item.receivedQuantity,
              referenceType: 'PURCHASE_CANCEL',
              referenceId: poId,
              note: `Reversal: Cancelled PO #${po.purchaseOrderNumber}. Reason: ${reason || '—'}`,
              createdBy: userId
            }
          });
        }
      }

      // 3. Reverse supplier ledger entry
      if (po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') {
        // Query current outstanding from other active POs to calculate balanceAfter
        const activePOs = await tx.purchaseOrder.findMany({
          where: {
            supplierId: po.supplierId,
            businessId,
            status: { not: 'CANCELLED' },
            id: { not: poId }
          },
          select: { dueAmount: true }
        });

        const activeOutstanding = activePOs.reduce((sum, o) => sum + o.dueAmount, 0);

        await tx.supplierLedger.create({
          data: {
            businessId,
            supplierId: po.supplierId,
            type: 'REFUND',
            amount: -po.dueAmount, // Negative amount to subtract payables
            balanceAfter: activeOutstanding,
            referenceType: 'PURCHASE',
            referenceId: poId,
            note: `Reversal: Cancelled purchase order PO #${po.purchaseOrderNumber}`,
            createdBy: userId
          }
        });
      }

      // 4. Update status and due/paid sums
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'CANCELLED',
          dueAmount: 0.0,
          paidAmount: 0.0
        }
      });

      // 5. Log audit
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'PURCHASE_CANCELLED',
          details: `Purchase Order #${po.purchaseOrderNumber} was cancelled by User: ${userId}. Reason: ${reason || '—'}`
        }
      });

      return updatedPO;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Cancel purchase order failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CANCEL_ERROR', message: error.message || 'Failed to cancel purchase order.' } },
      { status: 500 }
    );
  }
}
