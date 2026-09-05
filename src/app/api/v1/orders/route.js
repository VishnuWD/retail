import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:sales');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = { businessId: auth.businessId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        customer: true,
        items: true,
        payments: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await db.sale.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: { total, pages: Math.ceil(total / limit), page, limit }
      }
    });
  } catch (error) {
    console.error('v1 orders GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request, 'write:sales');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { customerId, items, payments = [], discountAmount = 0 } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'Cart items are required.' } }, { status: 400 });
    }

    const defaultUser = await db.user.findFirst({
      where: { businessId: auth.businessId }
    });

    if (!defaultUser) {
      return NextResponse.json({ success: false, error: { message: 'No authorized staff found for this business context.' } }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Generate sequence invoice number
      const seq = await tx.invoiceSequence.upsert({
        where: { businessId: auth.businessId },
        update: { nextValue: { increment: 1 } },
        create: { businessId: auth.businessId, nextValue: 2, prefix: 'INV-YYYY-' }
      });
      
      const currentVal = seq.nextValue - 1;
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(currentVal).padStart(6, '0')}`;

      // 2. Fetch and Validate all Products in Cart
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, businessId: auth.businessId, isActive: true },
        include: { inventory: true }
      });

      const productMap = {};
      dbProducts.forEach(p => { productMap[p.id] = p; });

      let subtotal = 0;
      let taxAmount = 0;
      const saleItemsToCreate = [];

      for (const item of items) {
        const product = productMap[item.productId];
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const quantity = parseInt(item.quantity);
        if (quantity <= 0) {
          throw new Error(`Invalid quantity ${quantity} for product ${product.name}`);
        }

        // Check Inventory
        if (!product.inventory || product.inventory.quantity < quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.inventory?.quantity || 0}`);
        }

        // Calculate pricing
        const unitPrice = product.sellingPrice;
        const lineTotalBeforeTax = unitPrice * quantity;
        const itemDiscount = parseFloat(item.discountAmount || '0');
        const lineTaxable = Math.max(0, lineTotalBeforeTax - itemDiscount);
        const itemTax = lineTaxable * (product.taxRate / 100);
        const lineTotal = lineTaxable + itemTax;

        subtotal += lineTaxable;
        taxAmount += itemTax;

        saleItemsToCreate.push({
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          barcodeSnapshot: product.barcode,
          quantity,
          unitPrice,
          discountAmount: itemDiscount,
          taxRate: product.taxRate,
          taxAmount: itemTax,
          lineTotal
        });

        // Deduct inventory
        await tx.inventory.update({
          where: { productId: product.id },
          data: { quantity: { decrement: quantity } }
        });

        // Record stock transaction
        await tx.inventoryTransaction.create({
          data: {
            businessId: auth.businessId,
            productId: product.id,
            type: 'SALE',
            quantity: -quantity,
            note: `API Sale checkout invoice #${invoiceNumber}`,
            createdBy: defaultUser.id
          }
        });
      }

      // Compute total invoice totals
      const totalAmount = Math.max(0, subtotal - parseFloat(discountAmount || '0')) + taxAmount;
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
      const dueAmount = Math.max(0, totalAmount - totalPaid);

      let paymentStatus = 'UNPAID';
      if (totalPaid >= totalAmount) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          businessId: auth.businessId,
          invoiceNumber,
          customerId: customerId || null,
          subtotal,
          discountAmount: parseFloat(discountAmount || '0'),
          taxableAmount: subtotal,
          taxAmount,
          totalAmount,
          paidAmount: totalPaid,
          dueAmount,
          paymentStatus,
          createdBy: defaultUser.id,
          items: { create: saleItemsToCreate },
          payments: {
            create: payments.map(p => ({
              method: p.method || 'CASH',
              amount: parseFloat(p.amount),
              reference: p.reference
            }))
          }
        },
        include: { items: true, payments: true }
      });

      // 4. Update Customer Udhaar Ledger (if credit sale)
      if (customerId && dueAmount > 0) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error('Customer record not found.');

        const newCreditBalance = customer.outstandingCredit + dueAmount;
        await tx.customer.update({
          where: { id: customerId },
          data: { outstandingCredit: newCreditBalance }
        });

        await tx.customerLedger.create({
          data: {
            businessId: auth.businessId,
            customerId,
            type: 'CREDIT',
            amount: dueAmount,
            balanceAfter: newCreditBalance,
            referenceType: 'SALE',
            referenceId: sale.id,
            note: `Store credit API invoice #${invoiceNumber}`,
            createdBy: defaultUser.id
          }
        });
      }

      // 5. Add Audit Log
      await tx.auditLog.create({
        data: {
          businessId: auth.businessId,
          userId: defaultUser.id,
          action: 'SALE_CREATED_API',
          details: `API Invoice #${invoiceNumber} completed for total ${totalAmount}.`
        }
      });

      return sale;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('v1 orders POST error:', error);
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
  }
}
