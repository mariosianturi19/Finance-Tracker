'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  Calendar, 
  User, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: CreditCard },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/profile', label: 'Profil', icon: User },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 mb-1',
                  isActive && 'fill-current'
                )} 
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}