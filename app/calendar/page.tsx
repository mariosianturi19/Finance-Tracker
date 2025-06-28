'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency, getCurrentJakartaTime } from '@/lib/timezone';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';

export default function CalendarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getCurrentJakartaTime());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    try {
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentDate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let current = startOfCalendar;

    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }

    return days;
  };

  const getDateSummary = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    
    return {
      total: dayTransactions.length,
      income: dayTransactions.filter(t => t.type === 'pemasukan').length,
      expense: dayTransactions.filter(t => t.type === 'pengeluaran').length,
    };
  };

  const days = getDaysInMonth();
  const selectedDateTransactions = selectedDate ? 
    transactions.filter(t => t.date === selectedDate) : [];

  return (
    <DashboardLayout>
      <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Kalender</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Lihat dan kelola transaksi berdasarkan tanggal
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Calendar */}
            <div className="md:col-span-2">
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      <Calendar className="h-6 w-6" />
                      {currentDate.format('MMMM YYYY')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(getCurrentJakartaTime())}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Hari ini
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                      <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                      const isCurrentMonth = day.month() === currentDate.month();
                      const isToday = day.isSame(getCurrentJakartaTime(), 'day');
                      const isSelected = selectedDate === day.format('YYYY-MM-DD');
                      const summary = getDateSummary(day);

                      return (
                        <Button
                          key={day.format('YYYY-MM-DD')}
                          variant="ghost"
                          className={`h-auto p-3 flex flex-col items-center justify-start text-left relative rounded-xl transition-all ${
                            !isCurrentMonth ? 'text-slate-400 dark:text-slate-600 opacity-60' : 'text-slate-700 dark:text-slate-300'
                          } ${
                            isToday ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-2 ring-slate-300 dark:ring-slate-600' : ''
                          } ${
                            isSelected ? 'bg-slate-200 dark:bg-slate-700' : ''
                          } ${
                            summary.total > 0 ? 'border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                          }`}
                          onClick={() => setSelectedDate(
                            selectedDate === day.format('YYYY-MM-DD') ? null : day.format('YYYY-MM-DD')
                          )}
                        >
                          <span className="text-sm font-semibold">{day.date()}</span>
                          {summary.total > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {summary.income > 0 && (
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"></div>
                              )}
                              {summary.expense > 0 && (
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div>
                              )}
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Details */}
            <div>
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedDate 
                      ? dayjs(selectedDate).format('DD MMMM YYYY')
                      : 'Pilih Tanggal'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    selectedDateTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                          Tidak ada transaksi pada tanggal ini
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Pemasukan</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(
                                selectedDateTransactions
                                  .filter(t => t.type === 'pemasukan')
                                  .reduce((sum, t) => sum + t.amount, 0)
                              )}
                            </span>
                          </div>
                          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <span className="text-sm text-red-700 dark:text-red-300 font-medium">Pengeluaran</span>
                            </div>
                            <span className="text-lg font-bold text-red-700 dark:text-red-300">
                              {formatCurrency(
                                selectedDateTransactions
                                  .filter(t => t.type === 'pengeluaran')
                                  .reduce((sum, t) => sum + t.amount, 0)
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Detail Transaksi</h4>
                          <div className="space-y-3">
                            {selectedDateTransactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                                  transaction.type === 'pemasukan' 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                                }`}>
                                  {transaction.type === 'pemasukan' ? (
                                    <TrendingUp className="h-5 w-5" />
                                  ) : (
                                    <TrendingDown className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {transaction.category}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    transaction.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {transaction.type === 'pemasukan' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                  </p>
                                  {transaction.note && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {transaction.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Pilih tanggal untuk melihat detail transaksi
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="mt-6 border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Keterangan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pengeluaran</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hari ini</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
