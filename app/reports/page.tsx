'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, FileText, Download, BarChart3, PieChart, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { getTransactions } from '@/lib/transactions';
import { getWallets } from '@/lib/wallets';
import { Transaction, WalletWithBalance } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { id } from 'date-fns/locale';

type ReportType = 'summary' | 'detailed' | 'category' | 'monthly';
type DateRange = 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'custom';

export default function ReportsPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const [transactionsData, walletsData] = await Promise.all([
          getTransactions(),
          getWallets()
        ]);
        setTransactions(transactionsData || []);
        setWallets(walletsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getDateRangeFilter = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'this-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'this-year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'last-year':
        const lastYear = subYears(now, 1);
        return {
          start: startOfYear(lastYear),
          end: endOfYear(lastYear)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const getFilteredTransactions = () => {
    const { start, end } = getDateRangeFilter();
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const dateInRange = transactionDate >= start && transactionDate <= end;
      const walletMatch = selectedWallet === 'all' || transaction.wallet_id === selectedWallet;
      
      return dateInRange && walletMatch;
    });
  };

  const generateReportData = () => {
    const filteredTransactions = getFilteredTransactions();
    const walletMap = new Map(wallets.map(w => [w.id, w.name]));
    
    // Summary calculations - pastikan menggunakan data user yang sebenarnya
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    
    const netAmount = totalIncome - totalExpense;
    
    // Category analysis
    const categoryStats = filteredTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Tidak Dikategorikan';
      if (!acc[category]) {
        acc[category] = { income: 0, expense: 0, count: 0 };
      }
      
      const amount = Math.abs(Number(transaction.amount) || 0);
      if (transaction.type === 'pemasukan') {
        acc[category].income += amount;
      } else {
        acc[category].expense += amount;
      }
      acc[category].count += 1;
      
      return acc;
    }, {} as Record<string, { income: number; expense: number; count: number }>);
    
    // Wallet analysis
    const walletStats = filteredTransactions.reduce((acc, transaction) => {
      const walletName = walletMap.get(transaction.wallet_id || '') || 'Unknown';
      if (!acc[walletName]) {
        acc[walletName] = { income: 0, expense: 0, count: 0 };
      }
      
      const amount = Math.abs(Number(transaction.amount) || 0);
      if (transaction.type === 'pemasukan') {
        acc[walletName].income += amount;
      } else {
        acc[walletName].expense += amount;
      }
      acc[walletName].count += 1;
      
      return acc;
    }, {} as Record<string, { income: number; expense: number; count: number }>);
    
    return {
      summary: {
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount: filteredTransactions.length
      },
      categoryStats,
      walletStats,
      transactions: filteredTransactions.map(t => ({
        ...t,
        walletName: walletMap.get(t.wallet_id || '') || 'Unknown',
        amount: Math.abs(Number(t.amount) || 0)
      }))
    };
  };

  const getReportTypeName = (type: ReportType) => {
    switch (type) {
      case 'summary': return 'Ringkasan';
      case 'detailed': return 'Detail Lengkap';
      case 'category': return 'Analisis Kategori';
      case 'monthly': return 'Analisis Bulanan';
      default: return 'Laporan';
    }
  };

  const getDateRangeName = (range: DateRange) => {
    switch (range) {
      case 'this-month': return 'Bulan Ini';
      case 'last-month': return 'Bulan Lalu';
      case 'this-year': return 'Tahun Ini';
      case 'last-year': return 'Tahun Lalu';
      default: return 'Custom';
    }
  };

  const getWalletName = () => {
    if (selectedWallet === 'all') return 'Semua Dompet';
    const wallet = wallets.find(w => w.id === selectedWallet);
    return wallet ? wallet.name : 'Dompet';
  };

  const generatePDF = async () => {
    if (!user) {
      toast.error('Anda harus login untuk membuat laporan');
      return;
    }

    setGenerating(true);
    
    try {
      // Test basic PDF creation first
      const testDoc = new jsPDF();
      testDoc.text('Test', 10, 10);
      
      const reportData = generateReportData();
      const { start, end } = getDateRangeFilter();
      
      // Validasi data sebelum membuat PDF
      if (!reportData || reportData.summary.transactionCount === 0) {
        toast.error('Tidak ada data untuk periode yang dipilih');
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Configure font
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(20);
      doc.text('Laporan Keuangan Personal', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      const startDateStr = format(start, 'dd MMMM yyyy', { locale: id });
      const endDateStr = format(end, 'dd MMMM yyyy', { locale: id });
      const createdDateStr = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id });
      
      doc.text(`Periode: ${startDateStr} - ${endDateStr}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Dibuat pada: ${createdDateStr}`, pageWidth / 2, 38, { align: 'center' });
      
      let currentY = 50;
      
      // Summary Section
      doc.setFontSize(14);
      doc.text('Ringkasan Keuangan', 20, currentY);
      currentY += 10;
      
      const summaryData = [
        ['Total Pemasukan', formatCurrency(Math.abs(reportData.summary.totalIncome || 0) / 100)],
        ['Total Pengeluaran', formatCurrency(Math.abs(reportData.summary.totalExpense || 0) / 100)],
        ['Saldo Bersih', formatCurrency((reportData.summary.netAmount || 0) / 100)],
        ['Total Transaksi', (reportData.summary.transactionCount || 0).toString()]
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Kategori', 'Jumlah']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Category Analysis
      const categoryEntries = Object.entries(reportData.categoryStats);
      if (categoryEntries.length > 0) {
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Analisis per Kategori', 20, currentY);
        currentY += 10;
        
        const categoryData = categoryEntries.map(([category, stats]) => [
          (category || 'Tidak Dikategorikan').substring(0, 20),
          formatCurrency(Math.abs(stats.income || 0) / 100),
          formatCurrency(Math.abs(stats.expense || 0) / 100),
          formatCurrency(((stats.income || 0) - (stats.expense || 0)) / 100),
          (stats.count || 0).toString()
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['Kategori', 'Pemasukan', 'Pengeluaran', 'Saldo', 'Transaksi']],
          body: categoryData,
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Detailed Transactions (only for detailed report type)
      if (reportType === 'detailed' && reportData.transactions.length > 0) {
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Rincian Transaksi', 20, currentY);
        currentY += 10;
        
        // Limit to 100 transactions for better performance
        const transactionData = reportData.transactions.slice(0, 100).map(t => {
          const date = new Date(t.date);
          return [
            isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'dd/MM/yyyy'),
            t.type === 'pemasukan' ? 'Masuk' : 'Keluar',
            (t.category || 'Tidak Dikategorikan').substring(0, 15),
            (t.note || '-').substring(0, 20),
            (t.walletName || 'Unknown').substring(0, 10),
            formatCurrency(Math.abs(t.amount || 0) / 100)
          ];
        });
        
        autoTable(doc, {
          startY: currentY,
          head: [['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Dompet', 'Jumlah']],
          body: transactionData,
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 8, cellPadding: 2 }
        });
        
        if (reportData.transactions.length > 100) {
          currentY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFontSize(10);
          doc.text(`* Menampilkan 100 dari ${reportData.transactions.length} transaksi`, 20, currentY);
        }
      }
      
      // Add footer to all pages
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Halaman ${i} dari ${pageCount} - Finance Tracker Report`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Generate dynamic filename based on filters
      // Create filename components
      const reportTypeText = getReportTypeName(reportType);
      const dateRangeText = getDateRangeName(dateRange);
      const walletText = getWalletName();
      const dateStr = format(new Date(), 'dd-MM-yyyy');
      
      // Clean filename components (remove special characters)
      const cleanText = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      
      const fileName = `${cleanText(reportTypeText)}_${cleanText(dateRangeText)}_${cleanText(walletText)}_${dateStr}.pdf`;
      
      // Save PDF
      doc.save(fileName);
      
      toast.success(`Laporan PDF berhasil diunduh: ${fileName}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Try to create a simple fallback PDF
      try {
        const simpleDoc = new jsPDF();
        simpleDoc.text('Laporan Keuangan Personal', 20, 20);
        simpleDoc.text('Terjadi kesalahan saat membuat laporan detail.', 20, 30);
        simpleDoc.text('Silakan coba lagi atau hubungi administrator.', 20, 40);
        
        // Use same naming convention for error file
        const reportTypeText = getReportTypeName(reportType);
        const dateRangeText = getDateRangeName(dateRange);
        const walletText = getWalletName();
        const dateStr = format(new Date(), 'dd-MM-yyyy');
        const cleanText = (text: string) => text.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        const errorFileName = `ERROR_${cleanText(reportTypeText)}_${cleanText(dateRangeText)}_${cleanText(walletText)}_${dateStr}.pdf`;
        
        simpleDoc.save(errorFileName);
        toast.error('Gagal membuat laporan detail. Laporan error diunduh sebagai gantinya.');
      } catch (fallbackError) {
        console.error('Fallback PDF creation failed:', fallbackError);
        const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
        toast.error(`Gagal membuat laporan PDF: ${errorMsg}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredTransactions = getFilteredTransactions();
  const reportData = generateReportData();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Laporan Keuangan
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Buat dan unduh laporan keuangan dalam format PDF
            </p>
          </div>
          <Button 
            onClick={generatePDF}
            disabled={generating || !user}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Membuat PDF...' : 'Unduh PDF'}
          </Button>
        </div>

        {/* Configuration */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Konfigurasi Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Jenis Laporan</Label>
                <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="summary">Ringkasan</SelectItem>
                    <SelectItem value="detailed">Detail Lengkap</SelectItem>
                    <SelectItem value="category">Analisis Kategori</SelectItem>
                    <SelectItem value="monthly">Analisis Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Periode</Label>
                <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="this-month">Bulan Ini</SelectItem>
                    <SelectItem value="last-month">Bulan Lalu</SelectItem>
                    <SelectItem value="this-year">Tahun Ini</SelectItem>
                    <SelectItem value="last-year">Tahun Lalu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Filter */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Dompet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="all">Semua Dompet</SelectItem>
                    {wallets.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Total Pemasukan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.abs(reportData.summary.totalIncome || 0) / 100)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {filteredTransactions.filter(t => t.type === 'pemasukan').length} transaksi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(Math.abs(reportData.summary.totalExpense || 0) / 100)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {filteredTransactions.filter(t => t.type === 'pengeluaran').length} transaksi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Saldo Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (reportData.summary.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency((reportData.summary.netAmount || 0) / 100)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {(reportData.summary.netAmount || 0) >= 0 ? 'Surplus' : 'Defisit'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Preview */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Preview Kategori ({filteredTransactions.length} transaksi)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(reportData.categoryStats).slice(0, 5).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{category}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stats.count} transaksi</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(((stats.income || 0) - (stats.expense || 0)) / 100)}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">+{formatCurrency(Math.abs(stats.income || 0) / 100)}</span>
                      <span className="text-red-600">-{formatCurrency(Math.abs(stats.expense || 0) / 100)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(reportData.categoryStats).length > 5 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  +{Object.keys(reportData.categoryStats).length - 5} kategori lainnya akan ditampilkan di PDF
                </p>
              )}
              {Object.keys(reportData.categoryStats).length === 0 && (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  Tidak ada data untuk periode yang dipilih.<br/>
                  <span className="text-sm">Silakan pilih periode yang berbeda atau tambahkan transaksi terlebih dahulu.</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
