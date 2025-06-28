'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Target, 
  Wallet,
  User,
  FileText,
  PiggyBank
} from 'lucide-react';

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/transactions',
    icon: Receipt,
    label: 'Transaksi',
  },
  {
    href: '/wallets',
    icon: Wallet,
    label: 'Saldo',
  },
  {
    href: '/reports',
    icon: FileText,
    label: 'Laporan',
  },
  {
    href: '/profile',
    icon: User,
    label: 'Profile',
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 md:hidden shadow-2xl">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-4 px-3 text-xs font-semibold transition-all duration-200 min-h-[64px] rounded-t-xl mx-1",
                isActive
                  ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <Icon className="h-5 w-5 mb-1.5" />
              <span className="text-[10px] leading-tight text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}