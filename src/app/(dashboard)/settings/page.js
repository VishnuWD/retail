'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  Settings, 
  Save, 
  Check, 
  Loader2, 
  AlertCircle, 
  Store, 
  Cpu, 
  Printer, 
  Users, 
  UserPlus, 
  Trash2, 
  KeyRound, 
  X 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useStorage } from '@/lib/storage/StorageContext';
import { Database, Download, Upload, RotateCcw, Zap, Server } from 'lucide-react';

const INDUSTRY_PROFILES = {
  Grocery: {
    expiryTracking: true,
    serialTracking: false,
    weightedProducts: true,
    sizeColorVariations: false,
    label: "Grocery & Kirana Store",
    desc: "Enables stock batch expiry tracking and weighted items (e.g. rice, pulses)."
  },
  Clothing: {
    expiryTracking: false,
    serialTracking: false,
    weightedProducts: false,
    sizeColorVariations: true,
    label: "Apparel & Garments Boutique",
    desc: "Enables size and color SKU variant attributes."
  },
  Electronics: {
    expiryTracking: false,
    serialTracking: true,
    weightedProducts: false,
    sizeColorVariations: false,
    label: "Consumer Electronics Shop",
    desc: "Enables serial number scanning, tracking, and warranty validation."
  },
  Hardware: {
    expiryTracking: false,
    serialTracking: false,
    weightedProducts: true,
    sizeColorVariations: false,
    label: "Paint & Hardware Store",
    desc: "Enables decimal weights, batch counts, and wholesale volume pricing tiers."
  }
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const { 
    storageMode, 
    setStorageMode, 
    stats, 
    resetToDefault, 
    exportBackup, 
    importBackup,
    business: storageBiz,
    updateBusiness: updateStorageBiz
  } = useStorage();
  
  // Store details state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [logo, setLogo] = useState('');
  const [capabilities, setCapabilities] = useState({});
  const [activeProfile, setActiveProfile] = useState('Grocery');

  // Printing configurations
  const [printPaperSize, setPrintPaperSize] = useState('58mm');
  const [printAdapter, setPrintAdapter] = useState('USB');

  // Staff accounts state
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CASHIER');
  const [staffError, setStaffError] = useState(null);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const json = await apiClient.get('/api/settings');
      
      const biz = json.data?.business || json.data || storageBiz || {};
      setName(biz.name || 'Green Mart Kirana & Superstore');
      setLegalName(biz.legalName || 'Green Mart Retail LLP');
      setPhone(biz.phone || '+91 98765 43210');
      setEmail(biz.email || 'contact@greenmart.in');
      setAddress(biz.address || 'Shop 12-14, Ground Floor, Central Market, Indiranagar, Bengaluru');
      setTaxNumber(biz.taxNumber || '29ABCDE1234F1Z5');
      setCurrency(biz.currency || 'INR');
      setLogo(biz.logo || '');
      
      const activeCaps = biz.capabilities || {};
      setCapabilities(activeCaps);

      // Load print configs from capabilities JSON
      setPrintPaperSize(activeCaps.printPaperSize || '58mm');
      setPrintAdapter(activeCaps.printAdapter || 'USB');

      setActiveProfile('Grocery');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      const json = await apiClient.get('/api/settings/staff');
      if (json.success && json.data) {
        const list = Array.isArray(json.data) ? json.data : (json.data.staff || []);
        setStaff(list);
      } else {
        setStaff([
          { id: '1', name: 'Ramesh Sharma', email: 'ramesh@greenmart.in', role: 'OWNER' },
          { id: '2', name: 'Priya Verma', email: 'priya@greenmart.in', role: 'MANAGER' },
          { id: '3', name: 'Suresh Kumar', email: 'suresh@greenmart.in', role: 'CASHIER' }
        ]);
      }
    } catch (err) {
      setStaff([
        { id: '1', name: 'Ramesh Sharma', email: 'ramesh@greenmart.in', role: 'OWNER' },
        { id: '2', name: 'Priya Verma', email: 'priya@greenmart.in', role: 'MANAGER' },
        { id: '3', name: 'Suresh Kumar', email: 'suresh@greenmart.in', role: 'CASHIER' }
      ]);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadStaff();
  }, []);

  const handleSelectProfile = (profileName) => {
    setActiveProfile(profileName);
    const profileCaps = INDUSTRY_PROFILES[profileName];
    const newCaps = {
      ...capabilities,
      expiryTracking: profileCaps.expiryTracking,
      serialTracking: profileCaps.serialTracking,
      weightedProducts: profileCaps.weightedProducts,
      sizeColorVariations: profileCaps.sizeColorVariations
    };
    setCapabilities(newCaps);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    // Merge print settings into capabilities JSON
    const mergedCapabilities = {
      ...capabilities,
      printPaperSize,
      printAdapter
    };

    const payload = {
      name,
      legalName,
      phone,
      email,
      address,
      taxNumber,
      currency,
      logo,
      capabilities: mergedCapabilities
    };

    try {
      if (updateStorageBiz) {
        updateStorageBiz(payload);
      }
      const json = await apiClient.post('/api/settings', payload);

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to save settings.');
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError(null);
    setIsCreatingStaff(true);

    try {
      const payload = {
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword || 'Password123!',
        role: newStaffRole
      };

      const res = await apiClient.post('/api/settings/staff', payload);
      if (res.success) {
        if (Array.isArray(res.data)) {
          setStaff(res.data);
        } else {
          setStaff(prev => [...prev, res.data || { id: `staff_${Date.now()}`, ...payload }]);
        }
      } else {
        throw new Error(res.error?.message || 'Failed to add staff member');
      }

      setStaffModalOpen(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffRole('CASHIER');
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Shop Settings & Configurations</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Edit store metadata, configure receipt printing options, and manage staff accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-semibold">
        
        {/* Left Columns (Shop details & printer) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Business Profile Metadata */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Store size={18} className="text-indigo-600" /> Store Profile & Metadata
            </h3>

            {submitError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg flex gap-2 items-center text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div>
                <label className="uppercase tracking-wide">Display Shop Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  placeholder="e.g. Kirana Store"
                />
              </div>

              <div>
                <label className="uppercase tracking-wide">Registered Legal Entity Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  placeholder="Legal entity trade name"
                />
              </div>

              <div>
                <label className="uppercase tracking-wide">GSTIN / Tax Number</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>

              <div>
                <label className="uppercase tracking-wide">Active Currency Term</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="INR">Rupee (₹ INR)</option>
                  <option value="USD">Dollar ($ USD)</option>
                  <option value="EUR">Euro (€ EUR)</option>
                  <option value="GBP">Pound (£ GBP)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="uppercase tracking-wide">Business Logo URL</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="uppercase tracking-wide">Business Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="uppercase tracking-wide">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="uppercase tracking-wide">Shop Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : submitSuccess ? (
                  <Check size={12} />
                ) : (
                  <Save size={12} />
                )} Save Settings
              </button>
            </div>
          </div>

          {/* Receipt Printing configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Printer size={18} className="text-indigo-600" /> Receipt Printing Setup
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div>
                <label className="uppercase tracking-wide">Paper Roll Width Size</label>
                <select
                  value={printPaperSize}
                  onChange={(e) => setPrintPaperSize(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="58mm">58mm (Standard POS Thermal)</option>
                  <option value="80mm">80mm (Wide Desktop Thermal)</option>
                </select>
              </div>

              <div>
                <label className="uppercase tracking-wide">Local Print Adapter Connection</label>
                <select
                  value={printAdapter}
                  onChange={(e) => setPrintAdapter(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="USB">USB Cable Print Queue</option>
                  <option value="Bluetooth">Bluetooth Adapter Connection</option>
                  <option value="Network">WiFi / LAN Network Print IP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Staff Accounts Listing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users size={18} className="text-indigo-600" /> Staff Roles & Accounts
              </h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-bold transition-all"
              >
                <UserPlus size={14} /> Add Staff Account
              </button>
            </div>

            {staffLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {staff.map((member) => (
                  <div key={member.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{member.name}</span>
                      <span className="text-slate-400 block text-[10px]">{member.email}</span>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      member.role === 'OWNER' ? 'bg-red-50 text-red-600 border border-red-100' :
                      member.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      member.role === 'INVENTORY' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-50 text-slate-500 border border-slate-150'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Storage Management & Capability configured profiles */}
        <div className="space-y-6 self-start">
          
          {/* Integrated Storage & Backup Management */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Database size={18} className="text-indigo-600" /> Integrated Data & Storage
            </h3>

            {/* Current Engine Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Engine Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  storageMode === 'local' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {storageMode === 'local' ? 'Offline Mode (Active)' : 'Cloud Sync'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {storageMode === 'local' 
                  ? 'Store data is saved on this device and works without internet.' 
                  : 'Connected to central store server with automatic offline backup.'}
              </p>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStorageMode('local')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  storageMode === 'local' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Zap size={14} className="text-amber-500" /> Offline Mode
              </button>

              <button
                type="button"
                onClick={() => setStorageMode('cloud')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  storageMode === 'cloud' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Server size={14} className="text-indigo-600" /> Cloud Sync
              </button>
            </div>

            {/* Storage Usage Stats */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
              <span>Device Storage Used</span>
              <span className="font-bold text-slate-900">{stats?.totalSizeKB || '0'} KB</span>
            </div>

            {/* Actions: Export / Import / Reset */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportBackup}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
                >
                  <Download size={13} className="text-indigo-600" /> Export Backup
                </button>
                <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer">
                  <Upload size={13} className="text-emerald-600" /> Import Backup
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const r = new FileReader();
                      r.onload = (ev) => {
                        try {
                          importBackup(JSON.parse(ev.target.result));
                          alert('Store backup restored successfully!');
                        } catch {
                          alert('Invalid JSON file');
                        }
                      };
                      r.readAsText(file);
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset store records to initial Kirana FMCG demo catalog?')) {
                    resetToDefault();
                    alert('Store data successfully reset to default Kirana dataset.');
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
              >
                <RotateCcw size={13} /> Reset to Demo Kirana Data
              </button>
            </div>
          </div>

          {/* Industry Profiles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
                <Cpu size={18} className="text-indigo-600" /> Industry Sector Profile
              </h3>
              
              <div className="space-y-3 mt-4">
                {Object.entries(INDUSTRY_PROFILES).map(([key, data]) => (
                  <div
                    key={key}
                    onClick={() => handleSelectProfile(key)}
                    className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                      activeProfile === key 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/10' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900">{data.label}</span>
                      {activeProfile === key && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{data.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CREATE STAFF MODAL */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setStaffModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">Register Staff Account</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {staffError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg flex gap-2 items-center text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Login Email *</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. ramesh@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Role Permissions *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="CASHIER">Cashier (POS Checkout billing access)</option>
                  <option value="INVENTORY">Inventory Staff (Catalog & warehouse levels access)</option>
                  <option value="MANAGER">Manager (Full operational management control)</option>
                  <option value="OWNER">Owner (Full administrative business access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Login Password *</label>
                <input
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {isCreatingStaff && <Loader2 size={12} className="animate-spin" />} Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
