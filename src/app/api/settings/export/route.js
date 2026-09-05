import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing.' }, { status: 400 });
    }

    console.log(`[Export] Starting full tenant data export for business: ${businessId}`);

    // Query all tables associated with the business
    const [
      business,
      categories,
      products,
      inventory,
      customers,
      suppliers,
      sales,
      purchaseOrders,
      auditLogs
    ] = await Promise.all([
      db.business.findUnique({ where: { id: businessId } }),
      db.category.findMany({ where: { businessId } }),
      db.product.findMany({ where: { businessId }, include: { inventory: true, variants: true } }),
      db.inventory.findMany({ where: { businessId } }),
      db.customer.findMany({ where: { businessId }, include: { ledgers: true } }),
      db.supplier.findMany({ where: { businessId }, include: { ledgers: true } }),
      db.sale.findMany({ where: { businessId }, include: { items: true, payments: true } }),
      db.purchaseOrder.findMany({ where: { businessId }, include: { items: true, payments: true } }),
      db.auditLog.findMany({ where: { businessId } })
    ]);

    // Construct export bundle
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      businessId,
      version: '1.0',
      data: {
        business,
        categories,
        products,
        inventory,
        customers,
        suppliers,
        sales,
        purchaseOrders,
        auditLogs
      }
    };

    // Log the export event
    await db.auditLog.create({
      data: {
        businessId,
        userId: userId || businessId,
        action: 'DATA_EXPORTED',
        details: `Full business data backup downloaded. Exporter: ${userId || 'Owner'}`
      }
    });

    const fileName = `kiranaos_export_${businessId}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('[Export] Tenant export failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate data export.' }, { status: 500 });
  }
}
