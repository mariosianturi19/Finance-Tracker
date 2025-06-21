'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { TransactionModal } from '@/components/modals/transaction-modal';
import { createTransaction, getTransactions, Transaction } from '@/lib/transactions';
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
  X
} from 'lucide-react';
import { WalletWithBalance } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionFormData {
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  source: string;
  category: string;
  date: Date;
  description?: string;
}

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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate]);

  const fetchData = async () => {
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
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    const selectedWallet = wallets.find(w => w.id === data.source);
    if (!selectedWallet) {
      throw new Error('Sumber saldo tidak valid');
    }

    const amountInCents = Math.round(data.amount * 100);

    // Validate sufficient balance for expenses
    if (data.type === 'pengeluaran' && amountInCents > selectedWallet.current_balance) {
      throw new Error(`Saldo ${selectedWallet.name} tidak mencukupi`);
    }

    try {
      await createTransaction({
        type: data.type,
        amount: amountInCents,
        category: data.category,
        wallet_id: data.source,
        note: data.description || null,
        date: data.date.toISOString().split('T')[0],
      });

      toast.success('Transaksi berhasil ditambahkan');
      await fetchData(); // Refresh data
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menambahkan transaksi');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesWallet = filterWallet === 'all' || transaction.wallet_id === filterWallet;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = searchQuery === '' || 
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.note && transaction.note.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesWallet && matchesType && matchesSearch;
  });

  const getWalletById = (walletId: string | null) => {
    return wallets.find(w => w.id === walletId);
  };

  const clearFilters = () => {
    setFilterWallet('all');
    setFilterType('all');
    setSearchQuery('');
  };

  const hasActiveFilters = filterWallet !== 'all' || filterType !== 'all' || searchQuery !== '';

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
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transaksi</h1>
            <p className="text-muted-foreground">
              Kelola pemasukan dan pengeluaran Anda
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">Pemasukan</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="h-6 w-6 p-0"
                >
                  {showBalances ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {showBalances ? formatCurrency(totalIncome / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Pengeluaran</span>
              </div>
              <p className="text-lg font-bold text-red-600 mt-1">
                {showBalances ? formatCurrency(totalExpense / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Selisih</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${netAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {showBalances ? formatCurrency(netAmount / 100) : '••••••'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filterWallet} onValueChange={setFilterWallet}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter Sumber Saldo" />
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
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Daftar Transaksi
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredTransactions.length} dari {transactions.length})
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Badge variant="secondary" className="gap-1">
                    <Filter className="h-3 w-3" />
                    Filter Aktif
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.wallet_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-2 h-12 rounded-full ${
                          transaction.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium truncate">{transaction.category}</p>
                            <Badge 
                              variant={transaction.type === 'pemasukan' ? 'default' : 'destructive'}
                              className="text-xs flex-shrink-0"
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
                            <p className="text-sm text-muted-foreground mt-1 truncate">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className={`text-lg font-semibold ${
                          transaction.type === 'pemasukan' 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'pemasukan' ? '+' : '-'}
                          {showBalances 
                            ? formatCurrency(transaction.amount / 100)
                            : '••••••'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2 text-center">
                  {hasActiveFilters 
                    ? 'Tidak ada transaksi yang sesuai dengan filter'
                    : 'Belum ada transaksi'
                  }
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Reset Filter
                  </Button>
                ) : (
                  <Button onClick={() => setIsModalOpen(true)} className="gap-2">
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
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTransaction}
          wallets={wallets}
          categories={categories}
        />
      </div>
    </DashboardLayout>
  );
}