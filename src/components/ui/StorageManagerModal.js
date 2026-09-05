'use client';

import { useState, useRef } from 'react';
import { useStorage } from '@/lib/storage/StorageContext';
import { 
  Database, 
  HardDrive, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Server, 
  Zap, 
  ShieldCheck,
  FileJson
} from 'lucide-react';

export default function StorageManagerModal({ isOpen, onClose }) {
  const { 
    storageMode, 
    setStorageMode, 
    stats, 
    resetToDefault, 
    exportBackup, 
    importBackup 
  } = useStorage();

  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importBackup(parsed);
        setMessage({ type: 'success', text: 'Store dataset successfully imported and restored!' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to import: Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all store data to the default Kirana FMCG demo dataset? Any local changes will be replaced.')) {
      resetToDefault();
      setMessage({ type: 'success', text: 'Store reset to default Kirana sample catalog & records.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Data & Sync Manager</h3>
              <p className="text-xs text-slate-500 font-medium">Store Data Backup & Cloud Synchronization</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Notification Alert */}
          {message && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 text-red-600" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Mode Selector Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Working Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Local Storage Option */}
              <button
                type="button"
                onClick={() => {
                  setStorageMode('local');
                  setMessage({ type: 'success', text: 'Switched to Offline Mode (Instant & works without internet)' });
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  storageMode === 'local'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className={storageMode === 'local' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="font-bold text-sm text-slate-900">Offline Mode</span>
                  </div>
                  {storageMode === 'local' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Fast device storage. Works completely offline with zero setup required.
                </p>
              </button>

              {/* Cloud Database Option */}
              <button
                type="button"
                onClick={() => {
                  setStorageMode('cloud');
                  setMessage({ type: 'success', text: 'Switched to Cloud Sync Mode' });
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  storageMode === 'cloud'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Server size={16} className={storageMode === 'cloud' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="font-bold text-sm text-slate-900">Cloud Sync</span>
                  </div>
                  {storageMode === 'cloud' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Syncs with central online server. Seamlessly works offline when network is down.
                </p>
              </button>

            </div>
          </div>

          {/* Storage Metrics Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive size={14} className="text-slate-400" /> Storage Statistics
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                {stats.totalSizeKB} KB used
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-extrabold text-slate-900">{stats.counts?.kirana_products || 16}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Products</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-extrabold text-slate-900">{stats.counts?.kirana_sales || 4}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Invoices</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-extrabold text-slate-900">{stats.counts?.kirana_customers || 5}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Customers</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-extrabold text-slate-900">{stats.counts?.kirana_expenses || 3}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Expenses</div>
              </div>
            </div>
          </div>

          {/* Backup, Restore & Reset Actions */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Backup & Management
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Export JSON */}
              <button
                type="button"
                onClick={exportBackup}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-sm"
              >
                <Download size={14} className="text-indigo-600" /> Export JSON Backup
              </button>

              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-sm"
              >
                <Upload size={14} className="text-emerald-600" /> Import JSON Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />

            </div>

            {/* Reset to Demo */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors mt-2"
            >
              <RotateCcw size={14} /> Reset to Fresh Kirana FMCG Demo Dataset
            </button>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" /> Safe Client Persistence
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
