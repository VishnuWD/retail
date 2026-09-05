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

export default function MobileBottomNav({ onOpenMenu }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/sales/pos', icon: TrendingUp },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Khata', href: '/customers', icon: Users },
  ];

  return (
    <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg" data-no-print>
      <div className="grid grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 font-bold' 
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-transform ${isActive ? 'bg-indigo-50 scale-110' : ''}`}>
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-tight truncate">{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition-all"
        >
          <div className="p-1 rounded-lg">
            <Menu size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">More</span>
        </button>
      </div>
    </div>
  );
}
