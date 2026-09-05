import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const { products, preview } = await request.json();
    
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Products data must be an array.' } },
        { status: 400 }
      );
    }
    
    const validItems = [];
    const invalidItems = [];
    
    // Cache categories to minimize DB calls
    const categoriesMap = {};
    const existingCats = await db.category.findMany({ where: { businessId } });
    existingCats.forEach(c => {
      categoriesMap[c.name.toLowerCase()] = c.id;
    });
    
    // Fetch existing SKUs and Barcodes to find duplicates
    const existingProducts = await db.product.findMany({
      where: { businessId },
      select: { sku: true, barcode: true, name: true }
    });
    const existingSkus = new Set(existingProducts.map(p => p.sku?.toLowerCase()).filter(Boolean));
    const existingBarcodes = new Set(existingProducts.map(p => p.barcode?.toLowerCase()).filter(Boolean));
    
    // Validate each row
    for (let index = 0; index < products.length; index++) {
      const row = products[index];
      const errors = [];
      
      const name = row.name?.trim();
      const categoryName = row.category?.trim();
      const sku = row.sku?.trim();
      const barcode = row.barcode?.trim();
      const unit = row.unit?.trim() || 'piece';
      const brand = row.brand?.trim() || null;
      
      const purchasePrice = parseFloat(row.purchasePrice);
      const sellingPrice = parseFloat(row.sellingPrice);
      const taxRate = parseFloat(row.taxRate || '0');
      const openingStock = parseInt(row.openingStock || '0');
      const lowStockThreshold = parseInt(row.lowStockThreshold || '10');
      const reorderQuantity = parseInt(row.reorderQuantity || '20');
      
      if (!name) {
        errors.push('Missing product name');
      }
      
      if (!categoryName) {
        errors.push('Missing category name');
      }
      
      if (isNaN(purchasePrice) || purchasePrice < 0) {
        errors.push('Invalid purchase price');
      }
      
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        errors.push('Invalid selling price');
      }
      
      if (sku && existingSkus.has(sku.toLowerCase())) {
        errors.push(`Duplicate SKU "${sku}" already exists`);
      }
      
      if (barcode && existingBarcodes.has(barcode.toLowerCase())) {
        errors.push(`Duplicate Barcode "${barcode}" already exists`);
      }
      
      const itemData = {
        name,
        brand,
        category: categoryName,
        sku,
        barcode,
        unit,
        purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
        sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
        taxRate: isNaN(taxRate) ? 0 : taxRate,
        openingStock: isNaN(openingStock) ? 0 : openingStock,
        lowStockThreshold: isNaN(lowStockThreshold) ? 10 : lowStockThreshold,
        reorderQuantity: isNaN(reorderQuantity) ? 20 : reorderQuantity
      };
      
      if (errors.length > 0) {
        invalidItems.push({
          row: index + 1,
          data: itemData,
          errors
        });
      } else {
        validItems.push({
          row: index + 1,
          data: itemData
        });
      }
    }
    
    // Preview Mode returns validation counts
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          preview: true,
          totalRows: products.length,
          validCount: validItems.length,
          invalidCount: invalidItems.length,
          validItems,
          invalidItems
        }
      });
    }
    
    // Import Mode executes database inserts
    let importedCount = 0;
    const errorsList = [];
    
    for (const item of validItems) {
      try {
        const { data } = item;
        
        await db.$transaction(async (tx) => {
          // Get or create category
          let categoryId = categoriesMap[data.category.toLowerCase()];
          if (!categoryId) {
            const newCat = await tx.category.create({
              data: {
                name: data.category,
                businessId,
                description: `Auto-created during bulk import`
              }
            });
            categoryId = newCat.id;
            categoriesMap[data.category.toLowerCase()] = categoryId;
          }
          
          // Create product
          const product = await tx.product.create({
            data: {
              businessId,
              categoryId,
              name: data.name,
              brand: data.brand,
              sku: data.sku || null,
              barcode: data.barcode || null,
              unit: data.unit,
              purchasePrice: data.purchasePrice,
              sellingPrice: data.sellingPrice,
              taxRate: data.taxRate,
              isActive: true
            }
          });
          
          // Create inventory
          await tx.inventory.create({
            data: {
              businessId,
              productId: product.id,
              quantity: data.openingStock,
              lowStockThreshold: data.lowStockThreshold,
              reorderQuantity: data.reorderQuantity
            }
          });
          
          // Create opening stock ledger
          if (data.openingStock > 0) {
            await tx.inventoryTransaction.create({
              data: {
                businessId,
                productId: product.id,
                type: 'OPENING_STOCK',
                quantity: data.openingStock,
                note: 'Initial import opening stock',
                createdBy: userId
              }
            });
          }
        });
        
        importedCount++;
      } catch (err) {
        console.error(`Row ${item.row} failed to import:`, err);
        errorsList.push({
          row: item.row,
          name: item.data.name,
          error: err.message || 'Database transaction error.'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        preview: false,
        totalRows: products.length,
        importedCount,
        failedCount: products.length - importedCount,
        errors: errorsList
      }
    });
  } catch (error) {
    console.error('Bulk import route error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process bulk import.' } },
      { status: 500 }
    );
  }
}
