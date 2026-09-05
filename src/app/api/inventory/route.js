import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;
    
    const where = {
      businessId,
    };
    
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    
    if (status === 'OUT_OF_STOCK') {
      where.quantity = { lte: 0 };
    } else if (status === 'LOW_STOCK') {
      const results = await db.$queryRaw`
        SELECT id FROM "Inventory" 
        WHERE "quantity" > 0 AND "quantity" <= "lowStockThreshold" AND "businessId" = ${businessId}
      `;
      const ids = results.map(r => r.id);
      where.id = { in: ids };
    } else if (status === 'IN_STOCK') {
      const results = await db.$queryRaw`
        SELECT id FROM "Inventory" 
        WHERE "quantity" > "lowStockThreshold" AND "businessId" = ${businessId}
      `;
      const ids = results.map(r => r.id);
      where.id = { in: ids };
    }
    
    const inventories = await db.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    });
    
    const total = await db.inventory.count({ where });
    
    return NextResponse.json({
      success: true,
      data: {
        inventories,
        meta: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Fetch inventory logs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch inventory logs.' } },
      { status: 500 }
    );
  }
}
