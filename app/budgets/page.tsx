'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  PiggyBank, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Edit,
  Trash2,
  Calendar,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  alert_percentage: number;
  is_active: boolean;
  created_at: string;
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    alert_percentage: '80'
  });

  // Dummy data for demo purposes
  useEffect(() => {
    const dummyBudgets: Budget[] = [
      {
        id: '1',
        name: 'Makanan & Minuman',
        category: 'Makanan',
        amount: 2000000,
        spent: 1200000,
        period: 'monthly',
        start_date: startOfMonth(new Date()).toISOString(),
        end_date: endOfMonth(new Date()).toISOString(),
        alert_percentage: 80,
        is_active: true,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Transportasi',
        category: 'Transport',
        amount: 800000,
        spent: 750000,
        period: 'monthly',
        start_date: startOfMonth(new Date()).toISOString(),
        end_date: endOfMonth(new Date()).toISOString(),
        alert_percentage: 90,
        is_active: true,
        created_at: '2024-01-01'
      },
      {
        id: '3',
        name: 'Hiburan',
        category: 'Hiburan',
        amount: 1500000,
        spent: 450000,
        period: 'monthly',
        start_date: startOfMonth(new Date()).toISOString(),
        end_date: endOfMonth(new Date()).toISOString(),
        alert_percentage: 75,
        is_active: true,
        created_at: '2024-01-01'
      },
      {
        id: '4',
        name: 'Belanja Online',
        category: 'Belanja',
        amount: 1000000,
        spent: 1150000,
        period: 'monthly',
        start_date: startOfMonth(new Date()).toISOString(),
        end_date: endOfMonth(new Date()).toISOString(),
        alert_percentage: 85,
        is_active: true,
        created_at: '2024-01-01'
      }
    ];
    
    setBudgets(dummyBudgets);
    setLoading(false);
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      amount: '',
      period: 'monthly',
      alert_percentage: '80'
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.amount) {
      toast.error('Semua field harus diisi');
      return;
    }

    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (formData.period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const newBudget: Budget = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
      spent: 0,
      period: formData.period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      alert_percentage: parseFloat(formData.alert_percentage),
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === editingBudget.id ? { ...newBudget, id: editingBudget.id, spent: editingBudget.spent } : b));
      toast.success('Budget berhasil diperbarui');
    } else {
      setBudgets([...budgets, newBudget]);
      toast.success('Budget baru berhasil ditambahkan');
    }

    resetForm();
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      alert_percentage: budget.alert_percentage.toString()
    });
    setShowForm(true);
  };

  const handleDelete = (budgetId: string) => {
    setBudgets(budgets.filter(b => b.id !== budgetId));
    toast.success('Budget berhasil dihapus');
  };

  const toggleActive = (budgetId: string) => {
    setBudgets(budgets.map(b => 
      b.id === budgetId 
        ? { ...b, is_active: !b.is_active }
        : b
    ));
    toast.success('Status budget berhasil diubah');
  };

  const updateSpent = (budgetId: string, amount: number) => {
    setBudgets(budgets.map(b => 
      b.id === budgetId 
        ? { ...b, spent: Math.max(0, amount) }
        : b
    ));
    toast.success('Pengeluaran berhasil diperbarui');
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getBudgetStatus = (spent: number, budget: number, alertPercentage: number) => {
    const percentage = (spent / budget) * 100;
    
    if (percentage >= 100) {
      return { status: 'over', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Over Budget' };
    } else if (percentage >= alertPercentage) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Warning' };
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'On Track' };
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'yearly': return 'Tahunan';
      default: return 'Bulanan';
    }
  };

  const activeBudgets = budgets.filter(b => b.is_active);
  const totalBudget = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Memuat budgets...</p>
          </div>
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PiggyBank className="h-6 w-6" />
              Budget Tracker
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Kelola anggaran pengeluaran dan pantau spending habits Anda
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Budget
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                {editingBudget ? 'Edit Budget' : 'Tambah Budget Baru'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Nama Budget *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Makanan & Minuman"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Kategori *</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Contoh: Makanan"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Jumlah Budget *</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="2000000"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Periode</Label>
                    <Select value={formData.period} onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setFormData({ ...formData, period: value })}>
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                        <SelectItem value="weekly">Mingguan</SelectItem>
                        <SelectItem value="monthly">Bulanan</SelectItem>
                        <SelectItem value="yearly">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Alert (%)</Label>
                    <Input
                      type="number"
                      value={formData.alert_percentage}
                      onChange={(e) => setFormData({ ...formData, alert_percentage: e.target.value })}
                      placeholder="80"
                      min="1"
                      max="100"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                  >
                    {editingBudget ? 'Update Budget' : 'Simpan Budget'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Budget</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalBudget)}</p>
                </div>
                <PiggyBank className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Budgets</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeBudgets.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Cards */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Budget List</h2>
          
          {budgets.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PiggyBank className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">Belum ada budget yang dibuat</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Budget Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const progress = getProgressPercentage(budget.spent, budget.amount);
                const status = getBudgetStatus(budget.spent, budget.amount, budget.alert_percentage);
                const remaining = budget.amount - budget.spent;
                
                return (
                  <Card key={budget.id} className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 ${!budget.is_active ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                            {budget.name}
                            {!budget.is_active && <Badge variant="outline">Inactive</Badge>}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getPeriodLabel(budget.period)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Kategori:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{budget.category}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Progress</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className={`h-2 ${status.status === 'over' ? '[&>div]:bg-red-500' : status.status === 'warning' ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Spent: {formatCurrency(budget.spent)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Budget: {formatCurrency(budget.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Remaining</p>
                          <p className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(remaining)}
                          </p>
                        </div>
                        
                        {status.status === 'over' && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Over Budget!</span>
                          </div>
                        )}
                        
                        {status.status === 'warning' && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Warning!</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newSpent = prompt('Masukkan jumlah yang sudah dikeluarkan:', budget.spent.toString());
                            if (newSpent && !isNaN(parseFloat(newSpent))) {
                              updateSpent(budget.id, parseFloat(newSpent));
                            }
                          }}
                          className="border-slate-300 dark:border-slate-600 flex-1"
                        >
                          Update Spent
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(budget.id)}
                          className={`border-slate-300 dark:border-slate-600 ${budget.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {budget.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
