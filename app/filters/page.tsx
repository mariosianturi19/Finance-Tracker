'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  Download,
  SortAsc,
  SortDesc,
  Bookmark,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getTransactions, Transaction } from '@/lib/transactions';
import { getWallets } from '@/lib/wallets';
import { getCategories } from '@/lib/categories';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface FilterState {
  search: string;
  type: 'all' | 'pemasukan' | 'pengeluaran';
  category: string;
  wallet: string;
  amountMin: string;
  amountMax: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: FilterState = {
  search: '',
  type: 'all',
  category: 'all',
  wallet: 'all',
  amountMin: '',
  amountMax: '',
  dateFrom: undefined,
  dateTo: undefined,
  sortBy: 'date',
  sortOrder: 'desc'
};

export default function FiltersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [savedFilters, setSavedFilters] = useState<Array<{name: string, filters: FilterState}>>([]);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
      loadSavedFilters();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData, categoriesData] = await Promise.all([
        getTransactions(),
        getWallets(),
        getCategories()
      ]);

      setTransactions(transactionsData);
      setWallets(walletsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = () => {
    const saved = localStorage.getItem('savedFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    
    const newSavedFilter = {
      name: filterName.trim(),
      filters: { ...filters }
    };
    
    const updated = [...savedFilters, newSavedFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
    setFilterName('');
  };

  const applySavedFilter = (savedFilter: {name: string, filters: FilterState}) => {
    setFilters(savedFilter.filters);
  };

  const deleteSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.category.toLowerCase().includes(searchLower) ||
        (t.note && t.note.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Wallet filter
    if (filters.wallet !== 'all') {
      filtered = filtered.filter(t => t.wallet_id === filters.wallet);
    }

    // Amount range filter
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin) * 100;
      filtered = filtered.filter(t => t.amount >= minAmount);
    }
    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax) * 100;
      filtered = filtered.filter(t => t.amount <= maxAmount);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= filters.dateTo!);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, filters]);

  const exportFiltered = () => {
    const csvHeaders = ['Tanggal', 'Jenis', 'Jumlah', 'Kategori', 'Sumber Saldo', 'Deskripsi'];
    
    const csvData = filteredTransactions.map(transaction => {
      const wallet = wallets.find(w => w.id === transaction.wallet_id);
      return [
        format(new Date(transaction.date), 'dd/MM/yyyy'),
        transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        formatCurrency(transaction.amount / 100),
        transaction.category,
        wallet?.name || 'Unknown',
        transaction.note || ''
      ];
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transaksi-filtered-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Advanced Filters</h1>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Advanced Filters</h1>
            <p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg">
              Filter dan cari transaksi dengan lebih detail
            </p>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Filter className="h-6 w-6" />
                Filter Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and Type */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Pencarian</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cari kategori atau deskripsi..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Jenis Transaksi</Label>
                  <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="pemasukan">Pemasukan</SelectItem>
                      <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category and Wallet */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Kategori</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {Array.from(new Set(transactions.map(t => t.category))).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Sumber Saldo</Label>
                  <Select value={filters.wallet} onValueChange={(value) => setFilters(prev => ({ ...prev, wallet: value }))}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Sumber</SelectItem>
                      {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Rentang Jumlah</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Jumlah minimum"
                      value={filters.amountMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                      className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Jumlah maksimum"
                      value={filters.amountMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                      className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Rentang Tanggal</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : "Dari tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy") : "Sampai tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Urutkan</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Tanggal</SelectItem>
                      <SelectItem value="amount">Jumlah</SelectItem>
                      <SelectItem value="category">Kategori</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.sortOrder} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortOrder: value }))}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          Descending
                        </div>
                      </SelectItem>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Ascending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  onClick={resetFilters}
                  variant="outline"
                  className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                
                <div className="flex gap-2 flex-1 max-w-md">
                  <Input
                    placeholder="Nama filter..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <Button 
                    onClick={saveCurrentFilter}
                    disabled={!filterName.trim()}
                    variant="outline"
                    className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Bookmark className="h-4 w-4" />
                    Simpan
                  </Button>
                </div>

                <Button 
                  onClick={exportFiltered}
                  className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                >
                  <Download className="h-4 w-4" />
                  Ekspor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <Bookmark className="h-6 w-6" />
                  Filter Tersimpan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((saved, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                      <Button
                        onClick={() => applySavedFilter(saved)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {saved.name}
                      </Button>
                      <Button
                        onClick={() => deleteSavedFilter(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Hasil Filter ({filteredTransactions.length} transaksi)
                </span>
                <Badge variant="secondary" className="text-sm">
                  Total: {formatCurrency(filteredTransactions.reduce((sum, t) => 
                    sum + (t.type === 'pemasukan' ? t.amount : -t.amount), 0) / 100
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Tidak ada transaksi ditemukan
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Coba ubah filter atau reset untuk melihat semua transaksi
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredTransactions.map((transaction) => {
                      const wallet = wallets.find(w => w.id === transaction.wallet_id);
                      return (
                        <div 
                          key={transaction.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={transaction.type === 'pemasukan' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {transaction.type === 'pemasukan' ? 'Masuk' : 'Keluar'}
                              </Badge>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {transaction.category}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {wallet?.name} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: id })}
                              {transaction.note && ` • ${transaction.note}`}
                            </div>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <div className={`text-lg font-semibold ${
                              transaction.type === 'pemasukan' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.type === 'pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount / 100)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
