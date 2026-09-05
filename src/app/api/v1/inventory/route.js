import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-api-key';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await validateApiKey(request, 'read:inventory');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status'); // LOW_STOCK, OUT_OF_STOCK

    const where = { businessId: auth.businessId };

    if (productId) {
      where.productId = productId;
    }

    if (status === 'OUT_OF_STOCK') {
      where.quantity = { lte: 0 };
    }

    const inventory = await db.inventory.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true, barcode: true }
        }
      }
    });

    // Apply low stock filter locally if requested (handles custom thresholds)
    let filtered = inventory;
    if (status === 'LOW_STOCK') {
      filtered = inventory.filter(i => i.quantity > 0 && i.quantity <= i.lowStockThreshold);
    }

    return NextResponse.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    console.error('v1 inventory GET error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request, 'write:inventory');
  if (!auth.success) {
    return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { productId, quantity, type, note } = payload; // type: ADJUSTMENT, DAMAGE, LOSS, OPENING_STOCK

    if (!productId || quantity === undefined || !type) {
      return NextResponse.json({ success: false, error: { message: 'productId, quantity, and adjustment type are required.' } }, { status: 400 });
    }

    const targetProduct = await db.product.findFirst({
      where: { id: productId, businessId: auth.businessId }
    });

    if (!targetProduct) {
      return NextResponse.json({ success: false, error: { message: 'Product not found.' } }, { status: 404 });
    }

    const defaultUser = await db.user.findFirst({
      where: { businessId: auth.businessId }
    });

    if (!defaultUser) {
      return NextResponse.json({ success: false, error: { message: 'No authorized staff found for this business context.' } }, { status: 400 });
    }

    // Perform transaction adjustment
    const updatedInventory = await db.$transaction(async (tx) => {
      // Find inventory
      const inv = await tx.inventory.findUnique({
        where: { productId }
      });

      if (!inv) {
        throw new Error('Inventory record not found.');
      }

      // Calculate quantity delta
      const prevQty = inv.quantity;
      const adjustmentValue = parseInt(quantity);
      const newQty = prevQty + adjustmentValue;

      if (newQty < 0) {
        throw new Error('Adjustment cannot result in negative stock.');
      }

      // Update inventory count
      const updated = await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: newQty }
      });

      // Record inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          businessId: auth.businessId,
          productId,
          type,
          quantity: adjustmentValue,
          note,
          createdBy: defaultUser.id
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, data: updatedInventory });
  } catch (error) {
    console.error('v1 inventory POST error:', error);
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
  }
}
