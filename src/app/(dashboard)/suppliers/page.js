'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  UserPlus,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';

export default function SuppliersPage() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });

  // Summary Metrics
  const [summary, setSummary] = useState({
    totalPayables: 0,
    suppliersWithBalance: 0,
    activeSuppliers: 0
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE'); // ACTIVE, INACTIVE, ALL
  const [hasOutstanding, setHasOutstanding] = useState(false);
  const [page, setPage] = useState(1);

  // New Supplier Drawer/Modal Form
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fetch Supplier Directory list
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        status,
        hasOutstanding: String(hasOutstanding),
        page: String(page),
        limit: '10'
      });
      const json = await apiClient.get(`/api/suppliers?${q.toString()}`);
      if (json.success && json.data) {
        const list = Array.isArray(json.data) ? json.data : (json.data.suppliers || []);
        setSuppliers(list);
        setMeta(json.data.meta || { page: 1, pages: 1, total: list.length });
      } else {
        throw new Error(json.error?.message || 'Failed to fetch suppliers.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compile totals across all suppliers (un-paginated query)
  const fetchSummaryStats = async () => {
    try {
      const json = await apiClient.get('/api/suppliers?limit=1000&status=ALL');
      if (json.success && json.data) {
        let payables = 0;
        let withBalanceCount = 0;
        let activeCount = 0;

        const list = Array.isArray(json.data) ? json.data : (json.data.suppliers || []);
        list.forEach(s => {
          const bal = s.outstanding || s.balance || 0;
          payables += bal;
          if (bal > 0) withBalanceCount++;
          if (s.isActive !== false) activeCount++;
        });

        setSummary({
          totalPayables: payables,
          suppliersWithBalance: withBalanceCount,
          activeSuppliers: activeCount
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, status, hasOutstanding, page]);

  useEffect(() => {
    fetchSummaryStats();
  }, []);

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    const payload = {
      name,
      companyName: companyName || null,
      phone: phone || null,
      email: email || null,
      taxNumber: taxNumber || null,
      address: address || null,
      notes: notes || null
    };

    try {
      const json = await apiClient.post('/api/suppliers', payload);
      if (json.success) {
        setNewSupplierOpen(false);
        // Reset fields
        setName('');
        setCompanyName('');
        setPhone('');
        setEmail('');
        setTaxNumber('');
        setAddress('');
        setNotes('');
        
        fetchSuppliers();
        fetchSummaryStats();
      } else {
        throw new Error(json.error?.message || 'Failed to save supplier profile.');
      }
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Quick Creation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Wholesale Suppliers Directory</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage trade accounts, outstanding balances, and purchase history</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetchSuppliers();
              fetchSummaryStats();
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm shrink-0"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setNewSupplierOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <UserPlus size={16} /> Add Supplier Profile
          </button>
        </div>
      </div>

      {/* Outstanding Payables Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total payables outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Payables Outstanding</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.totalPayables)}
          </div>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Sum of all outstanding supplier balances</span>
        </div>

        {/* Suppliers with outstanding balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Suppliers With Balance</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {summary.suppliersWithBalance}
          </div>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Vendors we owe money to</span>
        </div>

        {/* Active supplier profiles */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Active Suppliers</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {summary.activeSuppliers}
          </div>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Registered active vendor profiles</span>
        </div>

      </div>

      {/* Advanced Filter Sorting box */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        
        {/* Search */}
        <div className="col-span-2 relative flex items-center border border-slate-200 rounded-lg px-2 bg-white">
          <Search size={14} className="text-slate-400 mr-2" />
          <input
            type="text"
            className="w-full py-1.5 focus:outline-none text-sm placeholder-slate-300"
            placeholder="Search by name, company, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Profile status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ACTIVE">Active Suppliers</option>
            <option value="INACTIVE">Inactive Profiles</option>
            <option value="ALL">All Profiles</option>
          </select>
        </div>

        {/* Has outstanding filter */}
        <div className="col-span-2 flex items-center gap-2 mt-4 px-2">
          <input
            type="checkbox"
            id="hasOutstandingCheck"
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            checked={hasOutstanding}
            onChange={(e) => {
              setHasOutstanding(e.target.checked);
              setPage(1);
            }}
          />
          <label htmlFor="hasOutstandingCheck" className="text-xs text-slate-700 cursor-pointer select-none">
            Only show suppliers with outstanding balance
          </label>
        </div>

      </div>

      {/* Supplier table list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin text-indigo-600" size={18} /> Querying wholesale directory...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-red-500" />
            <h3 className="font-bold text-base">Failed to fetch suppliers</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Briefcase size={32} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">No wholesale supplier profiles</h3>
            <p className="text-sm text-slate-400">Click [Add Supplier] to log a new distributor profile.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3">{t('suppliers.contactPerson')}</th>
                    <th scope="col" className="px-6 py-3">{t('suppliers.companyName')}</th>
                    <th scope="col" className="px-6 py-3">{t('common.phone')} / {t('common.email')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('nav.products')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('suppliers.totalPayable')}</th>
                    <th scope="col" className="px-6 py-3">{t('purchases.receivedDate')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.status')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {suppliers.map((s) => {
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 text-sm block">{s.name}</span>
                          {s.taxNumber && <span className="text-[10px] text-slate-400 block mt-0.5">GSTIN: {s.taxNumber}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-bold block">{s.companyName || '—'}</span>
                          {s.address && <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{s.address}</span>}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          {s.phone && <span className="flex items-center gap-1.5 text-slate-600"><Phone size={10} /> {s.phone}</span>}
                          {s.email && <span className="flex items-center gap-1.5 text-slate-400"><Mail size={10} /> {s.email}</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{s.purchaseOrdersCount} items</td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-950">
                          {s.outstanding > 0 ? (
                            <span className="text-indigo-700">{formatCurrency(s.outstanding)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {s.lastPurchase ? new Date(s.lastPurchase).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <Link
                            href={`/suppliers/${s.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-bold transition-colors"
                          >
                            <Eye size={12} /> Ledger Overview
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
                    <span className="font-bold text-slate-900">{meta.total}</span> total profiles)
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

      {/* NEW SUPPLIER DRAWER MODAL */}
      {newSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNewSupplierOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">New Wholesale Supplier Registration</h3>
              <button onClick={() => setNewSupplierOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {saveError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Supplier Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. ABC Distributors"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Company Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. ABC Distributors Pvt Ltd"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Tax / GSTIN Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  placeholder="e.g. 29AAAAA0000A1Z1"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email ID</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. supplier@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Address</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
                  placeholder="Street address, city, state..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Internal Notes</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none resize-none h-16"
                  placeholder="Supplier terms, delivery routes, payment windows..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewSupplierOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Quick component imports matching UI X buttons
function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
