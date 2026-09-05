import { db } from '@/lib/db';
import { purchaseReceiveSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: poId } = await params;

    // Only OWNER, MANAGER, INVENTORY roles can receive stock
    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to receive stock.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = purchaseReceiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { items: itemsToReceive } = parsed.data;

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

      if (po.status === 'RECEIVED') {
        throw new Error('This purchase order has already been fully received.');
      }

      if (po.status === 'CANCELLED') {
        throw new Error('Cannot receive stock for a cancelled purchase order.');
      }

      if (po.status === 'DRAFT') {
        throw new Error('Settle Purchase Order status to "ORDERED" before receiving stock.');
      }

      let totalReceivedValue = 0.0;
      const receivedLogDetails = [];

      // 2. Validate receive limits and update stocks
      for (const item of itemsToReceive) {
        const poItem = po.items.find(pi => pi.id === item.purchaseOrderItemId);
        if (!poItem) {
          throw new Error(`Item ID ${item.purchaseOrderItemId} is not part of this purchase order.`);
        }

        const remainingQty = poItem.orderedQuantity - poItem.receivedQuantity;
        if (item.receiveNow > remainingQty) {
          throw new Error(`Cannot receive ${item.receiveNow} units of "${poItem.productNameSnapshot}". Remaining ordered quantity is only ${remainingQty}.`);
        }

        if (item.receiveNow > 0) {
          // Increment receivedQuantity on POItem
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQuantity: { increment: item.receiveNow } }
          });

          if (poItem.productId) {
            // Increment stock count in Inventory
            await tx.inventory.update({
              where: { productId: poItem.productId },
              data: { quantity: { increment: item.receiveNow } }
            });

            // Create inventory transaction
            await tx.inventoryTransaction.create({
              data: {
                businessId,
                productId: poItem.productId,
                type: 'PURCHASE',
                quantity: item.receiveNow,
                referenceType: 'PURCHASE',
                referenceId: poId,
                note: `Received stock from PO #${po.purchaseOrderNumber}`,
                createdBy: userId
              }
            });
          }

          // Proportional received cost: (lineTotal / orderedQuantity) * receiveNow
          const unitCostWithTaxesAndDiscounts = poItem.lineTotal / poItem.orderedQuantity;
          const lineReceivedCost = unitCostWithTaxesAndDiscounts * item.receiveNow;
          totalReceivedValue += lineReceivedCost;

          receivedLogDetails.push(`${poItem.productNameSnapshot}: +${item.receiveNow}`);
        }
      }

      // Check if PO is now fully received
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId }
      });

      let allReceived = true;
      updatedPOItems.forEach(pi => {
        if (pi.receivedQuantity < pi.orderedQuantity) {
          allReceived = false;
        }
      });

      const nextStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      // 3. Update PurchaseOrder status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: nextStatus }
      });

      // 4. Settle Credit in Supplier Ledger if items were received
      if (totalReceivedValue > 0) {
        // Query current outstanding payables from all active POs
        const activePOs = await tx.purchaseOrder.findMany({
          where: {
            supplierId: po.supplierId,
            businessId,
            status: { not: 'CANCELLED' }
          },
          select: { dueAmount: true }
        });

        const activeOutstanding = activePOs.reduce((sum, o) => sum + o.dueAmount, 0);

        await tx.supplierLedger.create({
          data: {
            businessId,
            supplierId: po.supplierId,
            type: 'CREDIT',
            amount: totalReceivedValue,
            balanceAfter: activeOutstanding,
            referenceType: 'PURCHASE',
            referenceId: poId,
            note: `Received stock from PO #${po.purchaseOrderNumber}. Items: ${receivedLogDetails.join(', ')}`,
            createdBy: userId
          }
        });
      }

      // 5. Log audit
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'STOCK_RECEIVED',
          details: `Stock received for PO #${po.purchaseOrderNumber} by User: ${userId}. Value: ${totalReceivedValue}`
        }
      });

      return {
        purchaseOrder: updatedPO,
        receivedValue: totalReceivedValue
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Receive stock failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RECEIVE_ERROR', message: error.message || 'Failed to process stock intake.' } },
      { status: 500 }
    );
  }
}
