import { db } from '@/lib/db';
import { supplierPaymentInputSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Only OWNER, MANAGER roles can record payments
    if (userRole === 'CASHIER' || userRole === 'INVENTORY') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Staff role not authorized to register supplier payments.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = supplierPaymentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { supplierId, purchaseOrderId, amount, method, reference, note } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // 1. Verify supplier
      const supplier = await tx.supplier.findFirst({
        where: { id: supplierId, businessId }
      });
      if (!supplier) {
        throw new Error('Supplier profile not found.');
      }

      // 2. Settle payment against specific PO or allocate sequentially
      if (purchaseOrderId) {
        const po = await tx.purchaseOrder.findFirst({
          where: { id: purchaseOrderId, supplierId, businessId, status: { not: 'CANCELLED' } }
        });

        if (!po) {
          throw new Error('Associated active purchase order not found.');
        }

        if (amount > po.dueAmount) {
          throw new Error(`Payment amount (${amount}) exceeds the purchase order outstanding balance (${po.dueAmount}).`);
        }

        const nextDue = po.dueAmount - amount;
        const nextPaid = po.paidAmount + amount;
        const nextPaymentStatus = nextDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            paidAmount: nextPaid,
            dueAmount: nextDue,
            paymentStatus: nextPaymentStatus
          }
        });
      } else {
        // Bulk Payment distribution: Apply to oldest unpaid POs first
        let remainingPayment = amount;

        const openPOs = await tx.purchaseOrder.findMany({
          where: {
            supplierId,
            businessId,
            status: { not: 'CANCELLED' },
            paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] }
          },
          orderBy: { createdAt: 'asc' }
        });

        for (const openPo of openPOs) {
          if (remainingPayment <= 0) break;

          const allocation = Math.min(openPo.dueAmount, remainingPayment);
          const nextDue = openPo.dueAmount - allocation;
          const nextPaid = openPo.paidAmount + allocation;
          const nextPaymentStatus = nextDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

          await tx.purchaseOrder.update({
            where: { id: openPo.id },
            data: {
              paidAmount: nextPaid,
              dueAmount: nextDue,
              paymentStatus: nextPaymentStatus
            }
          });

          remainingPayment -= allocation;
        }
      }

      // 3. Create Supplier Payment record
      const payment = await tx.supplierPayment.create({
        data: {
          businessId,
          supplierId,
          purchaseOrderId: purchaseOrderId || null,
          amount,
          method,
          reference: reference || null,
          note: note || null,
          createdBy: userId
        }
      });

      // 4. Recalculate outstanding payables and log in Supplier Ledger
      const activePOs = await tx.purchaseOrder.findMany({
        where: {
          supplierId,
          businessId,
          status: { not: 'CANCELLED' }
        },
        select: { dueAmount: true }
      });
      const activeOutstanding = activePOs.reduce((sum, o) => sum + o.dueAmount, 0);

      await tx.supplierLedger.create({
        data: {
          businessId,
          supplierId,
          type: 'PAYMENT',
          amount: -amount, // Debit (reducing outstanding)
          balanceAfter: activeOutstanding,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          note: note || (purchaseOrderId 
            ? `Payment settled for PO #${payment.id.slice(0, 8).toUpperCase()}`
            : 'Payment applied to general account balance'),
          createdBy: userId
        }
      });

      // 5. Log audit
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'SUPPLIER_PAYMENT_CREATED',
          details: `Supplier payment of ₹${amount} logged for supplier ID: ${supplierId}. Method: ${method}`
        }
      });

      return payment;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Record supplier payment failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PAYMENT_ERROR', message: error.message || 'Failed to record payment.' } },
      { status: 500 }
    );
  }
}
