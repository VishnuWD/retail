'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, ChevronRight, Loader2, AlertTriangle, FileText, ArrowUpRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function BillingPage() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const json = await apiClient.get('/api/settings/billing');
      if (json.success && json.data) {
        setBilling(json.data);
      } else {
        throw new Error(json.error?.message || 'Failed to fetch billing info.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handlePlanChange = async (planKey, isUpgrade) => {
    try {
      setSubmitting(true);
      const json = await apiClient.post('/api/settings/billing', {
        action: isUpgrade ? 'UPGRADE' : 'DOWNGRADE',
        targetPlan: planKey
      });

      if (!json.success) throw new Error(json.error?.message || 'Subscription update failed.');

      alert(json.message || 'Subscription updated successfully!');
      fetchBilling();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      setSubmitting(true);
      const json = await apiClient.post('/api/settings/billing', { action: 'CANCEL' });

      if (!json.success) throw new Error(json.error?.message || 'Cancellation failed.');

      alert(json.message || 'Subscription cancelled');
      fetchBilling();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResume = async () => {
    try {
      setSubmitting(true);
      const json = await apiClient.post('/api/settings/billing', { action: 'RESUME' });

      if (!json.success) throw new Error(json.error?.message || 'Resuming failed.');

      alert(json.message || 'Subscription resumed');
      fetchBilling();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 border border-red-200 text-red-600 max-w-lg mx-auto mt-8">
        <h3 className="font-bold">Error Loading Billing</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const { 
    plan = 'PRO', 
    status = 'ACTIVE', 
    nextBillingDate = new Date().toISOString(), 
    limits = { products: 5000, staff: 10, sales: 100000, locations: 5 }, 
    usage = { products: 0, staff: 3, sales: 0, locations: 1 } 
  } = billing || {};

  const getPercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const plansList = [
    { key: 'FREE', name: 'Free', price: '₹0/mo', desc: 'Single store start' },
    { key: 'STARTER', name: 'Starter', price: '₹499/mo', desc: 'Growing retail shop' },
    { key: 'GROWTH', name: 'Growth', price: '₹1,299/mo', desc: 'Multi-store operations' },
    { key: 'PRO', name: 'Pro Retailer', price: '₹2,999/mo', desc: 'API & integrations' },
    { key: 'ENTERPRISE', name: 'Enterprise', price: 'Custom', desc: 'Scale and offline operations' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Workspace Subscription</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {plan} Plan • {status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Next billing date: {new Date(nextBillingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {status === 'ACTIVE' ? (
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50"
            >
              Resume Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Products Active', used: usage.products, limit: limits.products, label: 'products' },
          { title: 'Staff Accounts', used: usage.staff, limit: limits.staff, label: 'staff' },
          { title: 'Sales (This Month)', used: usage.sales, limit: limits.sales, label: 'sales' },
          { title: 'Store Locations', used: usage.locations, limit: limits.locations, label: 'locations' }
        ].map((item, idx) => {
          const pct = getPercentage(item.used, item.limit);
          const isOver = item.used > item.limit;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">{item.title}</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{item.used}</span>
                <span className="text-slate-400 text-xs font-medium">limit: {item.limit}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-indigo-600'}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={`${isOver ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                  {pct}% Utilized
                </span>
                {isOver && (
                  <span className="text-red-500 flex items-center gap-1 font-semibold">
                    <AlertTriangle size={12} /> Limit Exceeded
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Downsize Graceful Notification */}
      {Object.keys(limits).some(key => usage[key] > limits[key]) && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-amber-800 text-sm flex gap-3 items-start">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Plan Quota Exceeded (Graceful Downgrade Protection)</div>
            <div className="mt-1 text-amber-700">
              Your usage currently exceeds the limits of your active tier. While we do **not** delete any records, you will be restricted from adding new items or staff until your usage falls below the thresholds or you upgrade.
            </div>
          </div>
        </div>
      )}

      {/* Pricing Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" /> Choose Subscription Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {plansList.map((p) => {
            const isCurrent = plan === p.key;
            return (
              <div
                key={p.key}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                </div>
                <div className="mt-4">
                  <div className="text-xl font-extrabold text-slate-900">{p.price}</div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full mt-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-lg text-center"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanChange(p.key, plansList.findIndex(x => x.key === p.key) > plansList.findIndex(x => x.key === plan))}
                      disabled={submitting}
                      className="w-full mt-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 rounded-lg text-center transition-all"
                    >
                      Select Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="text-indigo-600" /> Subscription Invoices
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Invoice Number</th>
                <th className="px-6 py-3">Billing Period</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">#KOS-2026-003</td>
                <td className="px-6 py-4">Jul 1, 2026 - Aug 1, 2026</td>
                <td className="px-6 py-4">₹499.00</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">Paid</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-indigo-600 hover:text-indigo-900 font-semibold flex items-center gap-1">
                    Download PDF <ArrowUpRight size={14} />
                  </button>
                </td>
              </tr>
              <tr className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">#KOS-2026-002</td>
                <td className="px-6 py-4">Jun 1, 2026 - Jul 1, 2026</td>
                <td className="px-6 py-4">₹499.00</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">Paid</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-indigo-600 hover:text-indigo-900 font-semibold flex items-center gap-1">
                    Download PDF <ArrowUpRight size={14} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
