import { db } from '@/lib/db';
import { checkoutSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const method = searchParams.get('method') || '';
    const cashierId = searchParams.get('cashierId') || '';
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    const where = {
      businessId,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (method) {
      where.payments = {
        some: {
          method,
        },
      };
    }

    if (cashierId) {
      where.createdBy = cashierId;
    }

    // Date range filters
    if (startDateStr || endDateStr) {
      where.createdAt = {};
      if (startDateStr) {
        where.createdAt.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          user: { select: { name: true } },
          payments: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sales,
        meta: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Fetch sales error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve sales records.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const body = await request.json();

    // Validate body payload
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { customerId, items, payments, discountAmount } = parsed.data;

    // Run transaction
    const result = await db.$transaction(async (tx) => {
      
      // 1. Generate Sequenced Invoice Number
      let seq = await tx.invoiceSequence.upsert({
        where: { businessId },
        update: { nextValue: { increment: 1 } },
        create: { businessId, nextValue: 2, prefix: 'INV-YYYY-' }
      });
      
      const currentVal = seq.nextValue - 1;
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(currentVal).padStart(6, '0')}`;

      // 2. Fetch and Validate all Products in Cart
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: {
          id: { in: productIds },
          businessId,
          isActive: true
        },
        include: {
          inventory: true
        }
      });

      const productMap = {};
      dbProducts.forEach(p => {
        productMap[p.id] = p;
      });

      // Accumulator totals
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      const saleItemsToCreate = [];

      // Validate stock levels and compute totals
      for (const item of items) {
        const prod = productMap[item.productId];
        if (!prod) {
          throw new Error(`Product not found or inactive: ID ${item.productId}`);
        }

        const currentQty = prod.inventory?.quantity || 0;
        if (currentQty < item.quantity) {
          const err = new Error(`Only ${currentQty} units of "${prod.name}" are available.`);
          err.code = 'INSUFFICIENT_STOCK';
          err.details = { productId: prod.id, name: prod.name, available: currentQty, requested: item.quantity };
          throw err;
        }

        const lineSubtotal = prod.sellingPrice * item.quantity;
        const lineTaxable = lineSubtotal - item.discountAmount;
        if (lineTaxable < 0) {
          throw new Error(`Line discount for "${prod.name}" cannot exceed subtotal amount.`);
        }

        const lineTax = lineTaxable * (prod.taxRate / 100);
        const lineTotal = lineTaxable + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += lineTax;

        saleItemsToCreate.push({
          productId: prod.id,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          barcodeSnapshot: prod.barcode,
          quantity: item.quantity,
          unitPrice: prod.sellingPrice,
          discountAmount: item.discountAmount,
          taxRate: prod.taxRate,
          taxAmount: lineTax,
          lineTotal
        });
      }

      // Check Cashier discount limit (Max 10% of subtotal)
      const totalDiscount = discountAmount + items.reduce((sum, i) => sum + i.discountAmount, 0);
      if (userRole === 'CASHIER' && calculatedSubtotal > 0 && (totalDiscount / calculatedSubtotal) > 0.1) {
        const err = new Error('Cashiers are limited to a maximum 10% checkout discount. Please seek manager authorization.');
        err.code = 'ROLE_LIMIT_EXCEEDED';
        throw err;
      }

      const taxableAmount = calculatedSubtotal - discountAmount;
      if (taxableAmount < 0) {
        throw new Error('Cart discount cannot exceed subtotal amount.');
      }
      
      const taxAmount = calculatedTax; // Re-use line computed taxes
      const totalAmount = taxableAmount + taxAmount;

      // Settle Credit Payments validations
      let totalPaid = 0;
      let totalCredit = 0;
      
      payments.forEach(pay => {
        if (pay.method === 'CREDIT') {
          totalCredit += pay.amount;
        } else {
          totalPaid += pay.amount;
        }
      });

      if (totalCredit > 0 && !customerId) {
        const err = new Error('Select a customer before creating a credit sale.');
        err.code = 'CREDIT_CUSTOMER_REQUIRED';
        throw err;
      }

      let customerRecord = null;
      if (customerId) {
        customerRecord = await tx.customer.findUnique({
          where: { id: customerId }
        });
        if (!customerRecord) {
          throw new Error('The selected customer could not be found.');
        }
      }

      // Deduct outstanding cash returns calculations
      const changeDue = Math.max(0, (totalPaid + totalCredit) - totalAmount);
      const actualPaidAmount = Math.min(totalPaid, totalAmount);
      const dueAmount = Math.max(0, totalAmount - (actualPaidAmount + totalCredit));

      // Calculate Payment statuses
      let paymentStatus = 'PAID';
      if (totalCredit > 0 || dueAmount > 0) {
        paymentStatus = (actualPaidAmount + totalCredit) > 0 ? 'PARTIAL' : 'UNPAID';
      }

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          businessId,
          invoiceNumber,
          customerId: customerId || null,
          subtotal: calculatedSubtotal,
          discountAmount,
          taxableAmount,
          taxAmount,
          totalAmount,
          paidAmount: actualPaidAmount,
          dueAmount: dueAmount + totalCredit, // due matches remaining balance
          status: 'COMPLETED',
          paymentStatus,
          createdBy: userId
        }
      });

      // 4. Create SaleItems linked rows
      for (const item of saleItemsToCreate) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            barcodeSnapshot: item.barcodeSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal
          }
        });

        // 5. Decrement Inventory quantities and log SALE history
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });

        await tx.inventoryTransaction.create({
          data: {
            businessId,
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            referenceType: 'SALE',
            referenceId: sale.id,
            note: `POS checkout invoice #${invoiceNumber}`,
            createdBy: userId
          }
        });
      }

      // 6. Create Sale Payments split tracks
      for (const pay of payments) {
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: pay.method,
            amount: pay.amount,
            reference: pay.reference || null
          }
        });
      }

      // 7. Settle Customer Credit Ledger
      if (totalCredit > 0 && customerRecord) {
        const customerAfterCredit = customerRecord.outstandingCredit + totalCredit;
        
        await tx.customer.update({
          where: { id: customerId },
          data: { outstandingCredit: { increment: totalCredit } }
        });

        await tx.customerLedger.create({
          data: {
            businessId,
            customerId,
            type: 'CREDIT',
            amount: totalCredit,
            balanceAfter: customerAfterCredit,
            referenceType: 'SALE',
            referenceId: sale.id,
            note: `Store credit invoice #${invoiceNumber}`,
            createdBy: userId
          }
        });
      }

      // 8. Log system Audit log
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'SALE_CREATED',
          details: `Invoice #${invoiceNumber} completed for total ${totalAmount}. User: ${userId}`
        }
      });

      return {
        sale,
        invoiceNumber,
        change: changeDue
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('POS Checkout failed:', error);
    
    // Check specific custom codes to map user-facing warnings cleanly
    if (error.code === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_STOCK', message: error.message, details: error.details } },
        { status: 409 }
      );
    }
    if (error.code === 'ROLE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { success: false, error: { code: 'ROLE_LIMIT_EXCEEDED', message: error.message } },
        { status: 403 }
      );
    }
    if (error.code === 'CREDIT_CUSTOMER_REQUIRED') {
      return NextResponse.json(
        { success: false, error: { code: 'CREDIT_CUSTOMER_REQUIRED', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'CHECKOUT_ERROR', message: error.message || 'Failed to complete checkout transaction.' } },
      { status: 500 }
    );
  }
}
