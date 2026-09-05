'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  Calendar,
  User,
  History
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function InventoryHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState(''); // SALE, PURCHASE, DAMAGE, LOSS, OPENING_STOCK, etc.
  const [page, setPage] = useState(1);

  // Fetch transaction history logs
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        search,
        type,
        page: String(page),
        limit: '15'
      });
      const json = await apiClient.get(`/api/inventory/history?${q.toString()}`);
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to fetch transaction logs.');
      }
      setTransactions(json.data?.logs || json.data || []);
      setMeta(json.data?.meta || { page: 1, pages: 1, total: (json.data?.logs || []).length });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, type, page]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href="/inventory" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Inventory Audits</span>
          <h2 className="text-xl font-extrabold text-slate-900">General Stock Transaction Logs</h2>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search by Product */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold shadow-sm"
            placeholder="Search by product name, SKU or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Transaction Type Filter */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Transactions</option>
            <option value="SALE">Sales (Deductions)</option>
            <option value="PURCHASE">Purchases (Restocks)</option>
            <option value="DAMAGE">Damaged / Write-offs</option>
            <option value="LOSS">Stolen / Lost Items</option>
            <option value="OPENING_STOCK">Opening Stocks</option>
            <option value="SALE_RETURN">Returned items</option>
          </select>
        </div>

      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={18} /> Retrieving transaction trail...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-red-500" />
            <h3 className="font-bold text-base">Failed to fetch transactions</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <History size={32} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">No transaction logs recorded</h3>
            <p className="text-sm text-slate-400">Try modifying filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3">Timestamp</th>
                    <th scope="col" className="px-6 py-3">Product details</th>
                    <th scope="col" className="px-6 py-3">Type</th>
                    <th scope="col" className="px-6 py-3 text-right">Adjustment Qty</th>
                    <th scope="col" className="px-6 py-3">Log Details / Notes</th>
                    <th scope="col" className="px-6 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {transactions.map((tx, idx) => {
                    const qtyVal = tx.quantity !== undefined ? tx.quantity : (tx.qty !== undefined ? tx.qty : 0);
                    const isAddition = qtyVal > 0;
                    const logDate = tx.createdAt ? new Date(tx.createdAt) : (tx.time ? new Date(tx.time) : new Date());
                    const prodName = tx.product?.name || tx.productName || 'Kirana Product';
                    const prodSku = tx.product?.sku || 'SKU-FMCG';
                    const userName = tx.user?.name || (typeof tx.user === 'string' ? tx.user : 'Store Operator');
                    const txType = tx.type || tx.action || 'ADJUSTMENT';

                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {logDate.toLocaleDateString()} {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {tx.productId ? (
                            <Link href={`/products/${tx.productId}`} className="font-bold text-indigo-600 hover:text-indigo-500 line-clamp-1">
                              {prodName}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-900 line-clamp-1">{prodName}</span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">{prodSku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-bold uppercase ${
                            txType.includes('SALE') ? 'bg-indigo-100 text-indigo-700' :
                            txType.includes('PURCHASE') || txType.includes('RESTOCK') ? 'bg-emerald-100 text-emerald-700' :
                            txType.includes('DAMAGE') || txType.includes('LOSS') ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {txType}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-extrabold ${isAddition ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isAddition ? `+${qtyVal}` : qtyVal}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium text-xs max-w-xs truncate">
                          {tx.note || tx.action || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                            <User size={12} className="text-slate-400" />
                            {userName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination navigation bar */}
            {meta.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Showing page <span className="font-bold text-slate-900">{meta.page}</span> of{' '}
                    <span className="font-bold text-slate-900">{meta.pages}</span> (
                    <span className="font-bold text-slate-900">{meta.total}</span> total transaction entries)
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
