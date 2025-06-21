// components/navigation/sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Target, 
  Settings, 
  LogOut,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
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
    label: 'Kelola Saldo',
  },
  {
    href: '/reports',
    icon: BarChart3,
    label: 'Laporan',
  },
  {
    href: '/budgets',
    icon: Target,
    label: 'Budget',
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Pengaturan',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ isOpen, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar Trigger Area */}
      <div className="fixed left-0 top-0 w-2 h-full z-30 hidden md:block" />

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card/95 backdrop-blur-sm border-r border-border transition-all duration-300 ease-in-out hidden md:flex flex-col",
        isOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">Finance App</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="opacity-70 hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center justify-center border-b border-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Finance App</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar Indicator */}
      {!isOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden md:block">
          <div className="bg-emerald-600 text-white p-2 rounded-r-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      )}
    </>
  );
}