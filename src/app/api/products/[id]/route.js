import { db } from '@/lib/db';
import { productEditSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;
    
    const product = await db.product.findFirst({
      where: { id, businessId },
      include: {
        category: true,
        inventory: true,
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch product details.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;
    const body = await request.json();
    
    const result = productEditSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid product details.', details: result.error.flatten() } },
        { status: 400 }
      );
    }
    
    const product = await db.product.findFirst({
      where: { id, businessId }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } },
        { status: 404 }
      );
    }
    
    const {
      name, brand, categoryId, description, sku, barcode, unit, imageUrl, isActive,
      purchasePrice, sellingPrice, taxRate, lowStockThreshold, reorderQuantity
    } = result.data;
    
    if (sku && sku !== product.sku) {
      const existingSku = await db.product.findUnique({
        where: { businessId_sku: { businessId, sku } }
      });
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_SKU', message: `SKU "${sku}" is already assigned to another product.` } },
          { status: 409 }
        );
      }
    }
    
    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await db.product.findUnique({
        where: { businessId_barcode: { businessId, barcode } }
      });
      if (existingBarcode) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_BARCODE', message: `Barcode "${barcode}" is already assigned to another product.` } },
          { status: 409 }
        );
      }
    }
    
    const updatedProduct = await db.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
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
          isActive
        }
      });
      
      await tx.inventory.update({
        where: { productId: id },
        data: {
          lowStockThreshold,
          reorderQuantity
        }
      });
      
      return p;
    });
    
    return NextResponse.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update product details.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;
    
    const product = await db.product.findFirst({
      where: { id, businessId }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } },
        { status: 404 }
      );
    }
    
    const updated = await db.product.update({
      where: { id },
      data: { isActive: false }
    });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Product deactivated successfully.', product: updated }
    });
  } catch (error) {
    console.error('Deactivate product error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to deactivate product.' } },
      { status: 500 }
    );
  }
}
