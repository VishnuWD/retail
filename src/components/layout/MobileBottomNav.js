'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Users, 
  Menu
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MobileBottomNav({ onOpenMenu }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { name: 'Dashboard', key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS Billing', key: 'sales', href: '/sales/pos', icon: TrendingUp },
    { name: 'Products', key: 'products', href: '/products', icon: Package },
    { name: 'Khata', key: 'customers', href: '/customers', icon: Users },
  ];

  return (
    <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]" data-no-print>
      <div className="grid grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const translatedName = t(`nav.${item.key}`, item.name);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-indigo-600 font-bold' 
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-indigo-50 text-indigo-600 scale-110 shadow-2xs' : ''
              }`}>
                <Icon size={19} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-tight truncate max-w-[56px] text-center">
                {translatedName}
              </span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition-all duration-200"
        >
          <div className="p-1.5 rounded-xl">
            <Menu size={19} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
            {t('common.more', 'More')}
          </span>
        </button>
      </div>
    </div>
  );
}
