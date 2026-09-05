import { db } from '@/lib/db';
import { productSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || ''; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK, INACTIVE
    const brand = searchParams.get('brand') || '';
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;
    
    // Base where filters
    const where = {
      businessId: businessId,
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
    
    // Filter by stock status using sub-queries for performance
    if (status === 'INACTIVE') {
      where.isActive = false;
    } else {
      where.isActive = true;
      
      if (status === 'OUT_OF_STOCK') {
        where.inventory = {
          quantity: { lte: 0 }
        };
      } else if (status === 'LOW_STOCK') {
        const lowStockInventories = await db.inventory.findMany({
          where: {
            businessId,
            quantity: { gt: 0 }
          },
          select: {
            productId: true,
            quantity: true,
            lowStockThreshold: true
          }
        });
        const productIds = lowStockInventories
          .filter(inv => inv.quantity <= inv.lowStockThreshold)
          .map(inv => inv.productId);
        where.id = { in: productIds };
      } else if (status === 'IN_STOCK') {
        const inStockInventories = await db.inventory.findMany({
          where: {
            businessId
          },
          select: {
            productId: true,
            quantity: true,
            lowStockThreshold: true
          }
        });
        const productIds = inStockInventories
          .filter(inv => inv.quantity > inv.lowStockThreshold)
          .map(inv => inv.productId);
        where.id = { in: productIds };
      }
    }
    
    // Query records with count
    const products = await db.product.findMany({
      where: where,
      include: {
        category: true,
        inventory: true,
      },
      orderBy: sort === 'stock' 
        ? { inventory: { quantity: order } }
        : { [sort]: order },
      skip: skip,
      take: limit,
    });
    
    const total = await db.product.count({ where });
    
    return NextResponse.json({
      success: true,
      data: {
        products,
        meta: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch product catalog.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    
    const result = productSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid product details.', details: result.error.flatten() } },
        { status: 400 }
      );
    }
    
    const {
      name, brand, categoryId, description, sku, barcode, unit, imageUrl,
      purchasePrice, sellingPrice, taxRate, openingStock, lowStockThreshold, reorderQuantity
    } = result.data;
    
    // Check exact SKU or Barcode duplicates within the same business
    if (sku) {
      const existingSku = await db.product.findUnique({
        where: { businessId_sku: { businessId, sku } }
      });
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_SKU', message: `A product with SKU "${sku}" already exists.` } },
          { status: 409 }
        );
      }
    }
    
    if (barcode) {
      const existingBarcode = await db.product.findUnique({
        where: { businessId_barcode: { businessId, barcode } }
      });
      if (existingBarcode) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_BARCODE', message: `A product with barcode "${barcode}" already exists.` } },
          { status: 409 }
        );
      }
    }
    
    // Check similar name/brand duplicate warning (can be overridden with forceCreate)
    const forceCreate = body.forceCreate === true;
    if (!forceCreate) {
      const normalizedName = name.trim().toLowerCase();
      const existingSimilar = await db.product.findFirst({
        where: {
          businessId,
          name: { equals: name.trim(), mode: 'insensitive' },
          brand: brand ? { equals: brand.trim(), mode: 'insensitive' } : null
        }
      });
      
      if (existingSimilar) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'DUPLICATE_WARNING',
            message: `A product named "${name}"${brand ? ` by "${brand}"` : ''} already exists. Do you want to create it anyway?`,
            existingProduct: {
              id: existingSimilar.id,
              name: existingSimilar.name,
              sku: existingSimilar.sku,
              barcode: existingSimilar.barcode
            }
          }
        }, { status: 409 });
      }
    }
    
    // Execute creation inside a database transaction
    const newProduct = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId,
          categoryId,
          name: name.trim(),
          brand: brand ? brand.trim() : null,
          description: description ? description.trim() : null,
          sku: sku ? sku.trim() : null,
          barcode: barcode ? barcode.trim() : null,
          unit,
          imageUrl: imageUrl || null,
          purchasePrice,
          sellingPrice,
          taxRate,
          isActive: true
        }
      });
      
      await tx.inventory.create({
        data: {
          businessId,
          productId: product.id,
          quantity: openingStock,
          lowStockThreshold,
          reorderQuantity
        }
      });
      
      if (openingStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            businessId,
            productId: product.id,
            type: 'OPENING_STOCK',
            quantity: openingStock,
            note: 'Initial opening stock receipt',
            createdBy: userId
          }
        });
      }
      
      return product;
    });
    
    return NextResponse.json({
      success: true,
      data: newProduct
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message || 'Failed to create product record.' } },
      { status: 500 }
    );
  }
}
