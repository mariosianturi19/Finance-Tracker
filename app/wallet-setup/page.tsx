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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isFirstTime ? 'Atur Sumber Saldo' : 'Tambah Sumber Saldo'}
            </CardTitle>
            <CardDescription>
              {isFirstTime 
                ? 'Selamat datang! Mari atur sumber saldo Anda untuk mulai mencatat keuangan'
                : 'Tambahkan sumber saldo baru untuk melengkapi pencatatan keuangan Anda'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {wallets.map((wallet, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium">Sumber Saldo #{index + 1}</h3>
                    {wallets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWallet(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Nama Sumber Saldo</Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="Contoh: Bank BNI, GoPay, Cash"
                        value={wallet.name}
                        onChange={(e) => updateWallet(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`}>Jenis</Label>
                      <Select 
                        value={wallet.type} 
                        onValueChange={(value: WalletType) => updateWallet(index, 'type', value)}
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
                      <Label htmlFor={`balance-${index}`}>Saldo Awal</Label>
                      <Input
                        id={`balance-${index}`}
                        type="number"
                        placeholder="0"
                        value={wallet.initial_balance}
                        onChange={(e) => updateWallet(index, 'initial_balance', e.target.value)}
                      />
                      {wallet.initial_balance && (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(parseFloat(wallet.initial_balance) || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button 
              variant="outline" 
              onClick={addWallet}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Sumber Saldo
            </Button>

            <div className="flex gap-3">
              {!isFirstTime && (
                <Button 
                  variant="outline" 
                  onClick={handleSkipToMain}
                  className="flex-1"
                >
                  Batal
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
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