import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const brand = searchParams.get('brand') || '';
    
    const where = {
      businessId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }
    
    if (status === 'INACTIVE') {
      where.isActive = false;
    } else {
      where.isActive = true;
      if (status === 'OUT_OF_STOCK') {
        where.inventory = { quantity: { lte: 0 } };
      } else if (status === 'LOW_STOCK') {
        const results = await db.$queryRaw`
          SELECT "productId" FROM "Inventory" 
          WHERE "quantity" > 0 AND "quantity" <= "lowStockThreshold" AND "businessId" = ${businessId}
        `;
        where.id = { in: results.map(r => r.productId) };
      } else if (status === 'IN_STOCK') {
        const results = await db.$queryRaw`
          SELECT "productId" FROM "Inventory" 
          WHERE "quantity" > "lowStockThreshold" AND "businessId" = ${businessId}
        `;
        where.id = { in: results.map(r => r.productId) };
      }
    }
    
    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        inventory: true
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Export products error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve products list for export.' } },
      { status: 500 }
    );
  }
}
