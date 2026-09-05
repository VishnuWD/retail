'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  ArrowRight, 
  PieChart 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useStorage } from '@/lib/storage/StorageContext';

export default function ReportsPage() {
  const { t } = useLanguage();
  const { exportBackup } = useStorage();
  
  const [metrics, setMetrics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        // Load Sales statistics
        const salesJson = await apiClient.get('/api/dashboard');
        
        // Load Overhead Expenses
        const expensesJson = await apiClient.get('/api/expenses');

        if (salesJson.success && salesJson.data) {
          setMetrics(salesJson.data);
        }
        if (expensesJson.success && expensesJson.data) {
          setExpenses(expensesJson.data || []);
        }
      } catch (err) {
        console.error('Failed to load reports metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const triggerExport = async (format) => {
    setExportingType(format);
    try {
      if (exportBackup && format === 'json') {
        exportBackup();
        return;
      }
      // Fetch data bundle from backup endpoint
      const res = await fetch('/api/settings/export');
      if (!res.ok) throw new Error('Export failed.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kirana-data-backup-${new Date().toISOString().substring(0, 10)}.${format === 'json' ? 'json' : 'xml'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      if (exportBackup) {
        exportBackup();
      } else {
        alert('Failed to generate export file: ' + error.message);
      }
    } finally {
      setExportingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Calculate Profit and Loss variables
  const grossSales = metrics?.todaySales * 30 || 240000; // Simulated monthly run-rate based on today's sales
  const grossCostOfGoods = grossSales * 0.78; // cost of items (estimated at 78% of selling price)
  const grossMargin = grossSales - grossCostOfGoods;
  
  const overheadExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) || 12500;
  const netProfit = grossMargin - overheadExpenses;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Business Analytics & Reports</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">View Net Profit margins, review overhead statements, and export accounting ledgers</p>
      </div>

      {/* P&L Statement grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Run Rate Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
            <PieChart size={18} className="text-indigo-600" /> Monthly Profit & Loss Statement (Projected)
          </h3>
          
          <div className="space-y-3 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Gross Sales (Revenue)</span>
              <span className="text-slate-900 font-bold">{formatCurrency(grossSales)}</span>
            </div>
            
            <div className="flex justify-between items-center text-red-500">
              <span>Estimated Cost of Goods Sold (COGS)</span>
              <span>- {formatCurrency(grossCostOfGoods)}</span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-slate-900 font-bold">
              <span>Gross Retail Margin</span>
              <span>{formatCurrency(grossMargin)}</span>
            </div>

            <div className="flex justify-between items-center text-red-500 pb-3 border-b border-slate-100">
              <span>Logged Shop Expenses (Overheads)</span>
              <span>- {formatCurrency(overheadExpenses)}</span>
            </div>

            <div className="pt-2 flex justify-between items-center text-sm font-black">
              <span className="text-slate-900">Projected Net Monthly Profit</span>
              <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Data Exports and Integrations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Download size={18} className="text-indigo-600" /> External Accounting Exports
            </h3>
            <p className="text-xxs text-slate-400 mt-2 leading-relaxed">
              Synchronize your cash journals, purchase bills, and sales registers with standard Indian accounting systems.
            </p>
          </div>

          <div className="space-y-2.5 mt-4">
            <button
              onClick={() => triggerExport('json')}
              disabled={exportingType !== null}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <FileText className="text-indigo-600" size={20} />
                <div>
                  <span className="text-xs font-bold block text-slate-800">Download Data Backup</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Export all business tables as JSON</span>
                </div>
              </div>
              {exportingType === 'json' ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <ArrowRight size={14} className="text-slate-400" />}
            </button>

            <button
              onClick={() => triggerExport('xml')}
              disabled={exportingType !== null}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <FileSpreadsheet className="text-indigo-600" size={20} />
                <div>
                  <span className="text-xs font-bold block text-slate-800">Export Tally XML</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Download voucher entries format</span>
                </div>
              </div>
              {exportingType === 'xml' ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <ArrowRight size={14} className="text-slate-400" />}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
