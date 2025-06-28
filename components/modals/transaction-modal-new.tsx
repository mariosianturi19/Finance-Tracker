'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { WalletWithBalance } from '@/lib/types';
import { Category } from '@/lib/categories';
import { Transaction } from '@/lib/transactions';
import { getWalletTypeIcon } from '@/lib/wallets';

// Number formatting utilities
const formatNumber = (value: string) => {
  const number = value.replace(/\D/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumber = (value: string) => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};

const transactionSchema = z.object({
  type: z.enum(['pemasukan', 'pengeluaran'], {
    required_error: 'Jenis transaksi harus dipilih',
  }),
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  source: z.string().min(1, 'Sumber saldo harus dipilih'),
  category: z.string().min(1, 'Kategori harus dipilih'),
  date: z.date({
    required_error: 'Tanggal harus dipilih',
  }),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  wallets: WalletWithBalance[];
  categories: Category[];
  editingTransaction?: Transaction | null;
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  wallets, 
  categories,
  editingTransaction
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'pengeluaran',
      date: new Date(),
    }
  });

  useEffect(() => {
    if (editingTransaction) {
      setValue('type', editingTransaction.type);
      setValue('category', editingTransaction.category);
      setValue('source', editingTransaction.wallet_id || '');
      
      const transactionDate = new Date(editingTransaction.date + 'T00:00:00');
      setValue('date', transactionDate);
      setValue('description', editingTransaction.note || '');
      
      const amountValue = (editingTransaction.amount / 100).toString();
      setAmountDisplay(formatNumber(amountValue));
      setValue('amount', editingTransaction.amount / 100);
    } else {
      reset({
        type: 'pengeluaran',
        date: new Date(),
      });
      setAmountDisplay('');
    }
  }, [editingTransaction, setValue, reset]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumber(rawValue);
    const numericValue = parseNumber(rawValue);
    
    setAmountDisplay(formattedValue);
    setValue('amount', numericValue);
  };

  const onSubmitHandler = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      const submitData = editingTransaction 
        ? { ...data, id: editingTransaction.id }
        : data;
      await onSubmit(submitData);
      onClose();
      reset();
      setAmountDisplay('');
    } catch (error: any) {
      console.error('Transaction submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categories.filter(cat => cat.type === watch('type'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {editingTransaction 
              ? 'Perbarui informasi transaksi Anda'
              : 'Tambahkan transaksi pemasukan atau pengeluaran baru'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* Transaction Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jenis Transaksi</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={watch('type') === 'pemasukan' ? 'default' : 'outline'}
                className={`h-12 justify-start gap-3 ${
                  watch('type') === 'pemasukan' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => setValue('type', 'pemasukan')}
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Pemasukan
              </Button>
              <Button
                type="button"
                variant={watch('type') === 'pengeluaran' ? 'default' : 'outline'}
                className={`h-12 justify-start gap-3 ${
                  watch('type') === 'pengeluaran' 
                    ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => setValue('type', 'pengeluaran')}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Pengeluaran
              </Button>
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={amountDisplay}
                onChange={handleAmountChange}
                className={`h-12 text-lg font-semibold border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 ${errors.amount ? 'border-red-500' : ''}`}
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-slate-500 dark:text-slate-400 text-sm">IDR</span>
              </div>
            </div>
            {watch('amount') && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formatCurrency(watch('amount') || 0)}
              </p>
            )}
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-3">
            <Label htmlFor="source" className="text-sm font-medium text-slate-700 dark:text-slate-300">Sumber Saldo</Label>
            <Select 
              value={watch('source')} 
              onValueChange={(value) => setValue('source', value)}
            >
              <SelectTrigger className={`h-12 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 ${errors.source ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Pilih sumber saldo" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center gap-3">
                      <span>{getWalletTypeIcon(wallet.type)}</span>
                      <span className="truncate">{wallet.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        ({formatCurrency(wallet.current_balance / 100)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-sm text-red-500">{errors.source.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</Label>
            <Select 
              value={watch('category')} 
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger className={`h-12 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 ${errors.category ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
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
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50",
                    !watch('date') && "text-slate-500 dark:text-slate-400",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  {watch('date') ? format(watch('date'), "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={watch('date')}
                  onSelect={(date) => setValue('date', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">Catatan (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Tambahkan catatan untuk transaksi ini..."
              {...register('description')}
              className="min-h-[80px] border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              {loading ? 'Menyimpan...' : (editingTransaction ? 'Update' : 'Simpan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
