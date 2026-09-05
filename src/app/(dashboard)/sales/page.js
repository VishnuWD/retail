'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  AlertTriangle,
  Calendar,
  User,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Printer
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';
import ReceiptModal from '@/components/sales/ReceiptModal';
import { printReceiptDirectly } from '@/lib/printer/receiptPrinter';
import { useStorage } from '@/lib/storage/StorageContext';

export default function SalesHistoryPage() {
  const { t, ts } = useLanguage();
  const { business } = useStorage();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  // Today stats summary cards
  const [summary, setSummary] = useState({
    todaySales: 0,
    transactions: 0,
    averageBill: 0,
    cash: 0,
    upi: 0,
    card: 0,
    credit: 0
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Filters & Queries state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Fetch sales records
  const fetchSales = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        status,
        paymentStatus,
        method,
        startDate,
        endDate,
        sort: sortBy,
        order: sortOrder,
        page: String(page),
        limit: '10'
      });
      const json = await apiClient.get(`/api/sales?${q.toString()}`);
      if (json.success && json.data) {
        setSales(json.data.sales || []);
        setMeta(json.data.meta || { page: 1, pages: 1, total: (json.data.sales || []).length });
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve sales logs.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's sales metrics from dashboard endpoint
  const fetchDailySummary = async () => {
    setLoadingSummary(true);
    try {
      const json = await apiClient.get('/api/dashboard');
      if (json.success && json.data) {
        const dashboardData = json.data;
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const salesJson = await apiClient.get(`/api/sales?startDate=${todayStart.toISOString()}&limit=100`);
        
        let cashSum = 0;
        let upiSum = 0;
        let cardSum = 0;
        let creditSum = 0;
        
        if (salesJson.success && salesJson.data?.sales) {
          salesJson.data.sales.forEach(s => {
            if (s.status !== 'CANCELLED' && s.payments) {
              s.payments.forEach(p => {
                if (p.method === 'CASH') cashSum += p.amount;
                else if (p.method === 'UPI') upiSum += p.amount;
                else if (p.method === 'CARD') cardSum += p.amount;
                else if (p.method === 'CREDIT') creditSum += p.amount;
              });
            }
          });
        }
        
        setSummary({
          todaySales: dashboardData.todaySales || 0,
          transactions: dashboardData.itemsSold || 0,
          averageBill: dashboardData.itemsSold > 0 ? (dashboardData.todaySales / dashboardData.itemsSold) : 0,
          cash: cashSum,
          upi: upiSum,
          card: cardSum,
          credit: creditSum
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, status, paymentStatus, method, startDate, endDate, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchDailySummary();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Header Buttons and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Sales & POS History Logs</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Track store checkouts, invoice numbers and returns</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetchSales();
              fetchDailySummary();
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm shrink-0"
            title="Refresh logs"
          >
            <RefreshCw size={16} />
          </button>
          <Link
            href="/sales/pos"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <Plus size={16} /> Open POS Register
          </Link>
        </div>
      </div>

      {/* Daily Sales Summaries */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Today's Sales</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.todaySales)}
          </div>
        </div>

        {/* Avg bill ticket */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Average Bill</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.averageBill)}
          </div>
        </div>

        {/* Cash payment totals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Cash Sales</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.cash)}
          </div>
        </div>

        {/* UPI payment totals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">UPI Sales</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.upi)}
          </div>
        </div>

        {/* Card payment totals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Card Sales</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.card)}
          </div>
        </div>

        {/* Credit outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Credit (Udhaar)</span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary.credit)}
          </div>
        </div>

      </div>

      {/* Advanced Filter and Sorting box */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        
        {/* Search */}
        <div className="col-span-2 relative flex items-center border border-slate-200 rounded-lg px-2 bg-white">
          <Search size={14} className="text-slate-400 mr-2" />
          <input
            type="text"
            className="w-full py-1.5 focus:outline-none text-sm placeholder-slate-300"
            placeholder="Invoice # or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
          <input
            type="date"
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Sale Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invoice Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
            <option value="PARTIALLY_RETURNED">Partial Returns</option>
          </select>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Payments</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Store Credit</option>
          </select>
        </div>

      </div>

      {/* Sales Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin text-indigo-600" size={18} /> Retrieving invoices ledger...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-red-500" />
            <h3 className="font-bold text-base">Failed to fetch transactions</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShoppingBag size={32} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">No checkout transactions recorded</h3>
            <p className="text-sm text-slate-400">Open POS register to settle sales.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3">{t('sales.invoiceNumber')}</th>
                    <th scope="col" className="px-6 py-3">{t('sales.date')}</th>
                    <th scope="col" className="px-6 py-3">{t('sales.customer')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('sales.totalAmount')}</th>
                    <th scope="col" className="px-6 py-3">{t('sales.paymentMode')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('sales.status')}</th>
                    <th scope="col" className="px-6 py-3">{t('settings.role')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {sales.map((sale) => {
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{sale.invoiceNumber}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800">{sale.customer?.name || 'Walk-in Customer'}</span>
                          {sale.customer?.phone && <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{sale.customer.phone}</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex gap-1">
                            {sale.payments.map((p, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] uppercase">
                                {p.method}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sale.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {sale.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-slate-600 font-bold text-xs">
                            <User size={12} className="text-slate-400" />
                            {sale.user?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceiptSale(sale);
                                setReceiptModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-bold transition-colors text-xs"
                              title="Print Thermal Slip"
                            >
                              <Printer size={12} className="text-indigo-600" /> Slip
                            </button>
                            <Link
                              href={`/sales/${sale.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-bold transition-colors text-xs"
                            >
                              <Eye size={12} /> View
                            </Link>
                          </div>
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
                    <span className="font-bold text-slate-900">{meta.total}</span> total checkout invoices)
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

      {/* QUICK RECEIPT PREVIEW / PRINT MODAL */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setActiveReceiptSale(null);
        }}
        sale={activeReceiptSale}
      />

    </div>
  );
}
