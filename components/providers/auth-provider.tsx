// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  const checkUserWallets = useCallback(async (userId: string) => {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking wallets:', error);
        return true; // Assume wallets exist to prevent infinite redirects
      }

      return wallets && wallets.length > 0;
    } catch (error) {
      console.error('Error checking wallets:', error);
      return true; // Assume wallets exist to prevent infinite redirects
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signOut
  }), [user, loading, signOut]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);

          // Check if user needs wallet setup
          if (session?.user) {
            const hasWallets = await checkUserWallets(session.user.id);
            
            // Only redirect to wallet setup if:
            // 1. User has no wallets
            // 2. Not already on wallet-setup page
            // 3. Not on auth pages (login, register)
            const isAuthPage = ['/login', '/register'].includes(pathname);
            const isWalletSetupPage = pathname === '/wallet-setup';
            
            if (!hasWallets && !isAuthPage && !isWalletSetupPage) {
              router.push('/wallet-setup');
            }
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);

          if (event === 'SIGNED_IN' && session?.user) {
            // Check if new user needs wallet setup
            const hasWallets = await checkUserWallets(session.user.id);
            
            if (!hasWallets && pathname !== '/wallet-setup') {
              router.push('/wallet-setup');
            } else if (hasWallets && pathname === '/wallet-setup') {
              // If user has wallets but on setup page, redirect to dashboard
              router.push('/dashboard');
            }
          } else if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserWallets, router, pathname]);

  // Prevent rendering children until auth state is determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}