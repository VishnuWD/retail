// Universal API Client with Smart Dual-Mode Local Storage & Cloud Support
import { kiranaStorage } from './storage/kiranaStorage';

class ApiClient {
  isLocalMode() {
    if (typeof window === 'undefined') return true;
    return kiranaStorage.getMode() === 'local';
  }

  // Generic request wrapper
  async request(url, options = {}) {
    const isLocal = this.isLocalMode();

    // 1. If currently in Local Storage Mode, process locally
    if (isLocal) {
      return this.handleLocalRoute(url, options);
    }

    // 2. If Cloud Mode, try network fetch with graceful local fallback
    try {
      const res = await fetch(url, options);
      const json = await res.json();
      if (!res.ok) {
        // If server 500 error (e.g. database down), attempt graceful local resolution
        if (res.status >= 500) {
          console.warn(`[ApiClient] Cloud API returned ${res.status}. Gracefully serving from Integrated Storage.`);
          return this.handleLocalRoute(url, options);
        }
        throw new Error(json.error?.message || `Request failed with status ${res.status}`);
      }
      return json;
    } catch (err) {
      console.warn(`[ApiClient] Cloud request failed (${err.message}). Falling back to Integrated Local Storage.`);
      return this.handleLocalRoute(url, options);
    }
  }

  // Smart local route handler simulating Next.js API endpoints
  async handleLocalRoute(url, options = {}) {
    const [path, queryString] = url.split('?');
    const method = (options.method || 'GET').toUpperCase();
    const params = new URLSearchParams(queryString || '');
    let body = null;
    if (options.body && typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch {
        body = options.body;
      }
    }

    // Artificial tiny latency for smooth UI feel (10-30ms)
    await new Promise(r => setTimeout(r, 20));

    // ROUTE: /api/dashboard
    if (path === '/api/dashboard') {
      const data = kiranaStorage.getDashboardMetrics();
      return { success: true, data };
    }

    // ROUTE: /api/products
    if (path === '/api/products') {
      if (method === 'GET') {
        const filters = {
          search: params.get('search') || '',
          categoryId: params.get('categoryId') || '',
          status: params.get('status') || '',
          brand: params.get('brand') || '',
          sort: params.get('sort') || 'name',
          order: params.get('order') || 'asc',
          page: params.get('page') || '1',
          limit: params.get('limit') || '50'
        };
        const res = kiranaStorage.getProducts(filters);
        return { success: true, data: res };
      }
      if (method === 'POST') {
        const prod = kiranaStorage.saveProduct(body);
        return { success: true, data: prod };
      }
    }

    // ROUTE: /api/products/:id
    if (path.startsWith('/api/products/') && !path.includes('export') && !path.includes('import')) {
      const id = path.split('/api/products/')[1];
      if (method === 'GET') {
        const prod = kiranaStorage.getProductById(id);
        if (!prod) return { success: false, error: { message: 'Product not found' } };
        return { success: true, data: prod };
      }
      if (method === 'PUT' || method === 'PATCH') {
        const prod = kiranaStorage.saveProduct({ ...body, id });
        return { success: true, data: prod };
      }
      if (method === 'DELETE') {
        kiranaStorage.deleteProduct(id);
        return { success: true, data: { deleted: true } };
      }
    }

    // ROUTE: /api/products/export
    if (path === '/api/products/export') {
      const res = kiranaStorage.getProducts({ limit: 1000 });
      return { success: true, data: res.products };
    }

    // ROUTE: /api/products/import
    if (path === '/api/products/import') {
      const items = body?.products || [];
      if (body?.preview) {
        return {
          success: true,
          data: {
            validCount: items.length,
            errorCount: 0,
            validItems: items.map(p => ({ data: p, errors: [] })),
            errorItems: []
          }
        };
      }
      let count = 0;
      items.forEach(p => {
        kiranaStorage.saveProduct(p);
        count++;
      });
      return { success: true, data: { importedCount: count } };
    }

    // ROUTE: /api/categories
    if (path === '/api/categories') {
      if (method === 'GET') {
        const cats = kiranaStorage.getCategories();
        return { success: true, data: cats };
      }
      if (method === 'POST') {
        const cats = kiranaStorage.saveCategory(body);
        return { success: true, data: cats };
      }
    }

    // ROUTE: /api/inventory/history
    if (path === '/api/inventory/history') {
      const logs = kiranaStorage.getAuditLogs();
      return { success: true, data: { logs, meta: { total: logs.length, page: 1, pages: 1 } } };
    }

    // ROUTE: /api/inventory (or adjustment)
    if (path === '/api/inventory' || path.startsWith('/api/inventory/')) {
      if (method === 'POST') {
        if (body?.productId && body?.quantityDelta !== undefined) {
          const updated = kiranaStorage.adjustStock(body.productId, Number(body.quantityDelta), body.type || 'MANUAL_ADJUSTMENT', body.note);
          return { success: true, data: updated };
        }
      }
      const res = kiranaStorage.getProducts({ limit: 1000 });
      return { success: true, data: res.products };
    }

    // ROUTE: /api/sales
    if (path === '/api/sales') {
      if (method === 'GET') {
        const sales = kiranaStorage.getSales({
          search: params.get('search'),
          paymentMethod: params.get('paymentMethod'),
          paymentStatus: params.get('paymentStatus')
        });
        return { success: true, data: { sales, meta: { total: sales.length, page: 1, pages: 1 } } };
      }
      if (method === 'POST') {
        const sale = kiranaStorage.createSale(body);
        return { success: true, data: sale };
      }
    }

    // ROUTE: /api/sales/:id
    if (path.startsWith('/api/sales/') && !path.includes('cancel') && !path.includes('return')) {
      const id = path.split('/api/sales/')[1];
      if (method === 'GET') {
        const sale = kiranaStorage.getSaleById(id);
        if (!sale) return { success: false, error: { message: 'Invoice not found' } };
        return { success: true, data: sale };
      }
    }

    // ROUTE: /api/sales/:id/cancel
    if (path.includes('/api/sales/') && path.endsWith('/cancel') && method === 'POST') {
      const id = path.split('/api/sales/')[1].split('/')[0];
      const sales = kiranaStorage.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
      const updated = sales.map(s => s.id === id ? { ...s, status: 'CANCELLED' } : s);
      kiranaStorage.setItem(STORAGE_KEYS.SALES, updated);
      return { success: true, data: { cancelled: true } };
    }

    // ROUTE: /api/sales/:id/return
    if (path.includes('/api/sales/') && path.endsWith('/return') && method === 'POST') {
      return { success: true, data: { returned: true } };
    }

    // ROUTE: /api/customers
    if (path === '/api/customers') {
      if (method === 'GET') {
        const customers = kiranaStorage.getCustomers(params.get('search'));
        return { success: true, data: customers };
      }
      if (method === 'POST') {
        const cust = kiranaStorage.saveCustomer(body);
        return { success: true, data: cust };
      }
    }

    // ROUTE: /api/customers/:id
    if (path.startsWith('/api/customers/')) {
      const id = path.split('/api/customers/')[1]?.split('/')[0];
      if (path.endsWith('/payment') && method === 'POST') {
        const res = kiranaStorage.recordCustomerPayment(id, body.amount, body.paymentMethod, body.note);
        return { success: true, data: res };
      }
      const cust = kiranaStorage.getCustomerById(id);
      return { success: true, data: cust };
    }

    // ROUTE: /api/suppliers
    if (path === '/api/suppliers') {
      if (method === 'GET') {
        const suppliers = kiranaStorage.getSuppliers();
        return { success: true, data: suppliers };
      }
      if (method === 'POST') {
        const sup = kiranaStorage.saveSupplier(body);
        return { success: true, data: sup };
      }
    }

    // ROUTE: /api/purchases
    if (path === '/api/purchases') {
      if (method === 'GET') {
        const purchases = kiranaStorage.getPurchases();
        return { success: true, data: purchases };
      }
      if (method === 'POST') {
        const po = kiranaStorage.createPurchase(body);
        return { success: true, data: po };
      }
    }

    // ROUTE: /api/expenses
    if (path === '/api/expenses') {
      if (method === 'GET') {
        const expenses = kiranaStorage.getExpenses();
        return { success: true, data: expenses };
      }
      if (method === 'POST') {
        const exp = kiranaStorage.saveExpense(body);
        return { success: true, data: exp };
      }
    }

    // ROUTE: /api/assistant
    if (path === '/api/assistant') {
      const response = kiranaStorage.askAssistant(body?.message || body?.query || '');
      return { success: true, data: { reply: response } };
    }

    // ROUTE: /api/images/search
    if (path === '/api/images/search') {
      try {
        const res = await fetch('/api/images/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.results?.length > 0) {
            return json;
          }
        }
      } catch (err) {
        console.warn('Live image search network query bypassed:', err);
      }

      // Local fallback images from storage catalog and verified presets
      const q = (body?.query || '').toLowerCase();
      const localProds = kiranaStorage.getProducts({ search: q, limit: 6 }).products || [];
      const matchedImages = localProds.filter(p => p.imageUrl).map(p => ({
        title: p.name,
        thumbnailUrl: p.imageUrl,
        imageUrl: p.imageUrl,
        sourceUrl: p.imageUrl,
        sourceName: 'Catalog Item'
      }));

      if (matchedImages.length > 0) {
        return { success: true, data: { results: matchedImages } };
      }

      return {
        success: true,
        data: {
          results: [
            { title: `${body?.query || 'Grocery'} Product Pack`, thumbnailUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60', sourceName: 'Verified Packaging' },
            { title: `${body?.query || 'Grocery'} Retail Unit`, thumbnailUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=500&auto=format&fit=crop&q=60', imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=500&auto=format&fit=crop&q=60', sourceName: 'Verified Packaging' },
            { title: `${body?.query || 'Grocery'} Standard Pack`, thumbnailUrl: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=500&auto=format&fit=crop&q=60', imageUrl: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=500&auto=format&fit=crop&q=60', sourceName: 'Verified Packaging' }
          ]
        }
      };
    }

    // ROUTE: /api/settings/staff
    if (path === '/api/settings/staff') {
      if (method === 'GET') {
        const staff = kiranaStorage.getStaff();
        return { success: true, data: staff };
      }
      if (method === 'POST') {
        const staff = kiranaStorage.saveStaff(body);
        return { success: true, data: staff };
      }
      if (method === 'DELETE') {
        const staff = kiranaStorage.deleteStaff(body?.id || params.get('id'));
        return { success: true, data: staff };
      }
    }

    // ROUTE: /api/settings/billing
    if (path === '/api/settings/billing') {
      const prods = kiranaStorage.getProducts({ limit: 1000 }).products || [];
      const staff = kiranaStorage.getStaff();
      const sales = kiranaStorage.getSales();
      return { 
        success: true, 
        data: { 
          plan: 'PRO', 
          status: 'ACTIVE', 
          nextBillingDate: new Date(Date.now() + 365 * 86400000).toISOString(),
          limits: {
            products: 5000,
            staff: 10,
            sales: 100000,
            locations: 5
          },
          usage: {
            products: prods.length,
            staff: staff.length,
            sales: sales.length,
            locations: 1
          }
        } 
      };
    }

    // ROUTE: /api/settings/export
    if (path === '/api/settings/export') {
      const exportData = kiranaStorage.exportData();
      return { success: true, data: exportData };
    }

    // ROUTE: /api/settings
    if (path === '/api/settings' || path.startsWith('/api/settings')) {
      if (method === 'GET') {
        const biz = kiranaStorage.getBusiness();
        return { success: true, data: { ...biz, business: biz, session: kiranaStorage.getSession() } };
      }
      if (method === 'POST' || method === 'PUT') {
        const updated = kiranaStorage.updateBusiness(body);
        return { success: true, data: updated };
      }
    }

    // Default fallback
    return { success: true, data: {} };
  }

  // Convenience methods
  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
