'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, RotateCcw, LayoutDashboard, ChevronDown, AlertTriangle } from 'lucide-react';
import ErrorIllustration from '@/components/illustrations/ErrorIllustration';

export default function GlobalError({ error, reset }) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log unexpected runtime error to console
    console.error('Unhandled Kirana POS Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] bg-pattern-dots flex flex-col justify-between p-4 sm:p-8 select-none">
      
      {/* Top Header Brand */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/10 transition-transform group-hover:scale-105">
            <Store size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-base tracking-tight leading-tight">pixelcode.in</span>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Retail POS & System Recovery</span>
          </div>
        </Link>
      </header>

      {/* Main Recovery Area */}
      <main className="max-w-xl w-full mx-auto my-auto py-10 flex flex-col items-center text-center">
        
        {/* Animated Vector Illustration */}
        <div className="relative mb-6 transform transition-transform hover:scale-105 duration-300">
          <ErrorIllustration className="w-72 h-56 sm:w-84 sm:h-64 drop-shadow-md" />
        </div>

        {/* Warning Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200/80 mb-3 animate-fade-in-up">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-glow" />
          Terminal Recovery Mode
        </span>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          System Interruption
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-md">
          A temporary client-side error interrupted your current session. Your local store data and khata records remain protected and intact.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 w-full max-w-sm">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Reload & Recover</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-2xs transition-all duration-200 active:scale-95"
          >
            <LayoutDashboard size={16} className="text-indigo-600" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Technical Error Details Drawer */}
        <div className="mt-8 w-full max-w-md text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100/70 hover:bg-slate-200/70 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-600" /> Technical Details
            </span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-40 border border-slate-800 shadow-inner">
              <p className="font-bold text-rose-400">{error?.name || 'Error'}: {error?.message || 'An unexpected exception occurred.'}</p>
              {error?.digest && <p className="text-[10px] text-slate-400 mt-1">Digest: {error.digest}</p>}
            </div>
          )}
        </div>

      </main>

      {/* Footer System Status */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs font-semibold text-slate-400">
        pixelcode.in POS Recovery System • Automated Khata & Inventory Resilience
      </footer>

    </div>
  );
}
