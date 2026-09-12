'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  PackageCheck, 
  Users,
  Sparkles,
  PlusCircle,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useStorage } from '@/lib/storage/StorageContext';
import { apiClient } from '@/lib/api-client';
import StoreHeroIllustration from '@/components/illustrations/StoreHeroIllustration';
import EmptyStateIllustration from '@/components/illustrations/EmptyStateIllustration';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, tp, tc, tu, tb, ts } = useLanguage();
  const { business, storageMode } = useStorage();
  const storeName = business?.name || 'Green Mart Kirana';

  const fetchDashboardData = async () => {
    try {
      const json = await apiClient.get('/api/dashboard');
      if (json.success && json.data) {
        setStats(json.data);
      } else {
        throw new Error(json.error?.message || 'Failed to retrieve dashboard metrics.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleStorageUpdate = () => {
      fetchDashboardData();
    };

    window.addEventListener('kirana_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('kirana_storage_updated', handleStorageUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton cards loader */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-3">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-16 bg-slate-300 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 h-80 animate-pulse"></div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <h3 className="font-bold text-lg">Error Loading Analytics</h3>
        <p className="text-sm mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Lively Store Welcome Hero Banner with Vector Illustration & Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-indigo-950/60 select-none">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 text-center md:text-left max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/15 backdrop-blur-md">
              <Sparkles size={13} className="text-amber-400" />
              <span>Namaste & Welcome back</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {storeName}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Your retail POS engine is live with instant multi-language billing, offline-ready Khata ledger, and thermal print queue.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <Link
                href="/sales/pos"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Zap size={14} className="text-amber-300" />
                <span>Quick POS Bill</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">F2</span>
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <PlusCircle size={14} className="text-emerald-400" />
                <span>Add Product</span>
              </Link>

              <Link
                href="/customers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <Users size={14} className="text-indigo-300" />
                <span>Khata Ledger</span>
              </Link>
            </div>
          </div>

          {/* Handcrafted Store Vector Illustration */}
          <div className="shrink-0 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
            <StoreHeroIllustration className="w-52 h-36 sm:w-64 sm:h-44 drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* 5 Stats Cards Grid with Deep Surfaces, Glowing Badges & Hover Lift */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        
        {/* Sales Card */}
        <div className="depth-surface depth-surface-hover p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">{t('dashboard.todaySales')}</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {formatCurrency(stats.todaySales)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs">
            <span className="text-slate-500 font-medium">{t('dashboard.last24Hours')}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700">
              Live
            </span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="depth-surface depth-surface-hover p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">{t('dashboard.todayProfit')}</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {formatCurrency(stats.todayProfit)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {stats.todaySales > 0 ? `${((stats.todayProfit / stats.todaySales) * 100).toFixed(0)}% ${t('dashboard.margin')}` : `0% ${t('dashboard.margin')}`}
            </span>
          </div>
        </div>

        {/* Items Sold Card */}
        <div className="depth-surface depth-surface-hover p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">{t('dashboard.itemsSold')}</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {formatNumber(stats.itemsSold)}
            </div>
          </div>
          <div className="mt-3 text-[11px] sm:text-xs text-slate-500 font-medium">
            {t('dashboard.quantitiesCheckedOut')}
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="depth-surface depth-surface-hover p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">{t('dashboard.lowStock')}</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stats.lowStock}
            </div>
          </div>
          <div className="mt-3 text-[11px] sm:text-xs text-amber-700 font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />
            <span>{t('dashboard.requiresReorders')}</span>
          </div>
        </div>

        {/* Outstanding Khata / Credit Card */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 depth-surface depth-surface-hover p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-500">{t('dashboard.outstandingCredit')}</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {formatCurrency(stats.outstandingCredit)}
            </div>
          </div>
          <div className="mt-3 text-[11px] sm:text-xs text-slate-500 font-medium">
            {t('dashboard.udhaarBalances')}
          </div>
        </div>

      </div>

      {/* Grids for Chart and Top Products with Layered Depth */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sales Area Chart */}
        <div className="lg:col-span-2 depth-surface rounded-2xl p-6 border border-slate-200/90 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{t('dashboard.salesAnalytics')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Performance timeline across recent revenue periods</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse-glow" />
              Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling Products with Depth Badges */}
        <div className="depth-surface rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{t('dashboard.topProducts')}</h3>
            <span className="text-xs font-semibold text-slate-400">By volume</span>
          </div>

          <div className="flex-1 flex flex-col justify-center divide-y divide-slate-100">
            {stats.topSelling.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
                <EmptyStateIllustration className="w-28 h-20 opacity-85" />
                <span className="text-xs font-semibold text-slate-400">No sales transactions logged today.</span>
              </div>
            ) : (
              stats.topSelling.map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                        : idx === 1 
                        ? 'bg-slate-200 text-slate-700' 
                        : idx === 2 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1">{tp(prod.name)}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 shrink-0 ml-2 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    {prod.sold} {t('common.results', 'sold')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Low Stock Alerts and Recent Activity with Layered Contrast */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Low Stock Alerts Section */}
        <div className="depth-surface rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-glow" />
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Low Stock Alert</h3>
            </div>
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 group">
              <span>View Inventory</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-slate-100 pr-1">
            {stats.lowStockDetails.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <PackageCheck size={32} className="text-emerald-500" />
                <span className="font-semibold text-slate-600">All products have healthy stock levels!</span>
              </div>
            ) : (
              stats.lowStockDetails.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-xl hover:bg-amber-50/40 transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{tp(item.name)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('inventory.lowStockThreshold', 'Threshold')}: {item.threshold}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-amber-100/80 text-amber-800 border border-amber-200">
                      {item.stock} {t('common.stock', 'in stock')}
                    </span>
                    <div className="text-xxs text-slate-400 mt-0.5">{t('inventory.reorderLevel', 'Reorder')}: +{item.reorderQty}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="depth-surface rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Recent Stock Activity</h3>
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 group">
              <span>Audit Logs</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-1">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
                <EmptyStateIllustration className="w-28 h-20 opacity-85" />
                <span className="text-xs font-semibold text-slate-400">No stock movements recorded yet.</span>
              </div>
            ) : (
              stats.recentActivity.map((act) => {
                const isAddition = act.qty > 0;
                return (
                  <div key={act.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors text-sm">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">{act.action}</span>
                      <p className="text-xs text-slate-500">{tp(act.productName)} ({act.user})</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        isAddition 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isAddition ? `+${act.qty}` : act.qty}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
