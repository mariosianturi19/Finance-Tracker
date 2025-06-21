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
  ChevronRight,
  User
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
    href: '/profile',
    icon: User,
    label: 'Profile',
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
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

      {/* Desktop Sidebar Indicator - Always Visible */}
      <div className={cn(
        "fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden md:block transition-all duration-300",
        isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <div 
          className="bg-emerald-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-emerald-700 transition-all duration-200 cursor-pointer group"
          onClick={() => onOpenChange(true)}
        >
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>

      {/* Collapsed Sidebar Icons - Always Visible */}
      <div className={cn(
        "fixed left-0 top-0 z-35 w-16 h-full bg-card/80 backdrop-blur-sm border-r border-border/50 hidden md:flex flex-col py-4 transition-all duration-300",
        isOpen ? "opacity-0 pointer-events-none -translate-x-full" : "opacity-100 translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-border/50 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Wallet className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg transition-colors group relative",
                  isActive
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Icon */}
        <div className="border-t border-border/50 pt-4 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            title="Keluar"
            className="w-12 h-12 p-0 text-muted-foreground hover:text-foreground relative group"
          >
            <LogOut className="h-5 w-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Keluar
            </div>
          </Button>
        </div>
      </div>
    </>
  );
}