'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getTransactions, Transaction } from '@/lib/transactions';
import { getWallets } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

interface AnalyticsData {
  monthlyTrends: any[];
  categoryBreakdown: any[];
  dailyTrends: any[];
  insights: {
    avgDailyExpense: number;
    avgMonthlyIncome: number;
    topCategory: string;
    monthlyBalance: number;
    projectedNextMonth: number;
    spendingTrend: 'up' | 'down' | 'stable';
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData] = await Promise.all([
        getTransactions(),
        getWallets()
      ]);

      setTransactions(transactionsData);
      
      // Calculate analytics
      const analytics = calculateAnalytics(transactionsData, selectedPeriod);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (transactions: Transaction[], period: string): AnalyticsData => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 6);
    }

    // Filter transactions by period
    const periodTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate && new Date(t.date) <= now
    );

    // Monthly trends
    const months = eachMonthOfInterval({ start: startDate, end: now });
    const monthlyTrends = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = periodTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0) / 100;
      
      const expense = monthTransactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0) / 100;

      return {
        month: format(month, 'MMM yyyy', { locale: id }),
        income,
        expense,
        balance: income - expense
      };
    });

    // Category breakdown
    const categoryMap = new Map();
    periodTransactions
      .filter(t => t.type === 'pengeluaran')
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount / 100);
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Daily trends for last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const dailyTrends = eachDayOfInterval({ 
      start: last30Days, 
      end: now 
    }).map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return format(tDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const dayExpense = dayTransactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0) / 100;

      return {
        date: format(day, 'dd/MM'),
        expense: dayExpense
      };
    });

    // Calculate insights
    const totalExpenses = periodTransactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0) / 100;
    
    const totalIncome = periodTransactions
      .filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0) / 100;
    
    const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsInPeriod = months.length;
    
    const avgDailyExpense = totalExpenses / daysInPeriod;
    const avgMonthlyIncome = totalIncome / monthsInPeriod;
    
    const topCategory = categoryBreakdown[0]?.category || 'Tidak ada';
    const monthlyBalance = totalIncome - totalExpenses;
    
    // Simple projection: average of last 3 months
    const lastThreeMonths = monthlyTrends.slice(-3);
    const avgExpenseLastThree = lastThreeMonths.reduce((sum, m) => sum + m.expense, 0) / lastThreeMonths.length;
    const projectedNextMonth = avgMonthlyIncome - avgExpenseLastThree;
    
    // Spending trend
    const currentMonth = monthlyTrends[monthlyTrends.length - 1]?.expense || 0;
    const prevMonth = monthlyTrends[monthlyTrends.length - 2]?.expense || 0;
    let spendingTrend: 'up' | 'down' | 'stable' = 'stable';
    
    if (currentMonth > prevMonth * 1.05) spendingTrend = 'up';
    else if (currentMonth < prevMonth * 0.95) spendingTrend = 'down';

    return {
      monthlyTrends,
      categoryBreakdown,
      dailyTrends,
      insights: {
        avgDailyExpense,
        avgMonthlyIncome,
        topCategory,
        monthlyBalance,
        projectedNextMonth,
        spendingTrend
      }
    };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Analisis mendalam keuangan Anda</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) return null;

  const { monthlyTrends, categoryBreakdown, dailyTrends, insights } = analyticsData;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        <div className="space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
              <p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg">Analisis mendalam keuangan Anda</p>
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
                <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insights Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pengeluaran Harian</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(insights.avgDailyExpense)}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded-lg">
                    <TrendingDown className="h-5 w-5 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pemasukan Bulanan</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(insights.avgMonthlyIncome)}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Kategori Terbesar</p>
                    <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {insights.topCategory}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/20 rounded-lg">
                    <Target className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Prediksi Bulan Depan</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-lg lg:text-xl font-bold ${insights.projectedNextMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(Math.abs(insights.projectedNextMonth))}
                      </p>
                      {insights.spendingTrend === 'up' && <Badge variant="destructive" className="text-xs">↑ Naik</Badge>}
                      {insights.spendingTrend === 'down' && <Badge variant="default" className="text-xs bg-emerald-600">↓ Turun</Badge>}
                      {insights.spendingTrend === 'stable' && <Badge variant="secondary" className="text-xs">→ Stabil</Badge>}
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/20 rounded-lg">
                    <Activity className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trends */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <BarChart3 className="h-6 w-6" />
                  Tren Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] lg:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-slate-600 dark:text-slate-400"
                        fontSize={12}
                      />
                      <YAxis 
                        className="text-slate-600 dark:text-slate-400"
                        fontSize={12}
                        tickFormatter={(value) => `${value / 1000}K`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelClassName="text-slate-900 dark:text-slate-100"
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="income" fill="#10B981" name="Pemasukan" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <PieChartIcon className="h-6 w-6" />
                  Kategori Pengeluaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] lg:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Jumlah']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Spending Trend */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Activity className="h-6 w-6" />
                Tren Pengeluaran Harian (30 Hari Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      className="text-slate-600 dark:text-slate-400"
                      fontSize={12}
                    />
                    <YAxis 
                      className="text-slate-600 dark:text-slate-400"
                      fontSize={12}
                      tickFormatter={(value) => `${value / 1000}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Pengeluaran']}
                      labelClassName="text-slate-900 dark:text-slate-100"
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#F59E0B" 
                      fill="#FEF3C7" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
