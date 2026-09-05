'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@/lib/validations';
import { 
  Boxes, 
  Search, 
  Filter, 
  ArrowUpRight, 
  AlertTriangle, 
  Sliders, 
  X, 
  Loader2, 
  Check,
  TrendingDown,
  TrendingUp,
  Package,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';

export default function InventoryPage() {
  const { t, tp, tc, tu, tb, ts } = useLanguage();
  // Inventory state
  const [inventories, setInventories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  // Query parameters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const [page, setPage] = useState(1);

  // Adjustment Modal state
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [actionType, setActionType] = useState('INCREASE'); // INCREASE, DECREASE, SET
  const [qtyDelta, setQtyDelta] = useState(1);
  const [adjustmentErr, setAdjustmentErr] = useState(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(false);

  // Fetch inventory levels
  const fetchInventory = async () => {
    setLoadingList(true);
    try {
      const q = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: '10'
      });
      const json = await apiClient.get(`/api/products?${q.toString()}`);
      if (json.success && json.data) {
        // Normalize products with inventory relation
        const prods = json.data.products || [];
        const invList = prods.map(p => ({
          id: `inv_${p.id}`,
          productId: p.id,
          quantity: p.inventory?.quantity ?? 0,
          lowStockThreshold: p.inventory?.lowStockThreshold ?? 10,
          reorderQuantity: p.inventory?.reorderQuantity ?? 20,
          updatedAt: p.updatedAt,
          product: p
        }));
        setInventories(invList);
        setMeta(json.data.meta || { page: 1, pages: 1, total: prods.length });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch summary analytics from dashboard API
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const json = await apiClient.get('/api/dashboard');
      if (json.success && json.data) {
        setSummary(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, status, page]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // Form for stock adjustment
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: '',
      action: 'INCREASE',
      quantity: 1,
      reason: 'ADJUSTMENT',
      note: ''
    }
  });

  const watchQuantity = watch('quantity') || 1;
  const watchReason = watch('reason') || 'ADJUSTMENT';
  const watchNote = watch('note') || '';

  // Open adjustment modal
  const handleOpenAdjust = (inv) => {
    setAdjustModalItem(inv);
    setAdjustmentErr(null);
    setAdjustmentSuccess(false);
    setActionType('INCREASE');
    
    reset({
      productId: inv.productId,
      action: 'INCREASE',
      quantity: 1,
      reason: 'ADJUSTMENT',
      note: ''
    });
  };

  // Submit stock adjustment
  const onAdjustSubmit = async (data) => {
    setAdjustmentErr(null);
    setAdjustmentSuccess(false);
    try {
      let delta = Number(data.quantity);
      if (data.action === 'DECREASE') delta = -delta;
      if (data.action === 'SET' && adjustModalItem) {
        delta = Number(data.quantity) - (adjustModalItem.quantity || 0);
      }

      const json = await apiClient.post('/api/inventory', {
        productId: data.productId,
        quantityDelta: delta,
        type: data.reason || 'MANUAL_ADJUSTMENT',
        note: data.note || 'Manual inventory adjustment'
      });

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to apply adjustment.');
      }

      setAdjustmentSuccess(true);
      fetchInventory();
      fetchSummary();
      setTimeout(() => {
        setAdjustModalItem(null);
      }, 1000);
    } catch (err) {
      setAdjustmentErr(err.message);
    }
  };

  // Live stock adjustment previews
  const currentStock = adjustModalItem?.quantity || 0;
  const threshold = adjustModalItem?.product?.lowStockThreshold || 10;
  let previewStock = currentStock;
  if (actionType === 'INCREASE') {
    previewStock = currentStock + Number(watchQuantity);
  } else if (actionType === 'DECREASE') {
    previewStock = currentStock - Number(watchQuantity);
  } else if (actionType === 'SET') {
    previewStock = Number(watchQuantity);
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Buttons and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Inventory Management</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Monitor and adjust warehouse stock levels</p>
        </div>

        <Link
          href="/inventory/history"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm"
        >
          <History size={16} /> View Audit Logs
        </Link>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        
        {/* Total Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Products</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatNumber(summary?.totalProducts ?? inventories.length)}
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Units</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatNumber(summary?.totalUnits ?? inventories.reduce((sum, i) => sum + (i.quantity || 0), 0))}
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Low Stock Alert</div>
          <div className="mt-1 text-xl font-extrabold text-amber-600">
            {loadingSummary ? '...' : (summary?.lowStock ?? inventories.filter(i => (i.quantity || 0) <= (i.lowStockThreshold || 10)).length)}
          </div>
        </div>

        {/* Out of Stock count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Out of Stock</div>
          <div className="mt-1 text-xl font-extrabold text-red-600">
            {loadingSummary ? '...' : (summary?.outOfStock ?? inventories.filter(i => (i.quantity || 0) === 0).length)}
          </div>
        </div>

        {/* Asset Value */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Value</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : formatCurrency(summary?.inventoryValue ?? 0)}
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold shadow-sm"
            placeholder="Search inventory by name, SKU or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Stock Status filter */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">Good Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingList ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={18} /> Loading stock registers...
          </div>
        ) : inventories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-base text-slate-800">No stock logs matched</h3>
            <p className="text-sm text-slate-400">Try adjusting your search queries.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3">{t('products.productName')}</th>
                    <th scope="col" className="px-6 py-3">{t('products.sku')}</th>
                    <th scope="col" className="px-6 py-3">{t('products.barcode')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('inventory.currentStock')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('inventory.lowStockThreshold')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('inventory.reorderLevel')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.status')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {inventories.map((inv) => {
                    const quantity = inv.quantity;
                    const threshold = inv.lowStockThreshold;
                    const isLow = quantity > 0 && quantity <= threshold;
                    const isOut = quantity <= 0;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{tp(inv.product.name)}</div>
                          <div className="text-xxs text-slate-400 mt-0.5">{tb(inv.product.brand) || '—'} • {tu(inv.product.unit)}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{inv.product.sku || '—'}</td>
                        <td className="px-6 py-4 font-mono text-xs">{inv.product.barcode || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={isOut ? 'text-red-600 font-extrabold' : isLow ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                            {quantity}
                          </span> {tu(inv.product.unit)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">{threshold}</td>
                        <td className="px-6 py-4 text-right text-slate-500">+{inv.reorderQuantity}</td>
                        <td className="px-6 py-4 text-center">
                          {isOut ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-red-100 text-red-800 uppercase">{ts('OUT_OF_STOCK')}</span>
                          ) : isLow ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-100 text-amber-800 uppercase">{ts('LOW_STOCK')}</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-emerald-100 text-emerald-800 uppercase">{ts('IN_STOCK')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenAdjust(inv)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-xs font-bold transition-colors mx-auto"
                          >
                            <Sliders size={12} /> {t('inventory.adjustStock')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {inventories.map((inv) => {
                const quantity = inv.quantity;
                const threshold = inv.lowStockThreshold;
                const isLow = quantity > 0 && quantity <= threshold;
                const isOut = quantity <= 0;

                return (
                  <div key={inv.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{tp(inv.product.name)}</h4>
                        <span className="text-xxs text-slate-400 mt-1 block">{tb(inv.product.brand) || '—'} • {tu(inv.product.unit)}</span>
                      </div>
                      
                      <span className={`text-base font-extrabold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {quantity} {tu(inv.product.unit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                      <div>
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">Out of stock</span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Low stock</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">In stock</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenAdjust(inv)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-xs font-bold transition-colors"
                      >
                        <Sliders size={12} /> Adjust
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination navigation bar */}
        {meta.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-bold rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.pages}
                onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-bold rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Showing page <span className="font-bold text-slate-900">{meta.page}</span> of{' '}
                  <span className="font-bold text-slate-900">{meta.pages}</span> (
                  <span className="font-bold text-slate-900">{meta.total}</span> total stock registers)
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
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= meta.pages}
                    onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                    className="relative inline-flex items-center px-2.5 py-2 border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
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
          </div>
        )}
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAdjustModalItem(null)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-sm font-semibold">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Adjust Stock Levels</h3>
              <button onClick={() => setAdjustModalItem(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>

            {adjustmentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-slate-900">Stock Count Updated!</h4>
                <p className="text-xs text-slate-400">Inventory balance and transaction trail logs updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onAdjustSubmit)} className="p-6 space-y-4">
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Product</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">{adjustModalItem.product.name}</span>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">Current Stock: {currentStock} {adjustModalItem.product.unit}s</span>
                </div>

                {adjustmentErr && (
                  <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{adjustmentErr}</span>
                  </div>
                )}

                {/* Adjustment Mode Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('INCREASE');
                      setValue('action', 'INCREASE');
                    }}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 ${
                      actionType === 'INCREASE' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp size={12} /> Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('DECREASE');
                      setValue('action', 'DECREASE');
                    }}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 ${
                      actionType === 'DECREASE' 
                        ? 'bg-red-50 border-red-300 text-red-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown size={12} /> Reduce Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('SET');
                      setValue('action', 'SET');
                    }}
                    className={`py-2 px-3 border rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 ${
                      actionType === 'SET' 
                        ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders size={12} /> Set Count
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Quantity Count *</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      {...register('quantity')}
                    />
                    {errors.quantity && <p className="mt-1 text-xs text-red-600 font-bold">{errors.quantity.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Reason / Type *</label>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('reason')}
                    >
                      <option value="ADJUSTMENT">Correction Audit</option>
                      <option value="PURCHASE">Purchase restock</option>
                      <option value="DAMAGE">Damaged / Expired</option>
                      <option value="LOSS">Stolen / Lost</option>
                      <option value="SALE_RETURN">Returned items</option>
                      <option value="OTHER">Other reason</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Operational Note *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Audit reason detail..."
                    {...register('note')}
                  />
                  {errors.note && <p className="mt-1 text-xs text-red-600 font-bold">{errors.note.message}</p>}
                </div>

                {/* Audit preview block */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Adjustment Preview:</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {currentStock} units → <span className={previewStock < threshold ? 'text-amber-600 font-extrabold' : 'text-slate-800'}>{previewStock}</span> units
                  </span>
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdjustModalItem(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirm Adjustment
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
