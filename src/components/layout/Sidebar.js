'use client';

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
  Zap
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
  const { t } = useLanguage();
  const { business, storageMode } = useStorage();

  const effectiveRole = userRole || 'OWNER';
  // Filter navigation items by role
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(effectiveRole));
  const storeName = business?.name || 'Green Mart Kirana';

  return (
    <aside className="no-print hidden md:flex md:w-64 md:flex-col bg-white border-r border-slate-200 h-full flex-shrink-0" data-no-print>
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
          <Store size={18} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight">pixelcode.in</span>
          <span className="text-[11px] text-slate-500 font-medium">Retail POS</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col gap-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('nav.activeWorkspace') || 'Active Store'}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {storageMode === 'local' ? 'Local' : 'Cloud'}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-900 truncate">{storeName}</span>
        </div>
      </div>
    </aside>
  );
}
