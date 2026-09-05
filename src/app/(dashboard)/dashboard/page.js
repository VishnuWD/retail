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
  Users
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
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, tp, tc, tu, tb, ts } = useLanguage();

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
    <div className="space-y-6">
      
      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        
        {/* Sales Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs sm:text-sm font-semibold">{t('dashboard.todaySales')}</span>
              <TrendingUp size={16} className="text-indigo-600 shrink-0" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
              {formatCurrency(stats.todaySales)}
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium">{t('dashboard.last24Hours')}</div>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs sm:text-sm font-semibold">{t('dashboard.todayProfit')}</span>
              <DollarSign size={16} className="text-emerald-600 shrink-0" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
              {formatCurrency(stats.todayProfit)}
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-emerald-600 font-bold">
            {stats.todaySales > 0 ? `${((stats.todayProfit / stats.todaySales) * 100).toFixed(0)}% ${t('dashboard.margin')}` : `0% ${t('dashboard.margin')}`}
          </div>
        </div>

        {/* Items Sold Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs sm:text-sm font-semibold">{t('dashboard.itemsSold')}</span>
              <ShoppingBag size={16} className="text-indigo-600 shrink-0" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
              {formatNumber(stats.itemsSold)}
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium">{t('dashboard.quantitiesCheckedOut')}</div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs sm:text-sm font-semibold">{t('dashboard.lowStock')}</span>
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900">
              {stats.lowStock}
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-amber-600 font-semibold flex items-center gap-1">
            <span>{t('dashboard.requiresReorders')}</span>
          </div>
        </div>

        {/* Credit Card */}
        <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs sm:text-sm font-semibold">{t('dashboard.outstandingCredit')}</span>
              <Users size={16} className="text-slate-400 shrink-0" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
              {formatCurrency(stats.outstandingCredit)}
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium">{t('dashboard.udhaarBalances')}</div>
        </div>

      </div>

      {/* Grids for Chart and Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sales Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4">{t('dashboard.salesAnalytics')}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [`₹${value.toFixed(2)}`]}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-base mb-4">{t('dashboard.topProducts')}</h3>
          <div className="flex-1 flex flex-col justify-center divide-y divide-slate-100">
            {stats.topSelling.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">No sales transactions logged.</div>
            ) : (
              stats.topSelling.map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 line-clamp-1">{tp(prod.name)}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{prod.sold} {t('common.results')}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Low Stock Alerts and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Low Stock Alerts Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Low Stock Alert</h3>
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-500 font-bold text-xs flex items-center gap-1">
              View Inventory <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-slate-100 pr-1">
            {stats.lowStockDetails.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <PackageCheck size={28} className="text-emerald-500" />
                <span>All products have healthy stock levels!</span>
              </div>
            ) : (
              stats.lowStockDetails.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{tp(item.name)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('inventory.lowStockThreshold')}: {item.threshold}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-600">{item.stock} {t('common.stock')}</span>
                    <div className="text-xxs text-slate-400 mt-0.5">{t('inventory.reorderLevel')}: +{item.reorderQty}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Recent Stock Activity</h3>
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-500 font-bold text-xs flex items-center gap-1">
              Audit Logs <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80 space-y-4 pr-1">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No activity recorded yet.</div>
            ) : (
              stats.recentActivity.map((act) => {
                const isAddition = act.qty > 0;
                return (
                  <div key={act.id} className="flex items-start justify-between text-sm">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800">{act.action}</span>
                      <p className="text-xs text-slate-500">{tp(act.productName)} ({act.user})</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-bold ${isAddition ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isAddition ? `+${act.qty}` : act.qty}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
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
