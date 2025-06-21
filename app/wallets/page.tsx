// app/wallets/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  useEffect(() => {
    if (user && wallets.length === 0) {
      fetchWallets();
    }
  }, [user, wallets.length]);

  const fetchWallets = async () => {
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
  };
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
  };  const handleAddNew = () => {
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Saldo</h1>
            <p className="text-muted-foreground">
              Atur dan pantau semua sumber saldo Anda
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Saldo
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {showBalance ? formatCurrency(totalBalance / 100) : '••••••••'}
              </div>
              <p className="text-xs text-muted-foreground">
                {wallets.length} sumber saldo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {showBalance ? formatCurrency(totalIncome / 100) : '••••••••'}
              </div>
              <p className="text-xs text-muted-foreground">
                Semua waktu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {showBalance ? formatCurrency(totalExpense / 100) : '••••••••'}
              </div>
              <p className="text-xs text-muted-foreground">
                Semua waktu
              </p>
            </CardContent>
          </Card>
        </div>        {/* Wallets Grid */}
        {wallets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Saldo</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Tambahkan sumber saldo pertama Anda untuk mulai mencatat transaksi keuangan
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Saldo Pertama
              </Button>
            </CardContent>
          </Card>
        )}        {/* Add/Edit Wallet Dialog */}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
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
              </div>              <div className="space-y-2">
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
                Apakah Anda yakin ingin menghapus "{selectedWallet?.name}"? 
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