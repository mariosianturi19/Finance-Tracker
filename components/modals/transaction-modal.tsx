'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { WalletWithBalance } from '@/lib/types';
import { Category } from '@/lib/categories';
import { getWalletTypeIcon } from '@/lib/wallets';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  wallets: WalletWithBalance[];
  categories: Category[];
}

interface TransactionFormData {
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  source: string;
  category: string;
  date: Date;
  description?: string;
}

export function TransactionModal({ isOpen, onClose, onSubmit, wallets, categories }: TransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran',
    amount: 0,
    source: '',
    category: '',
    date: new Date(),
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.source || !formData.category) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        type: 'pengeluaran',
        amount: 0,
        source: '',
        category: '',
        date: new Date(),
        description: '',
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setFormData({
      type: 'pengeluaran',
      amount: 0,
      source: '',
      category: '',
      date: new Date(),
      description: '',
    });
  };

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  
  // Get selected wallet for balance display
  const selectedWallet = wallets.find(w => w.id === formData.source);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
          <DialogDescription>
            Catat pemasukan atau pengeluaran Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Jenis Transaksi</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.type === 'pengeluaran' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'pengeluaran', category: '' })}
                className={cn(
                  "justify-start gap-2",
                  formData.type === 'pengeluaran' && "bg-red-600 hover:bg-red-700"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                Pengeluaran
              </Button>
              <Button
                type="button"
                variant={formData.type === 'pemasukan' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'pemasukan', category: '' })}
                className={cn(
                  "justify-start gap-2",
                  formData.type === 'pemasukan' && "bg-green-600 hover:bg-green-700"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Pemasukan
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
          </div>

          {/* Source/Wallet */}
          <div className="space-y-2">
            <Label>Sumber Saldo</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger>
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
                      <span className="text-sm text-muted-foreground ml-4">
                        {formatCurrency(wallet.current_balance / 100)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWallet && formData.type === 'pengeluaran' && (
              <p className="text-sm text-muted-foreground">
                Saldo tersedia: {formatCurrency(selectedWallet.current_balance / 100)}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
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
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: id }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    setFormData({ ...formData, date: date || new Date() });
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Catatan (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Tambahkan catatan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.amount || !formData.source || !formData.category}
              className="flex-1"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}