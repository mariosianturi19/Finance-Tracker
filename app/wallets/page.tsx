// app/wallets/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { WalletCard } from '@/components/wallet-card';
import { useAuth } from '@/components/providers/auth-provider';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@/lib/wallets';
import { getTransactionStats } from '@/lib/transactions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Wallet, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { WalletWithBalance, WalletType } from '@/lib/types';

const walletSchema = z.object({
  name: z.string().min(1, 'Nama wallet harus diisi'),
  type: z.enum(['bank', 'ewallet', 'cash']),
  initial_balance: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Saldo awal harus berupa angka yang valid'),
});

type WalletFormData = z.infer<typeof walletSchema>;

interface WalletStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export default function WalletsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletWithBalance | null>(null);
  const [walletStats, setWalletStats] = useState<Record<string, WalletStats>>({});
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      initial_balance: '0',
    },
  });

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const walletsData = await getWallets();
      setWallets(walletsData);

      // Fetch stats for each wallet
      const statsPromises = walletsData.map(async (wallet) => {
        const stats = await getTransactionStats(wallet.id);
        return { walletId: wallet.id, stats };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, WalletStats> = {};
      statsResults.forEach(({ walletId, stats }) => {
        statsMap[walletId] = stats;
      });
      setWalletStats(statsMap);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Gagal memuat data wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && wallets.length === 0) {
      fetchWallets();
    }
  }, [user, wallets.length, fetchWallets]);

  const onSubmit = async (data: WalletFormData) => {
    setLoading(true);
    try {
      const amount = parseFloat(data.initial_balance);
      if (isNaN(amount)) {
        toast.error('Saldo awal harus berupa angka yang valid');
        return;
      }
      
      const amountInCents = Math.round(amount * 100);
      
      if (selectedWallet) {
        // Update existing wallet
        await updateWallet(selectedWallet.id, {
          name: data.name,
          type: data.type,
          initial_balance: amountInCents,
        });
        toast.success('Wallet berhasil diperbarui');
        setShowEditDialog(false);
      } else {
        // Create new wallet
        await createWallet({
          name: data.name,
          type: data.type,
          initial_balance: amountInCents,
        });
        toast.success('Wallet berhasil ditambahkan');
        setShowAddDialog(false);
      }

      reset();
      setSelectedWallet(null);
      await fetchWallets();
    } catch (error: any) {
      console.error('Wallet operation error:', error);
      toast.error(error.message || 'Gagal menyimpan wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wallet: WalletWithBalance) => {
    console.log('Edit wallet:', wallet);
    setSelectedWallet(wallet);
    setValue('name', wallet.name);
    setValue('type', wallet.type);
    setValue('initial_balance', (wallet.initial_balance / 100).toString());
    setShowEditDialog(true);
  };

  const handleDelete = (wallet: WalletWithBalance) => {
    console.log('Delete wallet:', wallet);
    setSelectedWallet(wallet);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    try {
      await deleteWallet(selectedWallet.id);
      toast.success('Wallet berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedWallet(null);
      fetchWallets();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    console.log('Adding new wallet');
    reset({
      name: '',
      type: 'cash',
      initial_balance: '0',
    });
    setSelectedWallet(null);
    setShowAddDialog(true);
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);
  const totalIncome = Object.values(walletStats).reduce((sum, stats) => sum + stats.totalIncome, 0);
  const totalExpense = Object.values(walletStats).reduce((sum, stats) => sum + stats.totalExpense, 0);

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
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Kelola Saldo</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Atur dan pantau semua sumber saldo Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBalance(!showBalance)}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={handleAddNew}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Saldo
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Saldo</CardTitle>
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {showBalance ? formatCurrency(totalBalance / 100) : '••••••••'}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {wallets.length} sumber saldo
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Pemasukan</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {showBalance ? formatCurrency(totalIncome / 100) : '••••••••'}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Semua waktu
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                {showBalance ? formatCurrency(totalExpense / 100) : '••••••••'}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Semua waktu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wallets Grid */}
        {wallets.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                showBalance={showBalance}
                onEdit={() => handleEdit(wallet)}
                onDelete={() => handleDelete(wallet)}
                onClick={() => router.push(`/wallets/${wallet.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-6" />
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">Belum Ada Saldo</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md text-lg">
                Tambahkan sumber saldo pertama Anda untuk mulai mencatat transaksi keuangan
              </p>
              <Button 
                onClick={handleAddNew}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Saldo Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Wallet Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          console.log('Dialog open change:', open);
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setSelectedWallet(null);
            reset({
              name: '',
              type: 'cash',
              initial_balance: '0',
            });
          }
        }}>
          <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">
                {selectedWallet ? 'Edit Sumber Saldo' : 'Tambah Sumber Saldo'}
              </DialogTitle>
              <DialogDescription>
                {selectedWallet 
                  ? 'Perbarui informasi sumber saldo Anda'
                  : 'Tambahkan sumber saldo baru untuk mencatat transaksi'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sumber Saldo</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Bank BNI, GoPay, Cash"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Jenis</Label>
                <Select 
                  value={watch('type')} 
                  onValueChange={(value: WalletType) => setValue('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">🏦 Bank</SelectItem>
                    <SelectItem value="ewallet">💳 E-Wallet</SelectItem>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Awal</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...register('initial_balance')}
                  className={errors.initial_balance ? 'border-red-500' : ''}
                />
                {errors.initial_balance && (
                  <p className="text-sm text-red-600">{errors.initial_balance.message}</p>
                )}
                {watch('initial_balance') && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(parseFloat(watch('initial_balance')) || 0)}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setShowEditDialog(false);
                    setSelectedWallet(null);
                    reset();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : (selectedWallet ? 'Perbarui' : 'Tambah')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Sumber Saldo?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus &quot;{selectedWallet?.name}&quot;? 
                Semua transaksi yang terkait dengan sumber saldo ini juga akan dihapus. 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}