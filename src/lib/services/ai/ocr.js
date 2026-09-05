import { db } from '@/lib/db';
import { AIProvider } from './AIProvider';

const ai = new AIProvider();

/**
 * Simulates receiving an invoice image/PDF, performing OCR and AI extraction,
 * and saving a pending review record for the business owner.
 * @param {string} invoiceUrl 
 * @param {string} businessId 
 */
export async function processSupplierInvoice(invoiceUrl, businessId) {
  try {
    console.log(`[OCR Service] Starting processing for invoice: ${invoiceUrl}`);

    // Create initial pending record
    const pendingRecord = await db.supplierInvoiceOCR.create({
      data: {
        businessId,
        status: 'PENDING',
        invoiceUrl
      }
    });

    // Run AI extraction
    const extractedData = await ai.extract(`url: ${invoiceUrl}`, {});

    // Update record to EXTRACTED with parsed payload
    const updated = await db.supplierInvoiceOCR.update({
      where: { id: pendingRecord.id },
      data: {
        status: 'EXTRACTED',
        extractedData
      }
    });

    return updated;
  } catch (error) {
    console.error('[OCR Service] Invoice processing failed:', error);
    throw new Error('Invoice extraction failed: ' + error.message);
  }
}

/**
 * Approves extracted invoice details and generates a verified Purchase Order in the system.
 * @param {string} ocrRecordId 
 * @param {string} supplierId 
 * @param {string} userId operator ID
 */
export async function approveAndGeneratePurchase(ocrRecordId, supplierId, userId) {
  try {
    const ocrRecord = await db.supplierInvoiceOCR.findUnique({
      where: { id: ocrRecordId }
    });

    if (!ocrRecord || ocrRecord.status !== 'EXTRACTED') {
      throw new Error('Invoice is not ready for review.');
    }

    const { vendor, invoiceDate, items, subtotal, taxAmount, totalAmount } = ocrRecord.extractedData;

    const newPO = await db.$transaction(async (tx) => {
      // 1. Generate sequence PO number
      // Query current PO sequence count
      const poCount = await tx.purchaseOrder.count({
        where: { businessId: ocrRecord.businessId }
      });
      const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(6, '0')}`;

      // 2. Map items to purchase items
      const poItemsToCreate = [];
      for (const item of items) {
        // Search if matching product name exists in the catalog
        const match = await tx.product.findFirst({
          where: {
            businessId: ocrRecord.businessId,
            name: { contains: item.name, mode: 'insensitive' }
          }
        });

        poItemsToCreate.push({
          productId: match ? match.id : null,
          productNameSnapshot: item.name,
          orderedQuantity: parseInt(item.quantity),
          unitCost: parseFloat(item.unitCost),
          taxRate: parseFloat(item.taxRate),
          lineTotal: parseFloat(item.total)
        });
      }

      // 3. Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          businessId: ocrRecord.businessId,
          supplierId,
          purchaseOrderNumber: poNumber,
          supplierInvoiceNumber: `OCR-${ocrRecordId.substring(0, 8).toUpperCase()}`,
          status: 'DRAFT',
          paymentStatus: 'UNPAID',
          subtotal,
          taxAmount,
          totalAmount,
          dueAmount: totalAmount,
          createdBy: userId,
          items: { create: poItemsToCreate }
        }
      });

      // Update OCR status
      await tx.supplierInvoiceOCR.update({
        where: { id: ocrRecordId },
        data: {
          status: 'REVIEWED',
          purchaseOrderId: po.id
        }
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          businessId: ocrRecord.businessId,
          userId,
          action: 'OCR_INVOICE_APPROVED',
          details: `Approved OCR invoice from ${vendor}. Created draft Purchase Order #${poNumber}.`
        }
      });

      return po;
    });

    return { success: true, purchaseOrderId: newPO.id };
  } catch (error) {
    console.error('[OCR Service] Approval confirmation failed:', error);
    throw new Error('Approval and PO generation failed: ' + error.message);
  }
}
