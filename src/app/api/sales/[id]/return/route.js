import { db } from '@/lib/db';
import { saleReturnSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: saleId } = await params;

    // Role authentication check (Only OWNER, MANAGER, ADMIN are authorized)
    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to process product returns.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate
    const parsed = saleReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { refundMethod, note, items } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch Sale details
      const sale = await tx.sale.findFirst({
        where: { id: saleId, businessId },
        include: {
          items: true,
          returns: {
            include: {
              items: true
            }
          }
        }
      });

      if (!sale) {
        throw new Error('Sale record not found.');
      }

      if (sale.status === 'CANCELLED') {
        throw new Error('Cannot process returns on a cancelled sale.');
      }

      // Map previously returned quantities by saleItemId
      const previouslyReturned = {};
      sale.returns.forEach(ret => {
        ret.items.forEach(retItem => {
          previouslyReturned[retItem.saleItemId] = (previouslyReturned[retItem.saleItemId] || 0) + retItem.quantity;
        });
      });

      let totalRefund = 0;
      const returnItemsToCreate = [];

      // 2. Validate return limits
      for (const item of items) {
        const saleItem = sale.items.find(si => si.id === item.saleItemId);
        if (!saleItem) {
          throw new Error(`Sale item ID ${item.saleItemId} is not part of this invoice.`);
        }

        const prevReturnedQty = previouslyReturned[saleItem.id] || 0;
        const maxReturnable = saleItem.quantity - prevReturnedQty;

        if (item.quantity > maxReturnable) {
          throw new Error(`Return quantity for "${saleItem.productNameSnapshot}" (${item.quantity}) exceeds maximum returnable (${maxReturnable}).`);
        }

        // Calculate proportional refund: (lineTotal / originalQuantity) * returnedQty
        const unitRefundAmount = saleItem.lineTotal / saleItem.quantity;
        const lineRefund = unitRefundAmount * item.quantity;
        totalRefund += lineRefund;

        returnItemsToCreate.push({
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          productNameSnapshot: saleItem.productNameSnapshot,
          quantity: item.quantity,
          unitPrice: saleItem.unitPrice,
          refundAmount: lineRefund
        });
      }

      // 3. Generate Return sequence number
      const returnsCount = await tx.saleReturn.count({ where: { businessId } });
      const returnNumber = `RET-${new Date().getFullYear()}-${String(returnsCount + 1).padStart(6, '0')}`;

      // 4. Save SaleReturn record
      const saleReturn = await tx.saleReturn.create({
        data: {
          businessId,
          saleId,
          returnNumber,
          refundAmount: totalRefund,
          refundMethod,
          note: note || null,
          createdBy: userId
        }
      });

      // 5. Create Return items, increment stock count, and write transactions
      for (const retItem of returnItemsToCreate) {
        await tx.saleReturnItem.create({
          data: {
            saleReturnId: saleReturn.id,
            saleItemId: retItem.saleItemId,
            quantity: retItem.quantity,
            unitPrice: retItem.unitPrice,
            refundAmount: retItem.refundAmount
          }
        });

        if (retItem.productId) {
          // Add back to inventory
          await tx.inventory.update({
            where: { productId: retItem.productId },
            data: { quantity: { increment: retItem.quantity } }
          });

          // Create inventory ledger transaction
          await tx.inventoryTransaction.create({
            data: {
              businessId,
              productId: retItem.productId,
              type: 'SALE_RETURN',
              quantity: retItem.quantity,
              referenceType: 'SALE_RETURN',
              referenceId: saleReturn.id,
              note: `Returned from invoice #${sale.invoiceNumber}. Return ref: ${returnNumber}`,
              createdBy: userId
            }
          });
        }
      }

      // 6. Update original Sale status (Check if completely returned)
      let allReturned = true;
      sale.items.forEach(si => {
        const totalRet = (previouslyReturned[si.id] || 0) + (items.find(i => i.saleItemId === si.id)?.quantity || 0);
        if (totalRet < si.quantity) {
          allReturned = false;
        }
      });

      const nextStatus = allReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';
      
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: nextStatus
        }
      });

      // 7. Log system audits
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'SALE_RETURNED',
          details: `Return ${returnNumber} created for Invoice #${sale.invoiceNumber}. Refund: ${totalRefund}. User: ${userId}`
        }
      });

      return {
        saleReturn,
        returnNumber,
        refundAmount: totalRefund
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Process sale return failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RETURN_ERROR', message: error.message || 'Failed to process return.' } },
      { status: 500 }
    );
  }
}
