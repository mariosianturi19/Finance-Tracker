'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatDate } from '@/lib/timezone';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight, Calendar, Target, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useRouter } from 'next/navigation';

const COLORS = ['#059669', '#dc2626', '#d97706', '#2563eb', '#7c3aed', '#059669'];

interface WeeklyData {
  week: string;
  pemasukan: number;
  pengeluaran: number;
  net: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface RecentTransaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, currentDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Format untuk YYYY-MM
      const currentMonth = formatSelectedMonth(currentDate);
      
      // Fetch transactions for current month
      const { data: monthTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', `${currentMonth}-01`)
        .lte('date', `${currentMonth}-31`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionsData = monthTransactions || [];
      setTransactions(transactionsData);

      // Process weekly data for current month
      const weeklyMap = generateWeeklyData(transactionsData, currentDate);
      setWeeklyData(weeklyMap);

      // Process category data for current month
      const categoryDataArray = processCategoryData(transactionsData);
      setCategoryData(categoryDataArray);

      // Get recent transactions (last 5 from current month)
      const recent = transactionsData.slice(0, 5).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        note: t.note,
      }));
      setRecentTransactions(recent);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSelectedMonth = (date: Date): string => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  };

  const generateWeeklyData = (transactions: Transaction[], date: Date): WeeklyData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and calculate weeks
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks: WeeklyData[] = [];
    
    // Generate 4 weeks
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(year, month, (week - 1) * 7 + 1);
      const weekEnd = new Date(year, month, week * 7);
      
      // Adjust for month boundaries
      if (weekStart < firstDay) weekStart.setDate(firstDay.getDate());
      if (weekEnd > lastDay) weekEnd.setDate(lastDay.getDate());
      
      const weekTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= weekStart && transDate <= weekEnd;
      });
      
      const pemasukan = weekTransactions
        .filter(t => t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pengeluaran = weekTransactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);
      
      weeks.push({
        week: `Minggu ${week}`,
        pemasukan,
        pengeluaran,
        net: pemasukan - pengeluaran,
      });
    }
    
    return weeks;
  };

  const processCategoryData = (transactions: Transaction[]): CategoryData[] => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'pengeluaran')
      .forEach(transaction => {
        const existing = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, existing + transaction.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

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
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'pengeluaran')  
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

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
              Berikut ringkasan keuangan Anda - {formatMonthYear(currentDate)}
            </p>
          </div>
          <Button onClick={() => router.push('/transactions')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
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

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Monthly Income */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pemasukan {formatMonthYear(currentDate)}
              </CardTitle>
              <div className="p-2 bg-emerald-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalIncome)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {transactions.filter(t => t.type === 'pemasukan').length} transaksi
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Expense */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pengeluaran {formatMonthYear(currentDate)}
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {transactions.filter(t => t.type === 'pengeluaran').length} transaksi
              </div>
            </CardContent>
          </Card>

          {/* Monthly Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo {formatMonthYear(currentDate)}
              </CardTitle>
              <div className={`p-2 rounded-full ${
                balance >= 0 ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                <CreditCard className={`h-4 w-4 ${
                  balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                balance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(balance)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {formatMonthYear(currentDate)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tren Mingguan - {formatMonthYear(currentDate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="week" 
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }
                        return value.toString();
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        formatCurrency(value), 
                        name === 'pemasukan' ? 'Pemasukan' : 
                        name === 'pengeluaran' ? 'Pengeluaran' : 'Net'
                      ]}
                      labelStyle={{ color: '#1f2937' }}
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pemasukan" 
                      stackId="1"
                      stroke="#059669" 
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pengeluaran" 
                      stackId="2"
                      stroke="#dc2626" 
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Kategori Pengeluaran
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatMonthYear(currentDate)}
              </p>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Belum ada pengeluaran bulan ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaksi Terbaru - {formatMonthYear(currentDate)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {recentTransactions.length} dari {transactions.length} transaksi
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/transactions')}
            >
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'pemasukan' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'pemasukan' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                        {transaction.note && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                            {transaction.note}
                          </p>
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
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/transactions')}>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Tambah Transaksi</h3>
                <p className="text-sm text-muted-foreground">Catat pemasukan atau pengeluaran</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/reports')}>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Lihat Laporan</h3>
                <p className="text-sm text-muted-foreground">Analisis keuangan mendalam</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/budgets')}>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-2">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Atur Budget</h3>
                <p className="text-sm text-muted-foreground">Kelola anggaran bulanan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}