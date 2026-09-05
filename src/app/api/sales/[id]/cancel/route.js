import { db } from '@/lib/db';
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to cancel completed sales.' } },
        { status: 403 }
      );
    }

    const { reason } = await request.json().catch(() => ({ reason: '' }));

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch Sale and check existence
      const sale = await tx.sale.findFirst({
        where: { id: saleId, businessId },
        include: {
          items: true,
          payments: true,
          customer: true
        }
      });

      if (!sale) {
        throw new Error('Sale record not found.');
      }

      if (sale.status === 'CANCELLED') {
        throw new Error('This sale invoice has already been cancelled.');
      }

      // 2. Return quantities to stock and create reversal logs
      for (const item of sale.items) {
        if (item.productId) {
          // Increment inventory back
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } }
          });

          // Create ledger reversal transaction
          await tx.inventoryTransaction.create({
            data: {
              businessId,
              productId: item.productId,
              type: 'SALE_RETURN',
              quantity: item.quantity,
              referenceType: 'SALE_CANCEL',
              referenceId: saleId,
              note: `Reversal: Cancelled invoice #${sale.invoiceNumber}. Note: ${reason || 'No reason provided'}`,
              createdBy: userId
            }
          });
        }
      }

      // 3. Reverse customer credit outstanding if applicable
      const creditAmount = sale.payments
        .filter(p => p.method === 'CREDIT')
        .reduce((sum, p) => sum + p.amount, 0);

      if (creditAmount > 0 && sale.customerId && sale.customer) {
        const customerAfterRefund = sale.customer.outstandingCredit - creditAmount;

        await tx.customer.update({
          where: { id: sale.customerId },
          data: { outstandingCredit: { decrement: creditAmount } }
        });

        await tx.customerLedger.create({
          data: {
            businessId,
            customerId: sale.customerId,
            type: 'REFUND',
            amount: -creditAmount,
            balanceAfter: customerAfterRefund,
            referenceType: 'RETURN',
            referenceId: saleId,
            note: `Reversal: Cancelled credit sale invoice #${sale.invoiceNumber}`,
            createdBy: userId
          }
        });
      }

      // 4. Update Sale status to CANCELLED
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'CANCELLED',
          paidAmount: 0.0,
          dueAmount: 0.0
        }
      });

      // 5. Log system audit
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'SALE_CANCELLED',
          details: `Invoice #${sale.invoiceNumber} was cancelled by User: ${userId}. Reason: ${reason || '—'}`
        }
      });

      return updatedSale;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Cancel sale failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CANCELLATION_ERROR', message: error.message || 'Failed to cancel sale.' } },
      { status: 500 }
    );
  }
}
