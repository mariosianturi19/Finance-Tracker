// components/layouts/dashboard-layout.tsx
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/navigation/sidebar';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Only redirect if not already on auth pages
      const isAuthPage = ['/login', '/register'].includes(pathname);
      if (!isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Open sidebar when mouse is near left edge (within 50px)
      if (e.clientX <= 50 && !sidebarOpen) {
        setSidebarOpen(true);
      }
      // Close sidebar when mouse moves away from sidebar area (beyond 300px from left)
      else if (e.clientX > 300 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Add event listener for mouse movement
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main 
        className={`flex-1 overflow-y-auto pb-16 md:pb-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}