// app/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createTransaction, getTransactions, Transaction } from '@/lib/transactions';
import { getCategories, Category } from '@/lib/categories';
import { getWallets, getWalletTypeIcon } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { WalletWithBalance } from '@/lib/types';

const transactionSchema = z.object({
  type: z.enum(['pemasukan', 'pengeluaran']),
  amount: z.string().min(1, 'Jumlah harus diisi'),
  category: z.string().min(1, 'Kategori harus dipilih'),
  wallet_id: z.string().min(1, 'Sumber saldo harus dipilih'),
  note: z.string().optional(),
  date: z.string().min(1, 'Tanggal harus diisi'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBalances, setShowBalances] = useState(true);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'pengeluaran',
    },
  });

  const selectedType = watch('type');
  const selectedWalletId = watch('wallet_id');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate]);

  const fetchData = async () => {
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
        router.push('/wallet-setup');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    const selectedWallet = wallets.find(w => w.id === data.wallet_id);
    if (!selectedWallet) {
      toast.error('Sumber saldo tidak valid');
      return;
    }

    const amountInCents = Math.round(parseFloat(data.amount) * 100);

    // Validate sufficient balance for expenses
    if (data.type === 'pengeluaran' && amountInCents > selectedWallet.current_balance) {
      toast.error(`Saldo ${selectedWallet.name} tidak mencukupi`);
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        type: data.type,
        amount: amountInCents,
        category: data.category,
        wallet_id: data.wallet_id,
        note: data.note || null,
        date: data.date,
      });

      toast.success('Transaksi berhasil ditambahkan');
      reset();
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === selectedType);

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

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaksi</h1>
            <p className="text-muted-foreground">
              Kelola pemasukan dan pengeluaran Anda
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Tutup Form' : 'Tambah Transaksi'}
          </Button>
        </div>

        {/* Add Transaction Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Tambah Transaksi Baru</CardTitle>
              <CardDescription>
                Catat pemasukan atau pengeluaran Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Jenis Transaksi</Label>
                    <Select 
                      value={selectedType} 
                      onValueChange={(value: 'pemasukan' | 'pengeluaran') => setValue('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pemasukan">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Pemasukan
                          </div>
                        </SelectItem>
                        <SelectItem value="pengeluaran">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Pengeluaran
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet_id">Sumber Saldo</Label>
                    <Select 
                      value={selectedWalletId || ''} 
                      onValueChange={(value) => setValue('wallet_id', value)}
                    >
                      <SelectTrigger className={errors.wallet_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih sumber saldo" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span>{getWalletTypeIcon(wallet.type)}</span>
                                <span>{wallet.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatCurrency(wallet.current_balance / 100)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.wallet_id && (
                      <p className="text-sm text-red-600">{errors.wallet_id.message}</p>
                    )}
                    {selectedWallet && selectedType === 'pengeluaran' && (
                      <p className="text-sm text-muted-foreground">
                        Saldo tersedia: {formatCurrency(selectedWallet.current_balance / 100)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      {...register('amount')}
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select 
                      value={watch('category') || ''} 
                      onValueChange={(value) => setValue('category', value)}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Catatan (Opsional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Tambahkan catatan..."
                    {...register('note')}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Transaksi</CardTitle>
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
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.wallet_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${
                          transaction.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{transaction.category}</p>
                            <Badge 
                              variant={transaction.type === 'pemasukan' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                            {wallet && (
                              <>
                                <span>•</span>
                                <Wallet className="h-3 w-3" />
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
                          {new Date(transaction.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterWallet !== 'all' || filterType !== 'all' 
                    ? 'Tidak ada transaksi yang sesuai dengan filter'
                    : 'Belum ada transaksi'
                  }
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}