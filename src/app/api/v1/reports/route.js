import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:reports');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    // 1. Sales Summary
    const sales = await db.sale.findMany({
      where: {
        businessId: auth.businessId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      },
      select: { totalAmount: true, subtotal: true }
    });

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const salesCount = sales.length;

    // 2. Inventory Valuation (At Cost and At Retail)
    const inventoryItems = await db.inventory.findMany({
      where: { businessId: auth.businessId },
      include: {
        product: {
          select: { purchasePrice: true, sellingPrice: true }
        }
      }
    });

    let inventoryValuationAtCost = 0;
    let inventoryValuationAtRetail = 0;
    let totalItemsStocked = 0;

    inventoryItems.forEach(item => {
      if (item.product) {
        inventoryValuationAtCost += item.quantity * item.product.purchasePrice;
        inventoryValuationAtRetail += item.quantity * item.product.sellingPrice;
        totalItemsStocked += item.quantity;
      }
    });

    // 3. Receivables Outstanding
    const customers = await db.customer.findMany({
      where: { businessId: auth.businessId },
      select: { outstandingCredit: true }
    });

    const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingCredit, 0);

    return NextResponse.json({
      success: true,
      data: {
        reportingPeriod: { startDate, endDate },
        salesSummary: {
          totalAmount: totalSalesAmount,
          count: salesCount
        },
        inventoryValuation: {
          totalQty: totalItemsStocked,
          valuationAtCost: inventoryValuationAtCost,
          valuationAtRetail: inventoryValuationAtRetail,
          potentialMargin: inventoryValuationAtRetail - inventoryValuationAtCost
        },
        receivables: {
          totalOutstanding: totalReceivables
        }
      }
    });
  } catch (error) {
    console.error('v1 reports GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
