// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { getTransactions, Transaction } from '@/lib/transactions';
import { getWallets, getWalletTypeIcon } from '@/lib/wallets';
import { getProfile } from '@/lib/profile';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Wallet,
  Eye,
  EyeOff
} from 'lucide-react';
import { WalletWithBalance } from '@/lib/types';

interface Profile {
  full_name: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBalances, setShowBalances] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData, profileData] = await Promise.all([
        getTransactions(currentDate.getFullYear(), currentDate.getMonth() + 1),
        getWallets(),
        getProfile()
      ]);
      
      setTransactions(transactionsData);
      setWallets(walletsData);
      setProfile(profileData);

      // Redirect to wallet setup if no wallets exist
      if (walletsData.length === 0) {
        router.push('/wallet-setup');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Calculate totals for current month
  const totalIncome = transactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'pengeluaran')  
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyBalance = totalIncome - totalExpense;

  // Calculate total balance across all wallets
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Selamat datang, {profile?.full_name || 'User'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Berikut ringkasan keuangan Anda
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/wallets')}
              className="w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Kelola Saldo
            </Button>
            <Button 
              onClick={() => router.push('/transactions')} 
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Transaksi
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Saldo</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {showBalances ? formatCurrency(totalBalance / 100) : '••••••••'}
            </div>
            
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWalletTypeIcon(wallet.type)}</span>
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {wallet.type === 'ewallet' ? 'E-Wallet' : wallet.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      wallet.current_balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {showBalances 
                        ? formatCurrency(wallet.current_balance / 100) 
                        : '••••••'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pemasukan Bulan Ini
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {showBalances ? formatCurrency(totalIncome / 100) : '••••••'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pengeluaran Bulan Ini
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {showBalances ? formatCurrency(totalExpense / 100) : '••••••'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Selisih Bulan Ini
              </CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                monthlyBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {showBalances 
                  ? `${monthlyBalance >= 0 ? '+' : ''}${formatCurrency(monthlyBalance / 100)}`
                  : '••••••'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Bulan Sebelumnya
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold">{formatMonthYear(currentDate)}</h3>
              <p className="text-sm text-muted-foreground">
                {transactions.length} transaksi
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={currentDate.getMonth() >= new Date().getMonth() && currentDate.getFullYear() >= new Date().getFullYear()}
            >
              Bulan Selanjutnya
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => {
                  const wallet = wallets.find(w => w.id === transaction.wallet_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{transaction.category}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                            {wallet && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  {getWalletTypeIcon(wallet.type)}
                                  {wallet.name}
                                </span>
                              </>
                            )}
                          </div>
                          {transaction.note && (
                            <p className="text-sm text-muted-foreground mt-1">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'pemasukan' 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'pemasukan' ? '+' : '-'}
                          {formatCurrency(transaction.amount / 100)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada transaksi bulan ini</p>
                <Button onClick={() => router.push('/transactions')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Transaksi Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
     </div>
   </DashboardLayout>
 );
}