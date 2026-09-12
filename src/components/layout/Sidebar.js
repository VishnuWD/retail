'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Truck, 
  CreditCard, 
  BarChart3, 
  Settings,
  Store,
  Bot,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useStorage } from '@/lib/storage/StorageContext';

const ALL_NAV_ITEMS = [
  { name: 'Dashboard', key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Products', key: 'products', href: '/products', icon: Package, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Inventory', key: 'inventory', href: '/inventory', icon: Boxes, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Sales (POS)', key: 'sales', href: '/sales/pos', icon: TrendingUp, roles: ['OWNER', 'MANAGER', 'CASHIER', 'ADMIN'] },
  { name: 'Purchases', key: 'purchases', href: '/purchases', icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Customers & Khata', key: 'customers', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Suppliers', key: 'suppliers', href: '/suppliers', icon: Truck, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Expenses', key: 'expenses', href: '/expenses', icon: CreditCard, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Reports', key: 'reports', href: '/reports', icon: BarChart3, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'AI Assistant', key: 'assistant', href: '/assistant', icon: Bot, roles: ['OWNER', 'MANAGER', 'CASHIER', 'ADMIN'] },
  { name: 'Settings', key: 'settings', href: '/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

export default function Sidebar({ userRole }) {
  const pathname = usePathname();
  const { locale, setLocale, languages, t } = useLanguage();
  const { business, storageMode } = useStorage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const effectiveRole = userRole || 'OWNER';
  // Filter navigation items by role
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(effectiveRole));
  const storeName = business?.name || 'Green Mart Kirana';

  const currentLang = languages?.find(l => l.code === locale) || {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  };

  return (
    <aside className="no-print hidden md:flex md:w-64 md:flex-col depth-sidebar h-full flex-shrink-0 select-none z-20" data-no-print>
      {/* Brand Header with depth and logo glow */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/10">
          <Store size={19} className="transition-transform duration-300 hover:scale-110" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-[15px] tracking-tight leading-tight">pixelcode.in</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50/90 px-1.5 py-0.5 rounded-md border border-indigo-100/80">
              Retail POS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links with animated hover, depth pill, and translations */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const translatedName = t(`nav.${item.key}`, item.name);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-50/90 to-indigo-50/40 text-indigo-700 font-bold border border-indigo-200/80 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1'
              }`}
            >
              {/* Active left indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600 shadow-sm shadow-indigo-500/50" />
              )}

              <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30' 
                  : 'text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50/80 group-hover:scale-110'
              }`}>
                <Icon size={16} />
              </div>

              <span className="truncate flex-1 tracking-tight">{translatedName}</span>

              {/* Active subtle pill dot */}
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-xs shadow-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer Section: In-Sidebar Language Switcher & Workspace Details */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 backdrop-blur-sm space-y-2">
        
        {/* IN-SIDEBAR DEDICATED LANGUAGE SETTING WIDGET */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 transition-all duration-200 shadow-2xs group cursor-pointer"
            title="Change Application Language"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Globe size={13} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                  {t('common.language', 'Language')}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight mt-0.5 flex items-center gap-1.5">
                  <span>{currentLang.flag}</span>
                  <span>{currentLang.nativeName}</span>
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${langMenuOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* Popover Language Selector with Indian Languages */}
          {langMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
              <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 divide-y divide-slate-100">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('common.selectLanguage', 'Select Language')}
                </div>
                <div className="pt-1 space-y-0.5 max-h-56 overflow-y-auto">
                  {languages?.map((lang) => {
                    const isSelected = locale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLocale(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 text-indigo-700 font-bold' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">{lang.flag}</span>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{lang.label}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Workspace Card with Depth & Live Status */}
        <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {t('nav.activeWorkspace', 'Active Store')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
              {storageMode === 'local' ? 'Local' : 'Cloud'}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-900 truncate">{storeName}</span>
        </div>

      </div>
    </aside>
  );
}
