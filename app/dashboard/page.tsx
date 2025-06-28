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
  EyeOff,
  FileText,
  BarChart3,
  Filter,
  Download,
  Brain,
  AlertTriangle,
  Lightbulb,
  Zap,
  TrendingDownIcon,
  TrendingUpIcon,
  Activity
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

  // AI Analysis Functions
  const analyzeSpendingPatterns = () => {
    if (transactions.length === 0) return null;

    // Analyze spending by day of week
    const daySpending = transactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((acc, t) => {
        const day = new Date(t.date).getDay();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = dayNames[day];
        acc[dayName] = (acc[dayName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const highestSpendingDay = Object.keys(daySpending).reduce((a, b) => 
      daySpending[a] > daySpending[b] ? a : b, '');

    // Analyze spending velocity (frequency)
    const last30Days = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo && t.type === 'pengeluaran';
    });

    const spendingVelocity = last30Days.length / 30; // transactions per day

    return {
      highestSpendingDay,
      spendingVelocity: Math.round(spendingVelocity * 10) / 10,
      daySpending
    };
  };

  const detectUnusualSpending = () => {
    if (transactions.length < 10) return [];

    const expenses = transactions.filter(t => t.type === 'pengeluaran');
    const averageExpense = expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length;
    const unusualThreshold = averageExpense * 2;

    const unusualTransactions = expenses
      .filter(t => t.amount > unusualThreshold)
      .slice(0, 3)
      .map(t => ({
        ...t,
        isUnusual: true,
        percentageAboveAverage: Math.round(((t.amount - averageExpense) / averageExpense) * 100)
      }));

    return unusualTransactions;
  };

  const generateSmartSuggestions = () => {
    const suggestions = [];

    // Category optimization suggestions
    const categorySpending = transactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.keys(categorySpending).reduce((a, b) => 
      categorySpending[a] > categorySpending[b] ? a : b, '');

    if (topCategory && categorySpending[topCategory] > totalExpense * 0.4) {
      suggestions.push({
        type: 'optimization',
        title: 'Optimisasi Kategori Utama',
        description: `${Math.round((categorySpending[topCategory] / totalExpense) * 100)}% pengeluaran Anda untuk ${topCategory}. Pertimbangkan untuk mengurangi 10-15%.`,
        severity: 'medium'
      });
    }

    // Income vs expense analysis
    if (totalExpense > totalIncome) {
      suggestions.push({
        type: 'alert',
        title: 'Defisit Keuangan Terdeteksi',
        description: `Pengeluaran melebihi pemasukan sebesar ${formatCurrency((totalExpense - totalIncome) / 100)}. Segera review pengeluaran!`,
        severity: 'high'
      });
    }

    // Low savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    if (savingsRate < 20 && savingsRate > 0) {
      suggestions.push({
        type: 'improvement',
        title: 'Tingkatkan Tingkat Tabungan',
        description: `Tingkat tabungan Anda ${Math.round(savingsRate)}%. Target ideal adalah 20-30% dari pemasukan.`,
        severity: 'medium'
      });
    }

    // High frequency spending
    const pattern = analyzeSpendingPatterns();
    if (pattern && pattern.spendingVelocity > 5) {
      suggestions.push({
        type: 'behavioral',
        title: 'Frekuensi Pengeluaran Tinggi',
        description: `Anda melakukan ${pattern.spendingVelocity} transaksi per hari. Pertimbangkan perencanaan belanja mingguan.`,
        severity: 'low'
      });
    }

    return suggestions.slice(0, 4);
  };

  const predictNextMonthSpending = () => {
    if (transactions.length < 5) return null;

    const monthlyExpenses = transactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const dailyAverage = monthlyExpenses / currentDay;
    
    const predictedMonthly = dailyAverage * daysInMonth;
    const currentMonthRemaining = dailyAverage * (daysInMonth - currentDay);

    return {
      predictedTotal: predictedMonthly,
      remainingBudget: currentMonthRemaining,
      dailyAverage
    };
  };

  const spendingPatterns = analyzeSpendingPatterns();
  const unusualSpending = detectUnusualSpending();
  const smartSuggestions = generateSmartSuggestions();
  const prediction = predictNextMonthSpending();

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
      <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50/30 to-slate-100/20 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Selamat datang, {profile?.full_name || 'User'}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Ringkasan keuangan Anda hari ini
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/wallets')}
              className="w-full sm:w-auto border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Kelola Saldo
            </Button>
            <Button 
              onClick={() => router.push('/transactions')} 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Transaksi
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Total Saldo</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              {showBalances ? formatCurrency(totalBalance / 100) : '••••••••'}
            </div>
            
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getWalletTypeIcon(wallet.type)}</span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{wallet.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                        {wallet.type === 'ewallet' ? 'E-Wallet' : wallet.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${
                      wallet.current_balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Pemasukan Bulan Ini
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {showBalances ? formatCurrency(totalIncome / 100) : '••••••'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Pengeluaran Bulan Ini
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                {showBalances ? formatCurrency(totalExpense / 100) : '••••••'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Selisih Bulan Ini
              </CardTitle>
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                monthlyBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
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
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Bulan Sebelumnya
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMonthYear(currentDate)}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {transactions.length} transaksi
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={currentDate.getMonth() >= new Date().getMonth() && currentDate.getFullYear() >= new Date().getFullYear()}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              Bulan Selanjutnya
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/transactions')}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Tambah Transaksi</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Catat baru</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/wallets')}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Kelola Saldo</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Atur wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/reports')}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Laporan PDF</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Download laporan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Profile</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Kelola akun</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending by Category */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pengeluaran per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const expenseCategories = transactions
                  .filter(t => t.type === 'pengeluaran')
                  .reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                  }, {} as Record<string, number>);
                
                const sortedCategories = Object.entries(expenseCategories)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5);

                const maxAmount = Math.max(...sortedCategories.map(([, amount]) => amount));

                return sortedCategories.length > 0 ? (
                  <div className="space-y-4">
                    {sortedCategories.map(([category, amount]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{category}</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {showBalances ? formatCurrency(amount / 100) : '••••••'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(amount / maxAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">Belum ada pengeluaran bulan ini</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Income vs Expense Trend */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tren Keuangan (7 Hari Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const last7Days = Array.from({length: 7}, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  return date;
                });

                const dailyData = last7Days.map(date => {
                  const dayTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.toDateString() === date.toDateString();
                  });
                  
                  return {
                    date: date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' }),
                    income: dayTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0),
                    expense: dayTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0)
                  };
                });

                const maxDaily = Math.max(
                  ...dailyData.map(d => Math.max(d.income, d.expense))
                );

                return (
                  <div className="space-y-4">
                    {dailyData.map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{day.date}</span>
                          <div className="flex gap-4 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +{showBalances ? formatCurrency(day.income / 100) : '••••'}
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                              -{showBalances ? formatCurrency(day.expense / 100) : '••••'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 h-2">
                          <div className="bg-slate-200 dark:bg-slate-700 rounded-l-full relative overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-l-full transition-all duration-500"
                              style={{ width: maxDaily > 0 ? `${(day.income / maxDaily) * 100}%` : '0%' }}
                            />
                          </div>
                          <div className="bg-slate-200 dark:bg-slate-700 rounded-r-full relative overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-r-full transition-all duration-500"
                              style={{ width: maxDaily > 0 ? `${(day.expense / maxDaily) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Insights */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Insights Lanjutan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Average Daily Spending */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Rata-rata Harian</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {showBalances ? formatCurrency((totalExpense / Math.max(new Date().getDate(), 1)) / 100) : '••••••'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pengeluaran per hari</p>
              </div>

              {/* Most Used Category */}
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-xl">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Filter className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Kategori Utama</h4>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 break-words">
                  {(() => {
                    const categories = transactions.reduce((acc, t) => {
                      acc[t.category] = (acc[t.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const topCategory = Object.keys(categories).reduce((a, b) => 
                      categories[a] > categories[b] ? a : b, 'Belum ada');
                    return topCategory;
                  })()}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Paling sering digunakan</p>
              </div>

              {/* Biggest Expense */}
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 rounded-xl">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Pengeluaran Terbesar</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {(() => {
                    const maxExpense = transactions
                      .filter(t => t.type === 'pengeluaran')
                      .reduce((max, t) => Math.max(max, t.amount), 0);
                    return showBalances ? formatCurrency(maxExpense / 100) : '••••••';
                  })()}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Transaksi tunggal</p>
              </div>

              {/* Monthly Progress */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Efisiensi Keuangan</h4>
                <p className={`text-2xl font-bold ${
                  monthlyBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {showBalances ? 
                    `${Math.round(totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0)}%`
                    : '••••'
                  }
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {monthlyBalance >= 0 ? 'Surplus ratio' : 'Defisit ratio'}
                </p>
              </div>
            </div>

            {/* Financial Health Score */}
            <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Skor Kesehatan Keuangan</h4>
                <Badge 
                  variant="secondary" 
                  className={`${
                    monthlyBalance >= totalIncome * 0.2 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    monthlyBalance >= 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                >
                  {monthlyBalance >= totalIncome * 0.2 ? 'Sangat Baik' :
                   monthlyBalance >= 0 ? 'Baik' : 'Perlu Perbaikan'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Progress tabungan bulan ini</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      monthlyBalance >= totalIncome * 0.2 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                      monthlyBalance >= 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.max(totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0, 0), 100)}%` 
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 mt-4">
                  <div className="text-center">
                    <span className="block font-medium text-slate-900 dark:text-slate-100">
                      {transactions.filter(t => t.type === 'pemasukan').length}
                    </span>
                    <span>Pemasukan</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-medium text-slate-900 dark:text-slate-100">
                      {transactions.filter(t => t.type === 'pengeluaran').length}
                    </span>
                    <span>Pengeluaran</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-medium text-slate-900 dark:text-slate-100">
                      {new Set(transactions.map(t => t.category)).size}
                    </span>
                    <span>Kategori</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Financial Tips */}
        {totalExpense > totalIncome && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Tips Keuangan</h4>
                  <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                    Pengeluaran Anda bulan ini melebihi pemasukan. Coba review kategori pengeluaran terbesar dan cari area yang bisa dikurangi. 
                    Mulai dengan membuat budget untuk setiap kategori dan pantau pengeluaran harian Anda.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Brain className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              AI Insights & Analisis Cerdas
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Analisis berbasis AI untuk pola keuangan dan rekomendasi personal
            </p>
          </CardHeader>
          <CardContent>
            {/* Spending Pattern Analysis */}
            {spendingPatterns && (
              <div className="mb-8">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Analisis Pola Pengeluaran
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Hari Pengeluaran Tertinggi</h5>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{spendingPatterns.highestSpendingDay}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {showBalances ? formatCurrency(spendingPatterns.daySpending[spendingPatterns.highestSpendingDay] / 100) : '••••••'}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-950/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">Frekuensi Transaksi</h5>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{spendingPatterns.spendingVelocity}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">transaksi per hari</p>
                  </div>
                </div>
              </div>
            )}

            {/* Unusual Spending Alerts */}
            {unusualSpending.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Peringatan Pengeluaran Tidak Biasa
                </h4>
                <div className="space-y-3">
                  {unusualSpending.map((transaction, index) => (
                    <div key={index} className="p-4 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-200/50 dark:border-red-800/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-red-900 dark:text-red-100">{transaction.category}</h5>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {new Date(transaction.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-800 dark:text-red-200">
                            {showBalances ? formatCurrency(transaction.amount / 100) : '••••••'}
                          </p>
                          <Badge variant="destructive" className="text-xs mt-1">
                            +{transaction.percentageAboveAverage}% dari rata-rata
                          </Badge>
                        </div>
                      </div>
                      {transaction.note && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{transaction.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Rekomendasi Cerdas
                </h4>
                <div className="grid gap-4">
                  {smartSuggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border ${
                        suggestion.severity === 'high' 
                          ? 'bg-red-50/50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/50'
                          : suggestion.severity === 'medium'
                          ? 'bg-yellow-50/50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-800/50'
                          : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          suggestion.severity === 'high' 
                            ? 'bg-red-100 dark:bg-red-900/50'
                            : suggestion.severity === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/50'
                            : 'bg-blue-100 dark:bg-blue-900/50'
                        }`}>
                          {suggestion.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                          {suggestion.type === 'optimization' && <Target className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                          {suggestion.type === 'improvement' && <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          {suggestion.type === 'behavioral' && <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <div>
                          <h5 className={`font-medium ${
                            suggestion.severity === 'high' 
                              ? 'text-red-900 dark:text-red-100'
                              : suggestion.severity === 'medium'
                              ? 'text-yellow-900 dark:text-yellow-100'
                              : 'text-blue-900 dark:text-blue-100'
                          }`}>
                            {suggestion.title}
                          </h5>
                          <p className={`text-sm mt-1 ${
                            suggestion.severity === 'high' 
                              ? 'text-red-700 dark:text-red-300'
                              : suggestion.severity === 'medium'
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : 'text-blue-700 dark:text-blue-300'
                          }`}>
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictive Analysis */}
            {prediction && (
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Prediksi Pengeluaran Bulan Ini
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/50 dark:border-purple-800/50 text-center">
                    <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Prediksi Total</h5>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {showBalances ? formatCurrency(prediction.predictedTotal / 100) : '••••••'}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">akhir bulan</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 text-center">
                    <h5 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Sisa Budget Harian</h5>
                    <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      {showBalances ? formatCurrency(prediction.dailyAverage / 100) : '••••••'}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">per hari</p>
                  </div>
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/50 dark:border-teal-800/50 text-center">
                    <h5 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Estimasi Sisa</h5>
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-300">
                      {showBalances ? formatCurrency(prediction.remainingBudget / 100) : '••••••'}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">bulan ini</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Tips */}
            <div className="mt-6 p-4 bg-gradient-to-r from-violet-100/50 to-purple-100/50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl border border-violet-200/50 dark:border-violet-800/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h5 className="font-medium text-violet-900 dark:text-violet-100 mb-2">🤖 AI Assistant</h5>
                  <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                    {smartSuggestions.length > 0 
                      ? "Berdasarkan analisis AI, saya menemukan beberapa area yang bisa dioptimalkan. Ikuti rekomendasi di atas untuk meningkatkan kesehatan keuangan Anda."
                      : spendingPatterns?.spendingVelocity && spendingPatterns.spendingVelocity > 3
                      ? `Anda cukup aktif dalam bertransaksi (${spendingPatterns.spendingVelocity} kali/hari). Pertimbangkan untuk membuat rencana pengeluaran mingguan agar lebih terstruktur.`
                      : "Pola keuangan Anda terlihat sehat! Terus pertahankan kebiasaan baik dalam mengelola keuangan."
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => {
                  const wallet = wallets.find(w => w.id === transaction.wallet_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{transaction.category}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
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
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'pemasukan' 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
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
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-6" />
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">Belum ada transaksi bulan ini</p>
                <Button 
                  onClick={() => router.push('/transactions')}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                >
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