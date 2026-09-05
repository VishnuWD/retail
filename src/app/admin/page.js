'use client';

import { useState, useEffect } from 'react';
import { Shield, Building2, Terminal, HelpCircle, ToggleLeft, ToggleRight, Loader2, Sparkles, RefreshCw, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('businesses');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // For testing convenience in development
  const [simulatedRole, setSimulatedRole] = useState('ADMIN');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pass simulated role in header for easy local development testing
      const res = await fetch(`/api/admin?tab=${activeTab}`, {
        headers: {
          'x-simulated-platform-role': simulatedRole
        }
      });
      
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      } else {
        throw new Error(json.error?.message || 'Access denied or failed to load platform data.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, simulatedRole]);

  const handleSupportMode = async (businessId) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUPPORT_MODE',
          details: { targetBusinessId: businessId, durationMinutes: 30 }
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to enter Support Mode');

      alert(json.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFlag = async (flagKey, currentStatus) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_FEATURE_FLAG',
          details: { flagKey, active: !currentStatus }
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle flag');

      alert(json.message);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Platform Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white leading-tight">Platform Control Center</h1>
            <p className="text-slate-400 text-xs mt-0.5">SaaS System Administration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs">
            <span className="text-slate-400">Simulate Role:</span>
            <select
              value={simulatedRole}
              onChange={(e) => setSimulatedRole(e.target.value)}
              className="bg-transparent text-indigo-400 font-bold border-none outline-none focus:ring-0 cursor-pointer"
            >
              <option value="PLATFORM_OWNER">PLATFORM_OWNER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="FINANCE">FINANCE</option>
              <option value="ENGINEERING">ENGINEERING</option>
              <option value="READ_ONLY">READ_ONLY</option>
              <option value="OWNER">None (OWNER)</option>
            </select>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white font-medium border-l border-slate-800 pl-4">
            Back to Retail App
          </Link>
        </div>
      </header>

      {/* Admin Panel Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-950/50 border-r border-slate-800 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all ${
              activeTab === 'businesses' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Building2 size={16} /> Businesses & Tenants
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all ${
              activeTab === 'system' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Terminal size={16} /> Jobs & Feature Flags
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <HelpCircle size={16} /> Audit Trail
          </button>
        </aside>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
          {error ? (
            <div className="max-w-md mx-auto bg-red-950/30 border border-red-900 rounded-xl p-6 text-red-400 text-center space-y-4">
              <AlertCircle size={32} className="mx-auto" />
              <div>
                <h3 className="font-bold">Access Restrained</h3>
                <p className="text-xs mt-1 leading-relaxed">
                  {error}. Please verify you have platform operations clearance or toggle the simulated role selector in the header.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: Businesses */}
              {activeTab === 'businesses' && data?.businesses && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Registered Tenants</h2>
                    <button onClick={fetchAdminData} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="overflow-hidden border border-slate-800 rounded-xl">
                    <table className="w-full text-sm text-left text-slate-400">
                      <thead className="text-xs uppercase bg-slate-950 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Tenant Name</th>
                          <th className="px-6 py-4">Owners/Users</th>
                          <th className="px-6 py-4">Subscription Plan</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.businesses.map((biz) => (
                          <tr key={biz.id} className="bg-slate-900/40 border-b border-slate-800/60 hover:bg-slate-800/30">
                            <td className="px-6 py-4 font-bold text-white">
                              <div>{biz.name}</div>
                              <div className="text-xs text-slate-500 font-normal mt-0.5">{biz.city || 'Location unset'}, {biz.country}</div>
                            </td>
                            <td className="px-6 py-4">
                              {biz.users.map((u, i) => (
                                <div key={i} className="text-xs">
                                  {u.name} <span className="text-slate-600">({u.email})</span>
                                </div>
                              ))}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {biz.subscription?.plan || 'FREE'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                biz.subscription?.status === 'ACTIVE' || !biz.subscription
                                  ? 'bg-green-950 text-green-400 border border-green-900'
                                  : 'bg-red-950 text-red-400 border border-red-900'
                              }`}>
                                {biz.subscription?.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleSupportMode(biz.id)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                              >
                                <LogIn size={12} /> Enter Support Mode
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: System Jobs & Feature Flags */}
              {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cron Jobs */}
                  <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" /> Background Cron Scheduler
                    </h2>
                    <div className="space-y-3">
                      {data?.jobs?.map((j, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <div>
                            <div className="text-sm font-bold text-white">{j.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Schedule: {j.schedule}</div>
                          </div>
                          <span className="bg-green-950 text-green-400 text-xs px-2 py-0.5 rounded border border-green-900 font-semibold">
                            {j.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Flags */}
                  <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Terminal size={16} className="text-indigo-500" /> Global Feature Flags
                    </h2>
                    <div className="space-y-3">
                      {data?.featureFlags?.map((f, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <div>
                            <div className="text-sm font-bold text-white">{f.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{f.key}</div>
                          </div>
                          <button onClick={() => handleToggleFlag(f.key, f.active)}>
                            {f.active ? (
                              <ToggleRight className="text-indigo-500" size={32} />
                            ) : (
                              <ToggleLeft className="text-slate-600" size={32} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Audit Trails */}
              {activeTab === 'audit' && data?.auditLogs && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">System Activity Logs</h2>
                  <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/30">
                    <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-slate-950 text-slate-300 border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Business</th>
                            <th className="px-6 py-3">Operator</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 text-xs">
                              <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                                {new Date(log.createdAt).toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-3 font-semibold text-slate-300">
                                {log.business?.name || 'Platform'}
                              </td>
                              <td className="px-6 py-3">
                                {log.user?.name || 'System'}
                              </td>
                              <td className="px-6 py-3 font-bold text-indigo-400">
                                {log.action}
                              </td>
                              <td className="px-6 py-3 text-slate-400">
                                {log.details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
