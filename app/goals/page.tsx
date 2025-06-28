'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Edit,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface Goal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'savings' | 'investment' | 'purchase' | 'emergency' | 'other';
  is_completed: boolean;
  created_at: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'savings' as 'savings' | 'investment' | 'purchase' | 'emergency' | 'other'
  });

  // Dummy data for demo purposes
  useEffect(() => {
    const dummyGoals: Goal[] = [
      {
        id: '1',
        name: 'Dana Darurat',
        description: 'Dana darurat untuk 6 bulan pengeluaran',
        target_amount: 50000000,
        current_amount: 25000000,
        target_date: '2024-12-31',
        priority: 'high',
        category: 'emergency',
        is_completed: false,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Laptop Baru',
        description: 'MacBook Pro untuk kerja',
        target_amount: 30000000,
        current_amount: 18000000,
        target_date: '2024-08-15',
        priority: 'medium',
        category: 'purchase',
        is_completed: false,
        created_at: '2024-02-01'
      },
      {
        id: '3',
        name: 'Investasi Saham',
        description: 'Portfolio investasi jangka panjang',
        target_amount: 100000000,
        current_amount: 100000000,
        target_date: '2025-12-31',
        priority: 'low',
        category: 'investment',
        is_completed: true,
        created_at: '2023-12-01'
      }
    ];
    
    setGoals(dummyGoals);
    setLoading(false);
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
      priority: 'medium',
      category: 'savings'
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_amount) {
      toast.error('Nama dan target amount harus diisi');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date || undefined,
      priority: formData.priority,
      category: formData.category,
      is_completed: false,
      created_at: new Date().toISOString()
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...newGoal, id: editingGoal.id } : g));
      toast.success('Goal berhasil diperbarui');
    } else {
      setGoals([...goals, newGoal]);
      toast.success('Goal baru berhasil ditambahkan');
    }

    resetForm();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || '',
      priority: goal.priority,
      category: goal.category
    });
    setShowForm(true);
  };

  const handleDelete = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    toast.success('Goal berhasil dihapus');
  };

  const toggleComplete = (goalId: string) => {
    setGoals(goals.map(g => 
      g.id === goalId 
        ? { ...g, is_completed: !g.is_completed, current_amount: g.is_completed ? g.current_amount : g.target_amount }
        : g
    ));
    toast.success('Status goal berhasil diubah');
  };

  const updateProgress = (goalId: string, amount: number) => {
    setGoals(goals.map(g => 
      g.id === goalId 
        ? { ...g, current_amount: Math.min(amount, g.target_amount) }
        : g
    ));
    toast.success('Progress berhasil diperbarui');
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings': return '💰';
      case 'investment': return '📈';
      case 'purchase': return '🛒';
      case 'emergency': return '🚨';
      default: return '🎯';
    }
  };

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    const days = differenceInDays(parseISO(targetDate), new Date());
    return days;
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Memuat goals...</p>
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
              <Target className="h-6 w-6" />
              Financial Goals
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Kelola target keuangan dan pantau progress Anda
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Goal
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                {editingGoal ? 'Edit Goal' : 'Tambah Goal Baru'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Nama Goal *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Dana Darurat"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Kategori</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value="savings">Tabungan</option>
                      <option value="investment">Investasi</option>
                      <option value="purchase">Pembelian</option>
                      <option value="emergency">Dana Darurat</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Deskripsi</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi goal (opsional)"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Target Amount *</Label>
                    <Input
                      type="number"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      placeholder="50000000"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Current Amount</Label>
                    <Input
                      type="number"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      placeholder="0"
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Target Date</Label>
                    <Input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Prioritas</Label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                  >
                    {editingGoal ? 'Update Goal' : 'Simpan Goal'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Goals</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{goals.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{activeGoals.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Goals Aktif</h2>
          
          {activeGoals.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">Belum ada goals aktif</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Goal Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeGoals.map((goal) => {
                const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
                const daysRemaining = getDaysRemaining(goal.target_date);
                
                return (
                  <Card key={goal.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                          <div>
                            <CardTitle className="text-slate-900 dark:text-slate-100 text-lg">
                              {goal.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getPriorityColor(goal.priority)}>
                                {goal.priority === 'high' ? 'Tinggi' : goal.priority === 'medium' ? 'Sedang' : 'Rendah'}
                              </Badge>
                              {daysRemaining !== null && (
                                <Badge variant="outline" className="text-xs">
                                  {daysRemaining > 0 ? `${daysRemaining} hari lagi` : daysRemaining === 0 ? 'Hari ini' : 'Terlambat'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Progress</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(goal.current_amount)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Target: {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                      </div>

                      {goal.target_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>Target: {format(parseISO(goal.target_date), 'dd MMMM yyyy', { locale: id })}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => toggleComplete(goal.id)}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Tandai Selesai
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newAmount = prompt('Masukkan jumlah progress saat ini:', goal.current_amount.toString());
                            if (newAmount && !isNaN(parseFloat(newAmount))) {
                              updateProgress(goal.id, parseFloat(newAmount));
                            }
                          }}
                          className="border-slate-300 dark:border-slate-600"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Goals Selesai</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                        <div>
                          <CardTitle className="text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                            {goal.name}
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </CardTitle>
                          <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Selesai
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleComplete(goal.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(goal.target_amount)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Target tercapai!</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
