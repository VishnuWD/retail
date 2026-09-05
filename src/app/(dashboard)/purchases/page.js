'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  Calendar,
  User,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';

export default function PurchasesPage() {
  const { t, ts } = useLanguage();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  // Purchase Metrics
  const [analytics, setAnalytics] = useState({
    purchasesThisMonth: 0,
    topSupplier: '—',
    totalItemsPurchased: 0,
    avgPurchaseValue: 0
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Suppliers directory for dropdown
  const [suppliers, setSuppliers] = useState([]);

  // Fetch PO history list
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        supplierId,
        status,
        paymentStatus,
        startDate,
        endDate,
        page: String(page),
        limit: '10'
      });
      const json = await apiClient.get(`/api/purchases?${q.toString()}`);
      if (json.success && json.data) {
        const list = Array.isArray(json.data) ? json.data : (json.data.purchases || []);
        setPurchases(list);
        setMeta(json.data.meta || { page: 1, pages: 1, total: list.length });
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve purchase orders.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compile monthly purchase metrics (from un-paginated stats query)
  const compileAnalytics = async () => {
    try {
      const json = await apiClient.get('/api/purchases?limit=1000');
      if (json.success && json.data) {
        let monthTotal = 0;
        let itemsCount = 0;
        const supplierSpending = {};
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const rawList = Array.isArray(json.data) ? json.data : (json.data.purchases || []);
        const activePOs = rawList.filter(p => p.status !== 'CANCELLED');

        activePOs.forEach(p => {
          const poDate = new Date(p.createdAt || p.purchaseDate || Date.now());
          if (poDate.getMonth() === currentMonth && poDate.getFullYear() === currentYear) {
            monthTotal += (p.totalAmount || 0);
          }
          
          if (p.items) {
            p.items.forEach(i => {
              itemsCount += (i.receivedQuantity || i.quantity || 0);
            });
          }

          const supName = p.supplier?.name || p.supplierName || '—';
          supplierSpending[supName] = (supplierSpending[supName] || 0) + (p.totalAmount || 0);
        });

        // Find top supplier
        let topSupName = '—';
        let topSupSpend = 0;
        Object.entries(supplierSpending).forEach(([name, spend]) => {
          if (spend > topSupSpend) {
            topSupSpend = spend;
            topSupName = name;
          }
        });

        setAnalytics({
          purchasesThisMonth: monthTotal,
          topSupplier: topSupName,
          totalItemsPurchased: itemsCount,
          avgPurchaseValue: activePOs.length > 0 ? (activePOs.reduce((sum, p) => sum + (p.totalAmount || 0), 0) / activePOs.length) : 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, supplierId, status, paymentStatus, startDate, endDate, page]);

  useEffect(() => {
    // Load suppliers dropdown
    async function loadSuppliers() {
      try {
        const json = await apiClient.get('/api/suppliers?limit=1000&status=ALL');
        if (json.success && json.data) {
          const supList = Array.isArray(json.data) ? json.data : (json.data.suppliers || []);
          setSuppliers(supList);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSuppliers();
    compileAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Purchasing & Shipments Logs</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Track purchase orders, received inventory items, and wholesale payables</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetchPurchases();
              compileAnalytics();
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm shrink-0"
            title="Refresh logs"
          >
            <RefreshCw size={16} />
          </button>
          <Link
            href="/purchases/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <Plus size={16} /> Log Wholesale Purchase
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        
        {/* Month Purchases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Purchases This Month</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {formatCurrency(analytics.purchasesThisMonth)}
          </div>
        </div>

        {/* Top Supplier */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Top Supplier</span>
          <div className="mt-1 text-base font-extrabold text-slate-800 truncate">
            {analytics.topSupplier}
          </div>
        </div>

        {/* Items Intake Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Stock Items Received</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {formatNumber(analytics.totalItemsPurchased)} units
          </div>
        </div>

        {/* Average Purchase value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Avg Purchase Order</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {formatCurrency(analytics.avgPurchaseValue)}
          </div>
        </div>

      </div>

      {/* Advanced Filter Box */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        
        {/* Search */}
        <div className="col-span-2 relative flex items-center border border-slate-200 rounded-lg px-2 bg-white">
          <Search size={14} className="text-slate-400 mr-2" />
          <input
            type="text"
            className="w-full py-1.5 focus:outline-none text-sm placeholder-slate-300"
            placeholder="PO # or Supplier invoice..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Supplier */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* PO status */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">PO Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partial Intake</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="">All Payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

      </div>

      {/* PO History Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin text-indigo-600" size={18} /> Querying purchase order entries...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-red-500" />
            <h3 className="font-bold text-base">Failed to fetch purchases</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShoppingBag size={32} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">No purchase records found</h3>
            <p className="text-sm text-slate-400">Click [Log Wholesale Purchase] to create a stock intake.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3">{t('purchases.billNumber')}</th>
                    <th scope="col" className="px-6 py-3">{t('purchases.supplier')}</th>
                    <th scope="col" className="px-6 py-3">{t('purchases.receivedDate')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('purchases.itemsReceived')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('purchases.totalCost')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('purchases.paymentStatus')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.status')}</th>
                    <th scope="col" className="px-6 py-3">Operator</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {purchases.map((po) => {
                    
                    const totalOrdered = po.items.reduce((sum, i) => sum + i.orderedQuantity, 0);
                    const totalReceived = po.items.reduce((sum, i) => sum + i.receivedQuantity, 0);
                    const ratio = `${totalReceived} / ${totalOrdered}`;

                    return (
                      <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                          <span>{po.purchaseOrderNumber}</span>
                          {po.supplierInvoiceNumber && (
                            <span className="block text-[10px] text-slate-400 font-bold mt-0.5">Invoice: {po.supplierInvoiceNumber}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {po.supplier?.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(po.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-800 block">{ratio}</span>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full mx-auto mt-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full" 
                              style={{ width: `${Math.min(100, (totalReceived / totalOrdered) * 100)}%` }} 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(po.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            po.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            po.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                            po.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            po.status === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {po.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-slate-600 font-bold text-xs">
                            <User size={12} className="text-slate-400" />
                            {po.user?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <Link
                            href={`/purchases/${po.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-bold transition-colors"
                          >
                            <Eye size={12} /> View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Showing page <span className="font-bold text-slate-900">{meta.page}</span> of{' '}
                    <span className="font-bold text-slate-900">{meta.pages}</span> (
                    <span className="font-bold text-slate-900">{meta.total}</span> total purchase orders)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="relative inline-flex items-center px-2.5 py-2 border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page >= meta.pages}
                      onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                      className="relative inline-flex items-center px-2.5 py-2 border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      disabled={page >= meta.pages}
                      onClick={() => setPage(meta.pages)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Last
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
