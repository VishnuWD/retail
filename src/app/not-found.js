'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  ArrowLeft, 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Users, 
  Settings, 
  HelpCircle 
} from 'lucide-react';
import NotFoundIllustration from '@/components/illustrations/NotFoundIllustration';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function NotFound() {
  const router = useRouter();
  const { t } = useLanguage() || { t: (k, fallback) => fallback };

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
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Retail POS & Kirana</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </header>

      {/* Main Content Area with Vector Illustration */}
      <main className="max-w-xl w-full mx-auto my-auto py-12 flex flex-col items-center text-center">
        
        {/* Animated Vector Illustration */}
        <div className="relative mb-6 transform transition-transform hover:scale-105 duration-300">
          <NotFoundIllustration className="w-72 h-56 sm:w-84 sm:h-64 drop-shadow-md" />
        </div>

        {/* 404 Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80 mb-3 animate-fade-in-up">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse-glow" />
          HTTP 404 • Missing Aisle
        </span>

        {/* Headline & Description */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Oops! Item Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-md">
          The page or product category you are looking for has been moved, restocked under a different SKU, or does not exist in your store directory.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 w-full max-w-sm">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/sales/pos"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-2xs transition-all duration-200 active:scale-95"
          >
            <TrendingUp size={16} className="text-emerald-600" />
            <span>POS Billing</span>
          </Link>
        </div>

        {/* Quick Navigation Destination Tiles */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 w-full">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick Navigation Aisle
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Link
              href="/products"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-semibold transition-all shadow-2xs"
            >
              <Package size={14} className="text-indigo-600 shrink-0" />
              <span className="truncate">Products</span>
            </Link>
            <Link
              href="/customers"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-semibold transition-all shadow-2xs"
            >
              <Users size={14} className="text-emerald-600 shrink-0" />
              <span className="truncate">Khata (Credit)</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-semibold transition-all shadow-2xs"
            >
              <Settings size={14} className="text-amber-600 shrink-0" />
              <span className="truncate">Settings</span>
            </Link>
            <Link
              href="/assistant"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-semibold transition-all shadow-2xs"
            >
              <HelpCircle size={14} className="text-indigo-600 shrink-0" />
              <span className="truncate">AI Assistant</span>
            </Link>
          </div>
        </div>

      </main>

      {/* Footer System Status */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs font-semibold text-slate-400">
        pixelcode.in Retail POS • Next-Generation Point of Sale Platform
      </footer>

    </div>
  );
}
