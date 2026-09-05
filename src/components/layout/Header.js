'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  LogOut,
  Store,
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
  Database,
  Zap,
  Server,
  Bot,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useStorage } from '@/lib/storage/StorageContext';
import StorageManagerModal from '@/components/ui/StorageManagerModal';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

const ALL_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Inventory', href: '/inventory', icon: Boxes, roles: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ADMIN'] },
  { name: 'Sales (POS)', href: '/sales/pos', icon: TrendingUp, roles: ['OWNER', 'MANAGER', 'CASHIER', 'ADMIN'] },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Customers & Khata', href: '/customers', icon: Users, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Expenses', href: '/expenses', icon: CreditCard, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { name: 'AI Assistant', href: '/assistant', icon: Bot, roles: ['OWNER', 'MANAGER', 'CASHIER', 'ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

export default function Header({ userName, userRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const { storageMode, session, business } = useStorage();

  const currentUserName = session?.name || userName || 'Ramesh Sharma';
  const currentUserRole = session?.role || userRole || 'OWNER';
  const storeName = business?.name || 'Green Mart Kirana';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/login');
    router.refresh();
  };

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <>
      <header className="no-print flex h-16 w-full items-center justify-between bg-white border-b border-slate-200 px-4 sm:px-6 z-30" data-no-print>
        
        {/* Mobile menu trigger + Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-slate-500 hover:text-slate-900 md:hidden p-1 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Store size={16} />
            </div>
            <span className="font-bold text-slate-900 leading-tight">pixelcode.in</span>
          </div>

          {/* Page title / path display for desktop */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400 capitalize">Green Mart</span>
            <span className="text-sm font-semibold text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-800 capitalize">
              {pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Action icons, Storage mode pill, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Subtle System Status Pill */}
          <button
            type="button"
            onClick={() => setStorageModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Storage & Data Engine Status"
          >
            <span className={`h-2 w-2 rounded-full ${storageMode === 'local' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <span>{storageMode === 'local' ? 'Offline-Ready' : 'Cloud Sync'}</span>
          </button>

          {/* Quick Storefront Link */}
          <Link
            href="/store"
            target="_blank"
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            title="Open Customer-Facing Online Store"
          >
            <Store size={13} />
            <span>Storefront</span>
            <ExternalLink size={10} className="text-indigo-400" />
          </Link>

          {/* Language Selector Dropdown */}
          <div className="flex items-center">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Notifications */}
          <button className="text-slate-400 hover:text-slate-600 relative p-1.5 rounded-lg hover:bg-slate-50">
            <Bell size={18} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          </button>

          {/* User Profile dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shadow-xs">
                {currentUserName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">{currentUserName}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none mt-0.5">{currentUserRole}</span>
              </div>
            </button>

            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-100 divide-y divide-slate-100 text-xs font-semibold">
                  <div className="px-4 py-2.5 bg-slate-50/70">
                    <p className="font-bold text-slate-900 text-sm">{currentUserName}</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{currentUserRole} • {storeName}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setStorageModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <Database size={14} className="text-indigo-600" />
                      <span>Data & Storage Settings</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 font-bold text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Storage Manager Modal */}
      <StorageManagerModal 
        isOpen={storageModalOpen} 
        onClose={() => setStorageModalOpen(false)} 
      />

      {/* MOBILE MENU SLIDEOVER SIDE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding drawer card */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Store size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">Kirana</span>
                  <span className="text-xs text-slate-500 font-medium">Retail System</span>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </>
  );
}
