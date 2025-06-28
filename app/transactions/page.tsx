'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { TransactionModal } from '@/components/modals/transaction-modal-new';
import { createTransaction, getTransactions, Transaction, updateTransaction, deleteTransaction } from '@/lib/transactions';
import { getCategories, Category } from '@/lib/categories';
import { getWallets, getWalletTypeIcon } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  X,
  Edit,
  Trash2,
  MoreVertical,
  Download
} from 'lucide-react';
import { WalletWithBalance } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TransactionFormData {
  id?: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  source: string;
  category: string;
  date: Date;
  description?: string;
}

// Helper function to format date for database without timezone issues
const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBalances, setShowBalances] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMinAmount, setFilterMinAmount] = useState<string>('');
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsData, categoriesData, walletsData] = await Promise.all([
        getTransactions(currentDate.getFullYear(), currentDate.getMonth() + 1),
        getCategories(),
        getWallets()
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setWallets(walletsData);

      // Redirect to wallet setup if no wallets exist
      if (walletsData.length === 0) {
        toast.error('Anda perlu menambahkan sumber saldo terlebih dahulu');
        router.push('/wallets');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [currentDate, router]);

  useEffect(() => {
    if (user && transactions.length === 0) {
      fetchData();
    }
  }, [user, transactions.length, fetchData]);

  const handleAddTransaction = async (data: TransactionFormData) => {
    const selectedWallet = wallets.find(w => w.id === data.source);
    if (!selectedWallet) {
      throw new Error('Sumber saldo tidak valid');
    }

    const amountInCents = Math.round(data.amount * 100);

    // Validate sufficient balance for expenses (skip for editing)
    if (data.type === 'pengeluaran' && !data.id && amountInCents > selectedWallet.current_balance) {
      throw new Error(`Saldo ${selectedWallet.name} tidak mencukupi`);
    }

    try {
      if (data.id) {
        // Update existing transaction
        await updateTransaction(data.id, {
          type: data.type,
          amount: amountInCents,
          category: data.category,
          wallet_id: data.source,
          note: data.description || null,
          date: formatDateForDB(data.date),
        });
        toast.success('Transaksi berhasil diperbarui');
      } else {
        // Create new transaction
        await createTransaction({
          type: data.type,
          amount: amountInCents,
          category: data.category,
          wallet_id: data.source,
          note: data.description || null,
          date: formatDateForDB(data.date),
        });
        toast.success('Transaksi berhasil ditambahkan');
      }

      await fetchData(); // Refresh data
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menyimpan transaksi');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction(deletingTransaction.id);
      toast.success('Transaksi berhasil dihapus');
      setShowDeleteDialog(false);
      setDeletingTransaction(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesWallet = filterWallet === 'all' || transaction.wallet_id === filterWallet;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.note && transaction.note.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Amount filtering
    const transactionAmount = transaction.amount / 100; // Convert from cents
    const minAmount = filterMinAmount ? parseFloat(filterMinAmount) : 0;
    const maxAmount = filterMaxAmount ? parseFloat(filterMaxAmount) : Infinity;
    const matchesAmount = transactionAmount >= minAmount && transactionAmount <= maxAmount;
    
    return matchesWallet && matchesType && matchesCategory && matchesSearch && matchesAmount;
  });

  const getWalletById = (walletId: string | null) => {
    return wallets.find(w => w.id === walletId);
  };

  const clearFilters = () => {
    setFilterWallet('all');
    setFilterType('all');
    setFilterCategory('all');
    setSearchQuery('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
  };

  const hasActiveFilters = filterWallet !== 'all' || filterType !== 'all' || filterCategory !== 'all' || searchQuery !== '' || filterMinAmount !== '' || filterMaxAmount !== '';

  // Calculate summary stats
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpense;

  if (!user) {
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
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Transaksi</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Kelola pemasukan dan pengeluaran Anda
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Pemasukan</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {showBalances ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mt-2">
                {showBalances ? formatCurrency(totalIncome / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Pengeluaran</span>
              </div>
              <p className="text-xl font-bold text-red-800 dark:text-red-200 mt-2">
                {showBalances ? formatCurrency(totalExpense / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Selisih</span>
              </div>
              <p className={`text-xl font-bold mt-2 ${netAmount >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {showBalances ? formatCurrency(netAmount / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                <Input
                  placeholder="Cari transaksi berdasarkan kategori atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={filterWallet} onValueChange={setFilterWallet}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <SelectValue placeholder="Semua Sumber Saldo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sumber Saldo</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center gap-2">
                          <span>{getWalletTypeIcon(wallet.type)}</span>
                          <span>{wallet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {Array.from(new Set(transactions.map(t => t.category))).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    placeholder="Min Amount"
                    type="number"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                  />
                  <Input
                    placeholder="Max Amount"
                    type="number"
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                    className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(filterWallet !== 'all' || filterType !== 'all' || filterCategory !== 'all' || searchQuery || filterMinAmount || filterMaxAmount) && (
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setFilterWallet('all');
                      setFilterType('all');
                      setFilterCategory('all');
                      setSearchQuery('');
                      setFilterMinAmount('');
                      setFilterMaxAmount('');
                    }}
                    className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    Reset Semua Filter
                  </Button>
                </div>
              )}

              {/* Export Filtered Results */}
              {(filterWallet !== 'all' || filterType !== 'all' || filterCategory !== 'all' || searchQuery || filterMinAmount || filterMaxAmount) && (
                <div className="flex justify-start">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Export filtered results to CSV with better formatting
                      const filteredData = filteredTransactions;
                      const csvHeaders = ['Tanggal', 'Jenis', 'Jumlah', 'Kategori', 'Sumber Saldo', 'Deskripsi'];
                      
                      const csvData = filteredData.map(transaction => {
                        const wallet = wallets.find(w => w.id === transaction.wallet_id);
                        
                        // Format tanggal yang konsisten
                        const date = new Date(transaction.date);
                        const formattedDate = date.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        });

                        // Format currency tanpa prefix Rp
                        const amount = Math.abs(transaction.amount || 0);
                        const formattedAmount = (amount / 100).toLocaleString('id-ID', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        });

                        // Clean data untuk menghindari masalah CSV
                        const cleanText = (text: string | null | undefined) => {
                          if (!text) return '';
                          return text.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                        };

                        return [
                          formattedDate,
                          transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
                          formattedAmount,
                          cleanText(transaction.category) || 'Tidak Dikategorikan',
                          cleanText(wallet?.name) || 'Unknown',
                          cleanText(transaction.note) || ''
                        ];
                      });
                      
                      // Format CSV dengan proper escaping
                      const csvContent = [csvHeaders, ...csvData]
                        .map(row => row.map(field => {
                          const fieldStr = String(field || '');
                          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
                            return `"${fieldStr.replace(/"/g, '""')}"`;
                          }
                          return fieldStr;
                        }).join(','))
                        .join('\n');

                      // Generate filename dengan format yang lebih baik
                      const dateStr = new Date().toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '-');

                      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      
                      link.setAttribute('href', url);
                      link.setAttribute('download', `transaksi-filtered-${dateStr}.csv`);
                      link.style.visibility = 'hidden';
                      
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast.success('Data terfilter berhasil diekspor!');
                    }}
                    className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Ekspor Hasil Filter ({filteredTransactions.length} data)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Daftar Transaksi
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                    ({filteredTransactions.length} dari {transactions.length})
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Badge variant="secondary" className="gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Filter className="h-3 w-3" />
                    Filter Aktif
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.wallet_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-5 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-200">
                      <div className="flex items-center space-x-5 flex-1">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="font-medium truncate text-slate-900 dark:text-slate-100">{transaction.category}</p>
                            <Badge 
                              variant={transaction.type === 'pemasukan' ? 'default' : 'destructive'}
                              className={`text-xs flex-shrink-0 ${
                                transaction.type === 'pemasukan' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              }`}
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                            </div>
                            {wallet && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3 flex-shrink-0" />
                                  <span className="flex items-center gap-1">
                                    {getWalletTypeIcon(wallet.type)}
                                    <span className="truncate">{wallet.name}</span>
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          {transaction.note && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 truncate">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            transaction.type === 'pemasukan' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'pemasukan' ? '+' : '-'}
                            {showBalances 
                              ? formatCurrency(transaction.amount / 100)
                              : '••••••'
                            }
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(transaction.created_at).toLocaleString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-20 w-20 text-slate-400 dark:text-slate-600 mb-8" />
                <p className="text-slate-600 dark:text-slate-400 mb-3 text-center text-lg">
                  {hasActiveFilters 
                    ? 'Tidak ada transaksi yang sesuai dengan filter'
                    : 'Belum ada transaksi'
                  }
                </p>
                {hasActiveFilters ? (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Reset Filter
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsModalOpen(true)} 
                    className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Transaksi Pertama
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleAddTransaction}
          wallets={wallets}
          categories={categories}
          editingTransaction={editingTransaction}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus Transaksi</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
}