// lib/reports.ts
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  topCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface MonthlyReport {
  month: number;
  year: number;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  topIncomeCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  dailyAverage: {
    income: number;
    expense: number;
  };
}

export async function getWeeklyReport(userId: string, weekStart: Date): Promise<WeeklyReport> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startDateStr = weekStart.toISOString().split('T')[0];
  const endDateStr = weekEnd.toISOString().split('T')[0];

  // Get all transactions for the week
  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (error) throw error;

  const totalIncome = transactions
    ?.filter((t: any) => t.type === 'pemasukan')
    .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

  const totalExpense = transactions
    ?.filter((t: any) => t.type === 'pengeluaran')
    .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

  // Calculate top categories (all types combined)
  const categoryStats = transactions?.reduce((acc: any, transaction: any) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 };
    }
    acc[category].amount += transaction.amount;
    acc[category].count += 1;
    return acc;
  }, {}) || {};

  const topCategories = Object.entries(categoryStats)
    .map(([category, stats]: [string, any]) => ({
      category,
      amount: stats.amount,
      count: stats.count
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    weekStart: startDateStr,
    weekEnd: endDateStr,
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    transactionCount: transactions?.length || 0,
    topCategories
  };
}

export async function getMonthlyReport(userId: string, year: number, month: number): Promise<MonthlyReport> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get all transactions for the month
  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (error) throw error;

  const incomeTransactions = transactions?.filter((t: any) => t.type === 'pemasukan') || [];
  const expenseTransactions = transactions?.filter((t: any) => t.type === 'pengeluaran') || [];

  const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);

  // Calculate top categories for income
  const incomeCategoryStats = incomeTransactions.reduce((acc: any, transaction: any) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 };
    }
    acc[category].amount += transaction.amount;
    acc[category].count += 1;
    return acc;
  }, {});

  // Calculate top categories for expense
  const expenseCategoryStats = expenseTransactions.reduce((acc: any, transaction: any) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 };
    }
    acc[category].amount += transaction.amount;
    acc[category].count += 1;
    return acc;
  }, {});

  const topIncomeCategories = Object.entries(incomeCategoryStats)
    .map(([category, stats]: [string, any]) => ({
      category,
      amount: stats.amount,
      count: stats.count
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const topExpenseCategories = Object.entries(expenseCategoryStats)
    .map(([category, stats]: [string, any]) => ({
      category,
      amount: stats.amount,
      count: stats.count
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Calculate daily averages
  const daysInMonth = endDate.getDate();
  const dailyAverage = {
    income: totalIncome / daysInMonth,
    expense: totalExpense / daysInMonth
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return {
    month,
    year,
    monthName: monthNames[month - 1],
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    transactionCount: transactions?.length || 0,
    topIncomeCategories,
    topExpenseCategories,
    dailyAverage
  };
}

export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100);
}

export function generateWeeklyReportMessage(report: WeeklyReport): string {
  const startDate = new Date(report.weekStart).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long'
  });
  const endDate = new Date(report.weekEnd).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const netStatus = report.netAmount >= 0 ? '✅ SURPLUS' : '⚠️ DEFISIT';
  const netEmoji = report.netAmount >= 0 ? '📈' : '📉';

  let topCategoriesText = '';
  if (report.topCategories.length > 0) {
    topCategoriesText = '\n🏆 *TOP KATEGORI MINGGU INI:*\n' +
      report.topCategories.slice(0, 3).map((cat, index) => 
        `${index + 1}. ${cat.category}: ${formatCurrencyIDR(cat.amount)} (${cat.count}x)`
      ).join('\n');
  }

  return `📊 *LAPORAN MINGGUAN KEUANGAN*

📅 Periode: ${startDate} - ${endDate}

💰 *RINGKASAN:*
💵 Total Pemasukan: ${formatCurrencyIDR(report.totalIncome)}
💸 Total Pengeluaran: ${formatCurrencyIDR(report.totalExpense)}
${netEmoji} Selisih: ${formatCurrencyIDR(Math.abs(report.netAmount))} (${netStatus})

📈 Total Transaksi: ${report.transactionCount}${topCategoriesText}

${report.netAmount >= 0 ? 
  '🎉 Kerja bagus! Anda berhasil mengelola keuangan dengan baik minggu ini.' : 
  '💡 Tips: Coba kurangi pengeluaran atau tingkatkan pemasukan minggu depan.'
}

Finance Tracker - Laporan Otomatis`;
}

export function generateMonthlyReportMessage(report: MonthlyReport): string {
  const netStatus = report.netAmount >= 0 ? '✅ SURPLUS' : '⚠️ DEFISIT';
  const netEmoji = report.netAmount >= 0 ? '📈' : '📉';

  let topIncomeText = '';
  if (report.topIncomeCategories.length > 0) {
    topIncomeText = '\n💰 *TOP PEMASUKAN:*\n' +
      report.topIncomeCategories.map((cat, index) => 
        `${index + 1}. ${cat.category}: ${formatCurrencyIDR(cat.amount)}`
      ).join('\n');
  }

  let topExpenseText = '';
  if (report.topExpenseCategories.length > 0) {
    topExpenseText = '\n💸 *TOP PENGELUARAN:*\n' +
      report.topExpenseCategories.map((cat, index) => 
        `${index + 1}. ${cat.category}: ${formatCurrencyIDR(cat.amount)}`
      ).join('\n');
  }

  return `📊 *LAPORAN BULANAN KEUANGAN*

📅 Bulan: ${report.monthName} ${report.year}

💰 *RINGKASAN:*
💵 Total Pemasukan: ${formatCurrencyIDR(report.totalIncome)}
💸 Total Pengeluaran: ${formatCurrencyIDR(report.totalExpense)}
${netEmoji} Selisih: ${formatCurrencyIDR(Math.abs(report.netAmount))} (${netStatus})

📈 Total Transaksi: ${report.transactionCount}

📊 *RATA-RATA HARIAN:*
💵 Pemasukan: ${formatCurrencyIDR(report.dailyAverage.income)}
💸 Pengeluaran: ${formatCurrencyIDR(report.dailyAverage.expense)}${topIncomeText}${topExpenseText}

${report.netAmount >= 0 ? 
  '🎉 Bulan yang fantastis! Keuangan Anda dalam kondisi sehat.' : 
  '💡 Evaluasi: Pertimbangkan untuk membuat budget yang lebih ketat bulan depan.'
}

Finance Tracker - Laporan Bulanan Otomatis`;
}
