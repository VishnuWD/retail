import { db } from '@/lib/db';
import { purchaseOrderSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';

    const where = {
      businessId,
    };

    if (search) {
      where.OR = [
        { purchaseOrderNumber: { contains: search, mode: 'insensitive' } },
        { supplierInvoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

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

    const [purchases, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true, companyName: true } },
          user: { select: { name: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        meta: {
          page,
          pages: Math.ceil(total / limit),
          total,
        }
      }
    });
  } catch (error) {
    console.error('Fetch purchases error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve purchases.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Only OWNER, MANAGER, INVENTORY roles can register purchases
    if (userRole === 'CASHIER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cashiers are not authorized to create purchases.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = purchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { supplierId, supplierInvoiceNumber, expectedDate, purchaseDate, notes, discountAmount, items } = parsed.data;
    const autoReceive = body.autoReceive === true;

    // Run creation inside transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Verify supplier
      const supplier = await tx.supplier.findFirst({
        where: { id: supplierId, businessId }
      });
      if (!supplier) {
        throw new Error('Supplier profile not found.');
      }

      // 2. Generate PO Sequence number
      const poCount = await tx.purchaseOrder.count({ where: { businessId } });
      const year = new Date().getFullYear();
      const purchaseOrderNumber = `PO-${year}-${String(poCount + 1).padStart(6, '0')}`;

      // 3. Fetch products to verify existence
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, businessId, isActive: true },
        include: { inventory: true }
      });

      const productMap = {};
      dbProducts.forEach(p => {
        productMap[p.id] = p;
      });

      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      const itemsToCreate = [];

      for (const item of items) {
        const prod = productMap[item.productId];
        if (!prod) {
          throw new Error(`Product ID ${item.productId} not found or inactive.`);
        }

        const lineSubtotal = item.unitCost * item.orderedQuantity;
        const lineTaxable = lineSubtotal - item.discountAmount;
        if (lineTaxable < 0) {
          throw new Error(`Item discount for "${prod.name}" cannot exceed subtotal.`);
        }

        const lineTax = lineTaxable * (item.taxRate / 100);
        const lineTotal = lineTaxable + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += lineTax;

        itemsToCreate.push({
          productId: prod.id,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: autoReceive ? item.orderedQuantity : 0,
          unitCost: item.unitCost,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          taxAmount: lineTax,
          lineTotal
        });
      }

      const taxableAmount = calculatedSubtotal - discountAmount;
      if (taxableAmount < 0) {
        throw new Error('PO discount cannot exceed subtotal.');
      }

      const taxAmount = calculatedTax;
      const totalAmount = taxableAmount + taxAmount;

      // Statuses based on autoReceive
      const status = autoReceive ? 'RECEIVED' : 'ORDERED';

      // 4. Create PurchaseOrder record
      const po = await tx.purchaseOrder.create({
        data: {
          businessId,
          supplierId,
          purchaseOrderNumber,
          supplierInvoiceNumber: supplierInvoiceNumber || null,
          status,
          paymentStatus: 'UNPAID',
          subtotal: calculatedSubtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          paidAmount: 0.0,
          dueAmount: totalAmount,
          notes: notes || null,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          createdBy: userId
        }
      });

      // 5. Create Items rows and process autoReceive inventory integrations
      for (const item of itemsToCreate) {
        const poItem = await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            unitCost: item.unitCost,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal
          }
        });

        if (autoReceive) {
          // Increment stock inventory count
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { increment: item.orderedQuantity } }
          });

          // Create inventory transaction audit log
          await tx.inventoryTransaction.create({
            data: {
              businessId,
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.orderedQuantity,
              referenceType: 'PURCHASE',
              referenceId: po.id,
              note: `Auto-received stock from PO #${purchaseOrderNumber}`,
              createdBy: userId
            }
          });
        }
      }

      // 6. If autoReceive, log Credit Line in Supplier Ledger
      if (autoReceive) {
        // We compile what we owe them
        const previousOutstanding = supplier.purchaseOrders?.reduce((sum, o) => sum + o.dueAmount, 0) || 0;
        const balanceAfter = previousOutstanding + totalAmount;

        await tx.supplierLedger.create({
          data: {
            businessId,
            supplierId,
            type: 'CREDIT',
            amount: totalAmount,
            balanceAfter,
            referenceType: 'PURCHASE',
            referenceId: po.id,
            note: `Auto-received purchase PO #${purchaseOrderNumber}`,
            createdBy: userId
          }
        });
      }

      // 7. Log audit log
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'PURCHASE_CREATED',
          details: `Purchase Order #${purchaseOrderNumber} created by User: ${userId}. Auto-Receive: ${autoReceive}`
        }
      });

      return po;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create purchase order failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PURCHASE_ERROR', message: error.message || 'Failed to create purchase order.' } },
      { status: 500 }
    );
  }
}
