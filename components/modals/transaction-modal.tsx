'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  // Remove all non-digit characters
  const number = value.replace(/\D/g, '');
  // Add thousand separators
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumber = (value: string) => {
  // Remove thousand separators and convert to number
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
  onSubmit: (data: TransactionFormData & { id?: string }) => Promise<void>;
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'pengeluaran',
      date: new Date(),
    },
  });

  useEffect(() => {
    if (editingTransaction) {
      setValue('type', editingTransaction.type);
      setValue('category', editingTransaction.category);
      setValue('source', editingTransaction.wallet_id || '');
      setValue('date', new Date(editingTransaction.date));
      setValue('description', editingTransaction.note || '');
      
      // Format amount for display
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction 
              ? 'Perbarui informasi transaksi Anda'
              : 'Tambahkan transaksi pemasukan atau pengeluaran baru'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Jenis Transaksi</Label>
            <Select 
              value={watch('type')} 
              onValueChange={(value: 'pemasukan' | 'pengeluaran') => setValue('type', value)}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih jenis transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pemasukan">💰 Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">💸 Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
            {amountDisplay && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(parseNumber(amountDisplay))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Sumber Saldo</Label>
            <Select 
              value={watch('source')} 
              onValueChange={(value) => setValue('source', value)}
            >
              <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih sumber saldo" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center gap-2">
                      <span>{getWalletTypeIcon(wallet.type)}</span>
                      <span>{wallet.name}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(wallet.current_balance / 100)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-sm text-red-600">{errors.source.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select 
              value={watch('category')} 
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
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
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watch('date') && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('date') ? format(watch('date'), "PPP", { locale: id }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch('date')}
                  onSelect={(date) => setValue('date', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Catatan (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Tambahkan catatan transaksi..."
              {...register('description')}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (editingTransaction ? 'Perbarui' : 'Simpan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}