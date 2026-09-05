import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:products');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = { businessId: auth.businessId };

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

    const products = await db.product.findMany({
      where,
      include: { category: true, inventory: true },
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    });

    const total = await db.product.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: { total, pages: Math.ceil(total / limit), page, limit }
      }
    });
  } catch (error) {
    console.error('v1 products GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request, 'write:products');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { name, categoryId, purchasePrice, sellingPrice, taxRate, unit, sku, barcode, brand, description } = payload;

    if (!name || !categoryId) {
      return NextResponse.json({ success: false, error: { message: 'Product name and categoryId are required.' } }, { status: 400 });
    }

    // Uniqueness validation on sku
    if (sku) {
      const existingSku = await db.product.findFirst({
        where: { businessId: auth.businessId, sku }
      });
      if (existingSku) {
        return NextResponse.json({ success: false, error: { message: `SKU '${sku}' is already in use.` } }, { status: 409 });
      }
    }

    // Uniqueness validation on barcode
    if (barcode) {
      const existingBarcode = await db.product.findFirst({
        where: { businessId: auth.businessId, barcode }
      });
      if (existingBarcode) {
        return NextResponse.json({ success: false, error: { message: `Barcode '${barcode}' is already in use.` } }, { status: 409 });
      }
    }

    // Create product
    const product = await db.product.create({
      data: {
        businessId: auth.businessId,
        categoryId,
        name,
        brand,
        description,
        sku,
        barcode,
        purchasePrice: parseFloat(purchasePrice || '0'),
        sellingPrice: parseFloat(sellingPrice || '0'),
        taxRate: parseFloat(taxRate || '0'),
        unit: unit || 'piece',
        inventory: {
          create: {
            businessId: auth.businessId,
            quantity: 0
          }
        }
      },
      include: { inventory: true }
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('v1 products POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
