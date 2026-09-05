export class AccountingProvider {
  constructor(providerName = 'ZOHO', config = {}) {
    this.providerName = providerName.toUpperCase();
    this.config = config;
  }

  // Live background sync - should never block main sale/inventory flows
  async syncSale(sale) {
    try {
      console.log(`[Accounting - ${this.providerName}] Syncing sale ${sale.invoiceNumber || sale.id}`);
      // Simulate real API sync delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, externalRef: `${this.providerName.toLowerCase()}_sale_${Math.random().toString(36).substring(2, 10)}` };
    } catch (error) {
      console.error(`[Accounting - ${this.providerName}] Failed to sync sale ${sale.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  async syncInventoryChange(productId, delta, newQty) {
    try {
      console.log(`[Accounting - ${this.providerName}] Syncing stock change for product ${productId}. Delta: ${delta}`);
      return { success: true };
    } catch (error) {
      console.error(`[Accounting - ${this.providerName}] Failed to sync inventory change:`, error);
      return { success: false, error: error.message };
    }
  }

  // Manual export builders (CSV/Excel payload generators)
  generateTallyXML(sales = [], products = []) {
    console.log(`[Accounting - Tally] Generating XML payload for manual import`);
    return `<?xml version="1.0"?><ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><TYPE>Sales</TYPE>${sales.map(s => `<SALE><INVOICE>${s.invoiceNumber}</INVOICE><AMOUNT>${s.totalAmount}</AMOUNT></SALE>`).join('')}</TALLYMESSAGE></IMPORTDATA></BODY></ENVELOPE>`;
  }

  generateCSV(records = [], type = 'sales') {
    if (records.length === 0) return '';
    const headers = Object.keys(records[0]);
    const rows = records.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}
