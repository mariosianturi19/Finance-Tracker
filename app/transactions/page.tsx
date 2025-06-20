'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency, formatDate } from '@/lib/timezone';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { user } = useAuth();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TransactionFormData>();
  const watchedType = watch('type');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update({
            type: data.type,
            amount: data.amount,
            category: data.category,
            note: data.note,
            date: data.date,
          })
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast.success('Transaksi berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{
            user_id: user?.id,
            type: data.type,
            amount: data.amount,
            category: data.category,
            note: data.note,
            date: data.date,
          }]);

        if (error) throw error;
        toast.success('Transaksi berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingTransaction(null);
      reset();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Gagal menyimpan transaksi');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setValue('type', transaction.type);
    setValue('amount', transaction.amount);
    setValue('category', transaction.category);
    setValue('note', transaction.note);
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

      if (error) throw error;
      toast.success('Transaksi berhasil dihapus');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.note.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
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
                  <Select onValueChange={(value) => setValue('type', value as 'pemasukan' | 'pengeluaran')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemasukan">Pemasukan</SelectItem>
                      <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="1000"
                    placeholder="0"
                    {...register('amount', { required: 'Jumlah harus diisi', min: 1 })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchedType && categories[watchedType].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
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

                <Button type="submit" className="w-full">
                  {editingTransaction ? 'Perbarui' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
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
            <CardTitle>Daftar Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm || filterType !== 'all' ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'pemasukan' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'pemasukan' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{transaction.category}</p>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {transaction.note || 'Tidak ada catatan'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ml-4 ${
                      transaction.type === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      <p className="font-semibold">
                        {transaction.type === 'pemasukan' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}