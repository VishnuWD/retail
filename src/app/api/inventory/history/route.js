import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || '';
    const userId = searchParams.get('userId') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;
    
    const where = {
      businessId
    };
    
    if (type) {
      where.type = type;
    }
    
    if (userId) {
      where.createdBy = userId;
    }
    
    if (search) {
      where.product = {
        name: { contains: search, mode: 'insensitive' }
      };
    }
    
    const logs = await db.inventoryTransaction.findMany({
      where,
      include: {
        product: true,
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    const total = await db.inventoryTransaction.count({ where });
    
    return NextResponse.json({
      success: true,
      data: {
        logs,
        meta: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Fetch transaction ledger error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch inventory ledger history logs.' } },
      { status: 500 }
    );
  }
}
