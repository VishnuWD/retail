import { db } from '@/lib/db';
import { stockAdjustmentSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    
    // Validate inputs
    const result = stockAdjustmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid adjustment fields.', details: result.error.flatten() } },
        { status: 400 }
      );
    }
    
    const { productId, action, quantity, reason, note } = result.data;
    
    // Verify product exists within business scope
    const product = await db.product.findFirst({
      where: { id: productId, businessId },
      include: { inventory: true }
    });
    
    if (!product || !product.inventory) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product or inventory record not found.' } },
        { status: 404 }
      );
    }
    
    const currentQty = product.inventory.quantity;
    let newQty = currentQty;
    let transactionQty = quantity;
    
    if (action === 'INCREASE') {
      newQty = currentQty + quantity;
      transactionQty = quantity;
    } else if (action === 'DECREASE') {
      newQty = currentQty - quantity;
      transactionQty = -quantity; // negative in ledger to show reduction
      
      if (newQty < 0) {
        return NextResponse.json(
          { success: false, error: { code: 'NEGATIVE_STOCK_DISALLOWED', message: 'Cannot reduce stock below zero.' } },
          { status: 400 }
        );
      }
    } else if (action === 'SET') {
      newQty = quantity;
      transactionQty = quantity - currentQty; // calculate delta for transaction ledger
    }
    
    // Map transaction type enum
    let txType = 'ADJUSTMENT';
    if (reason === 'PURCHASE') txType = 'PURCHASE';
    else if (reason === 'DAMAGE') txType = 'DAMAGE';
    else if (reason === 'LOSS') txType = 'LOSS';
    else if (reason === 'OPENING_STOCK') txType = 'OPENING_STOCK';
    else if (reason === 'SALE_RETURN') txType = 'SALE_RETURN';
    
    // Perform update in a transactional unit
    const inventoryLog = await db.$transaction(async (tx) => {
      const updatedInv = await tx.inventory.update({
        where: { productId },
        data: { quantity: newQty }
      });
      
      const transaction = await tx.inventoryTransaction.create({
        data: {
          businessId,
          productId,
          type: txType,
          quantity: transactionQty,
          note: note.trim(),
          createdBy: userId,
          referenceType: 'ADJUSTMENT',
          referenceId: 'MANUAL'
        }
      });
      
      return { updatedInv, transaction };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        previousStock: currentQty,
        newStock: inventoryLog.updatedInv.quantity,
        transaction: inventoryLog.transaction
      }
    });
  } catch (error) {
    console.error('Stock adjustment transaction failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to record stock adjustment.' } },
      { status: 500 }
    );
  }
}
