'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatDate } from '@/lib/timezone';
import { formatCurrency } from '@/lib/currency';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Edit, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';

interface TransactionFormData {
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note: string;
  date: string;
}

const categories = {
  pemasukan: ['Gaji', 'Bonus', 'Investasi', 'Freelance', 'Lainnya'],
  pengeluaran: ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lainnya'],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { user } = useAuth();

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    }
  });
  
  const watchedType = watch('type');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType]);

  const fetchTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get start and end dates for the selected month
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      
      // First day of the month
      const startDate = new Date(year, month, 1);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Last day of the month
      const endDate = new Date(year, month + 1, 0);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('Fetching transactions for:', startDateStr, 'to', endDateStr);
      
      // Fetch transactions for selected month with proper date range
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Gagal memuat transaksi: ' + error.message);
        setTransactions([]);
        return;
      }

      console.log('Transactions fetched:', data?.length || 0);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat transaksi');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatSelectedMonth = (date: Date): string => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const applyFilters = () => {
    try {
      let filtered = [...transactions];

      // Filter by search term
      if (searchTerm && searchTerm.trim() !== '') {
        filtered = filtered.filter(transaction => 
          transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.note && transaction.note.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Filter by type
      if (filterType !== 'all') {
        filtered = filtered.filter(transaction => transaction.type === filterType);
      }

      setFilteredTransactions(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredTransactions(transactions);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return;
    }

    try {
      // Validasi amount
      if (data.amount <= 0) {
        toast.error('Jumlah harus lebih dari 0');
        return;
      }

      // Validasi dan format date
      const transactionDate = new Date(data.date);
      if (isNaN(transactionDate.getTime())) {
        toast.error('Format tanggal tidak valid');
        return;
      }

      const formattedDate = transactionDate.toISOString().split('T')[0];

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update({
            type: data.type,
            amount: data.amount,
            category: data.category,
            note: data.note || null,
            date: formattedDate,
          })
          .eq('id', editingTransaction.id);

        if (error) {
          console.error('Error updating transaction:', error);
          throw error;
        }
        toast.success('Transaksi berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{
            user_id: user.id,
            type: data.type,
            amount: data.amount,
            category: data.category,
            note: data.note || null,
            date: formattedDate,
          }]);

        if (error) {
          console.error('Error creating transaction:', error);
          throw error;
        }
        toast.success('Transaksi berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingTransaction(null);
      reset({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error('Gagal menyimpan transaksi: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setValue('type', transaction.type);
    setValue('amount', transaction.amount);
    setValue('category', transaction.category);
    setValue('note', transaction.note || '');
    setValue('date', transaction.date);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }
      toast.success('Transaksi berhasil dihapus');
      fetchTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    reset({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Calculate totals for selected month
  const totalIncome = transactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  // Jika loading auth, tampilkan loading
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaksi</h1>
            <p className="text-muted-foreground">
              Kelola semua transaksi keuangan Anda
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis</Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: 'Jenis transaksi harus dipilih' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis transaksi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pemasukan">Pemasukan</SelectItem>
                          <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah</Label>
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ 
                      required: 'Jumlah harus diisi',
                      min: { value: 1, message: 'Jumlah minimal Rp 1' },
                      max: { value: 999999999999, message: 'Jumlah terlalu besar' }
                    }}
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Masukkan jumlah"
                      />
                    )}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: 'Kategori harus dipilih' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {watchedType && categories[watchedType] && categories[watchedType].map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    {...register('date', { required: 'Tanggal harus diisi' })}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Catatan</Label>
                  <Textarea
                    id="note"
                    placeholder="Catatan tambahan (opsional)"
                    {...register('note')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTransaction ? 'Perbarui' : 'Simpan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month Navigation & Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Month Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Filter Bulan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Sebelumnya
              </Button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold">{formatMonthYear(selectedMonth)}</h3>
                <p className="text-sm text-muted-foreground">
                  {transactions.length} transaksi
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={selectedMonth.getMonth() >= new Date().getMonth() && selectedMonth.getFullYear() >= new Date().getFullYear()}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ringkasan {formatMonthYear(selectedMonth)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Pemasukan
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Pengeluaran
                  </span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(totalExpense)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Saldo</span>
                    <span className={`font-bold ${
                      balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="pemasukan">Pemasukan</SelectItem>
              <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">
                  {transactions.length === 0 
                    ? `Belum ada transaksi di ${formatMonthYear(selectedMonth)}`
                    : 'Tidak ada transaksi yang sesuai dengan filter'
                  }
                </h3>
                <p className="text-muted-foreground mb-4 text-center">
                  {transactions.length === 0 
                    ? 'Mulai catat pemasukan dan pengeluaran Anda untuk bulan ini'
                    : 'Coba ubah kata kunci pencarian atau filter jenis transaksi'
                  }
                </p>
                {transactions.length === 0 && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi Pertama
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
                </span>
                {(searchTerm || filterType !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>

              {/* Transaction Cards */}
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'pemasukan' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'pemasukan' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                        {transaction.note && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-[300px] break-words">
                            {transaction.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className={`font-semibold text-lg ${
                          transaction.type === 'pemasukan' 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'pemasukan' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Quick Stats Footer */}
        {filteredTransactions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transaksi</p>
                  <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pemasukan</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {filteredTransactions.filter(t => t.type === 'pemasukan').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredTransactions.filter(t => t.type === 'pengeluaran').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}