'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  Calendar, 
  User, 
  Settings,
  Wallet,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: CreditCard },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/profile', label: 'Profil', icon: User },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      toast.success('Berhasil keluar');
    } catch (error) {
      toast.error('Gagal keluar');
    }
  };

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold">Finance App</span>
      </div>
      
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}