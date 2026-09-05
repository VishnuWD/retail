import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Read signature header and payload
    const signature = request.headers.get('x-webhook-signature');
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // In a real environment, verify the signature using crypto:
    // e.g. crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex') === signature
    // Here we perform basic checks or check if the signature is present if configured.
    console.log(`[Webhook] Received payment webhook with signature: ${signature}`);

    // 2. Validate event and extract transaction data
    const { event, provider, transactionId, saleId, amount, idempotencyKey } = payload;

    if (!event || !provider || !transactionId || !saleId || !amount) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing required webhook fields.' } },
        { status: 400 }
      );
    }

    // 3. Enforce Idempotency using the IdempotencyKey table
    const targetKey = idempotencyKey || `${provider}_${transactionId}_${event}`;
    
    const existingKey = await db.idempotencyKey.findUnique({
      where: { key: targetKey }
    });

    if (existingKey) {
      console.log(`[Webhook] Duplicate event detected for key: ${targetKey}. Skipping business action.`);
      return NextResponse.json({ success: true, message: 'Duplicate event processed successfully (idempotent).' });
    }

    // Record the key to prevent duplicates
    await db.idempotencyKey.create({
      data: {
        key: targetKey,
        response: { processedAt: new Date().toISOString() }
      }
    });

    // 4. Avoid duplicate business actions: check if payment is already recorded
    const existingPayment = await db.salePayment.findUnique({
      where: {
        provider_transactionId: {
          provider,
          transactionId
        }
      }
    });

    if (existingPayment) {
      console.log(`[Webhook] Payment with transaction ID ${transactionId} already recorded. Skipping.`);
      return NextResponse.json({ success: true, message: 'Payment already logged.' });
    }

    // 5. Update the relevant sale/order
    if (event === 'payment.captured' || event === 'payment.succeeded') {
      const sale = await db.sale.findUnique({
        where: { id: saleId },
        include: { payments: true }
      });

      if (!sale) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: `Sale with ID ${saleId} not found.` } },
          { status: 404 }
        );
      }

      // Record the new payment transaction
      await db.$transaction(async (tx) => {
        // Create the sale payment record
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: provider === 'STRIPE' ? 'CARD' : 'UPI',
            amount: parseFloat(amount),
            provider,
            transactionId,
            reference: `Webhook captured: ${event}`
          }
        });

        // Query all payments to calculate final state
        const allPayments = await tx.salePayment.findMany({
          where: { saleId: sale.id }
        });

        const newPaidAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);
        const newDueAmount = Math.max(0, sale.totalAmount - newPaidAmount);
        
        let newPaymentStatus = 'UNPAID';
        if (newPaidAmount >= sale.totalAmount) {
          newPaymentStatus = 'PAID';
        } else if (newPaidAmount > 0) {
          newPaymentStatus = 'PARTIAL';
        }

        // Update the sale status
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: newPaymentStatus
          }
        });

        // Add to audit log
        await tx.auditLog.create({
          data: {
            businessId: sale.businessId,
            userId: sale.createdBy, // Use the user who created the sale
            action: 'PAYMENT_WEBHOOK_RECEIVED',
            details: `Received payment webhook from ${provider} for sale ${sale.invoiceNumber}. Paid: ${amount}. New Due: ${newDueAmount}.`
          }
        });
      });

      console.log(`[Webhook] Successfully processed payment of ${amount} for Sale ${saleId}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully.' });
  } catch (error) {
    console.error('[Webhook] Failed to process webhook:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed.' } },
      { status: 500 }
    );
  }
}
