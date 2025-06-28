// app/wallet-setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { createWallet, getWallets } from '@/lib/wallets';
import { WalletType } from '@/lib/types';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface WalletForm {
  name: string;
  type: WalletType;
  initial_balance: string;
}

export default function WalletSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletForm[]>([
    { name: '', type: 'cash', initial_balance: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user already has wallets
    checkExistingWallets();
  }, [user, router]);

  const checkExistingWallets = async () => {
    try {
      const existingWallets = await getWallets();
      if (existingWallets.length > 0) {
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error('Error checking wallets:', error);
    }
  };

  const addWallet = () => {
    setWallets([...wallets, { name: '', type: 'cash', initial_balance: '' }]);
  };

  const removeWallet = (index: number) => {
    if (wallets.length > 1) {
      setWallets(wallets.filter((_, i) => i !== index));
    }
  };

  const updateWallet = (index: number, field: keyof WalletForm, value: string) => {
    const updated = [...wallets];
    updated[index] = { ...updated[index], [field]: value };
    setWallets(updated);
  };

  const validateWallets = () => {
    for (const wallet of wallets) {
      if (!wallet.name.trim()) {
        toast.error('Nama sumber saldo tidak boleh kosong');
        return false;
      }
      if (!wallet.initial_balance || parseFloat(wallet.initial_balance) < 0) {
        toast.error('Saldo awal harus diisi dan tidak boleh negatif');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateWallets()) return;

    setLoading(true);
    try {
      for (const wallet of wallets) {
        await createWallet({
          name: wallet.name.trim(),
          type: wallet.type,
          initial_balance: Math.round(parseFloat(wallet.initial_balance) * 100), // Convert to cents
        });
      }

      toast.success('Sumber saldo berhasil ditambahkan!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan sumber saldo');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToMain = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 to-gray-100/50 dark:from-slate-900/60 dark:to-slate-800/40 p-4 relative">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-100/20 dark:bg-slate-800/20"></div>
      
      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 shadow-lg">
                <Wallet className="h-8 w-8 text-white dark:text-slate-900" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {isFirstTime ? 'Atur Sumber Saldo' : 'Tambah Sumber Saldo'}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-base max-w-md mx-auto">
                {isFirstTime 
                  ? 'Selamat datang! Mari atur sumber saldo Anda untuk mulai mencatat keuangan dengan mudah'
                  : 'Tambahkan sumber saldo baru untuk melengkapi pencatatan keuangan Anda'
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-8">
            <div className="space-y-6">
              {wallets.map((wallet, index) => (
                <Card key={index} className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Sumber Saldo #{index + 1}</h3>
                      {wallets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWallet(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor={`name-${index}`} className="text-slate-700 dark:text-slate-300 font-medium">Nama Sumber Saldo</Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="Contoh: Bank BNI, GoPay, Cash"
                          value={wallet.name}
                          onChange={(e) => updateWallet(index, 'name', e.target.value)}
                          className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor={`type-${index}`} className="text-slate-700 dark:text-slate-300 font-medium">Jenis</Label>
                        <Select 
                          value={wallet.type} 
                          onValueChange={(value: WalletType) => updateWallet(index, 'type', value)}
                        >
                          <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank">🏦 Bank</SelectItem>
                            <SelectItem value="ewallet">💳 E-Wallet</SelectItem>
                            <SelectItem value="cash">💵 Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor={`balance-${index}`} className="text-slate-700 dark:text-slate-300 font-medium">Saldo Awal</Label>
                        <Input
                          id={`balance-${index}`}
                          type="number"
                          placeholder="0"
                          value={wallet.initial_balance}
                          onChange={(e) => updateWallet(index, 'initial_balance', e.target.value)}
                          className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 text-base"
                        />
                        {wallet.initial_balance && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {formatCurrency(parseFloat(wallet.initial_balance) || 0)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              variant="outline" 
              onClick={addWallet}
              className="w-full h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Sumber Saldo
            </Button>

            <div className="flex gap-4 pt-4">
              {!isFirstTime && (
                <Button 
                  variant="outline" 
                  onClick={handleSkipToMain}
                  className="flex-1 h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold shadow-lg"
              >
                {loading ? 'Menyimpan...' : (isFirstTime ? 'Mulai Menggunakan' : 'Simpan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}