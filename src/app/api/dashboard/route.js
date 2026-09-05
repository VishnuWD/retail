import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    
    // Today's range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Fetch today's completed sales
    const todaySales = await db.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    let todayRevenue = 0;
    let todayProfit = 0;
    let todayItemsSold = 0;
    const todayTransactions = todaySales.length;

    todaySales.forEach(sale => {
      todayRevenue += sale.totalAmount;
      sale.items.forEach(item => {
        todayItemsSold += item.quantity;
        const purchaseCost = item.product?.purchasePrice || item.unitPrice * 0.8; // Fallback to 80% if product was deleted
        const lineCost = purchaseCost * item.quantity;
        todayProfit += (item.lineTotal - lineCost);
      });
    });

    // Subtract general cart-wide discounts from profit
    const totalCartDiscounts = todaySales.reduce((sum, s) => sum + s.discountAmount, 0);
    todayProfit = Math.max(0, todayProfit - totalCartDiscounts);
    
    // Low stock count (active products only)
    const lowStockCountResults = await db.$queryRaw`
      SELECT COUNT(*) as count FROM "Inventory" i
      JOIN "Product" p ON i."productId" = p.id
      WHERE i."quantity" > 0 AND i."quantity" <= i."lowStockThreshold" 
      AND p."isActive" = true AND i."businessId" = ${businessId}
    `;
    const lowStockCount = Number(lowStockCountResults[0]?.count || 0);

    const outOfStockCount = await db.inventory.count({
      where: {
        businessId,
        quantity: { lte: 0 },
        product: { isActive: true }
      }
    });
    
    const totalProducts = await db.product.count({
      where: { businessId, isActive: true }
    });
    
    const totalUnitsResult = await db.inventory.aggregate({
      where: { businessId, product: { isActive: true } },
      _sum: { quantity: true }
    });
    const totalUnits = totalUnitsResult._sum.quantity || 0;
    
    // Inventory Asset value based on purchase cost
    const inventories = await db.inventory.findMany({
      where: { businessId, product: { isActive: true } },
      include: { product: true }
    });
    
    let inventoryValue = 0;
    inventories.forEach(inv => {
      inventoryValue += inv.quantity * inv.product.purchasePrice;
    });

    // Calculate real outstanding credit from customer table
    const creditAggregate = await db.customer.aggregate({
      where: { businessId },
      _sum: { outstandingCredit: true }
    });
    const outstandingCredit = creditAggregate._sum.outstandingCredit || 0.0;
    
    // Weekly Sales Trend (7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      const daySales = await db.sale.findMany({
        where: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      let dayRevenue = 0;
      let dayProfit = 0;
      let dayCartDiscounts = 0;

      daySales.forEach(sale => {
        dayRevenue += sale.totalAmount;
        dayCartDiscounts += sale.discountAmount;
        sale.items.forEach(item => {
          const purchaseCost = item.product?.purchasePrice || item.unitPrice * 0.8;
          dayProfit += (item.lineTotal - (purchaseCost * item.quantity));
        });
      });
      
      dayProfit = Math.max(0, dayProfit - dayCartDiscounts);

      chartData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayRevenue,
        profit: dayProfit
      });
    }
    
    // Top-selling items last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const topSalesGroup = await db.saleItem.groupBy({
      by: ['productId', 'productNameSnapshot'],
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });
    
    const topSelling = topSalesGroup.map(group => ({
      id: group.productId,
      name: group.productNameSnapshot,
      sold: group._sum.quantity || 0
    }));
    
    // Low stock catalog items
    const lowStockIdsResult = await db.$queryRaw`
      SELECT "productId" FROM "Inventory" 
      WHERE "quantity" > 0 AND "quantity" <= "lowStockThreshold" AND "businessId" = ${businessId}
      LIMIT 5
    `;
    const lowStockIds = lowStockIdsResult.map(r => r.productId);
    const lowStockDetails = await db.inventory.findMany({
      where: {
        productId: { in: lowStockIds }
      },
      include: {
        product: true
      }
    });
    
    // Recent logs activity stream
    const recentActivity = await db.inventoryTransaction.findMany({
      where: { businessId },
      include: {
        product: true,
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
    
    return NextResponse.json({
      success: true,
      data: {
        todaySales: todayRevenue,
        todayProfit: todayProfit,
        itemsSold: todayItemsSold,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        totalProducts,
        totalUnits,
        inventoryValue,
        outstandingCredit,
        chartData,
        topSelling,
        lowStockDetails: lowStockDetails.map(i => ({
          id: i.product.id,
          name: i.product.name,
          stock: i.quantity,
          threshold: i.lowStockThreshold,
          reorderQty: i.reorderQuantity
        })),
        recentActivity: recentActivity.map(a => {
          let label = 'Stock adjusted';
          if (a.type === 'SALE') label = 'Sale completed';
          else if (a.type === 'PURCHASE') label = 'Purchase logged';
          else if (a.type === 'OPENING_STOCK') label = 'Opening stock initialized';
          else if (a.type === 'DAMAGE') label = 'Damaged items written off';
          else if (a.type === 'LOSS') label = 'Stock loss recorded';
          else if (a.type === 'SALE_RETURN') label = 'Customer return processed';
          
          return {
            id: a.id,
            action: label,
            productName: a.product.name,
            qty: a.quantity,
            user: a.user.name,
            time: a.createdAt
          };
        })
      }
    });
  } catch (error) {
    console.error('Fetch dashboard metrics failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to compile dashboard metrics.' } },
      { status: 500 }
    );
  }
}
