'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, currentDate]);

  const fetchTransactions = async () => {
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
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startCalendar = startOfMonth.startOf('week');
    const endCalendar = endOfMonth.endOf('week');

    const days = [];
    let day = startCalendar;

    while (day.isBefore(endCalendar) || day.isSame(endCalendar, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  };

  const getTransactionsForDate = (date: dayjs.Dayjs) => {
    const dateString = date.format('YYYY-MM-DD');
    return transactions.filter(t => t.date === dateString);
  };

  const getDateSummary = (date: dayjs.Dayjs) => {
    const dayTransactions = getTransactionsForDate(date);
    const income = dayTransactions
      .filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, total: dayTransactions.length };
  };

  const days = getDaysInMonth();
  const selectedDateTransactions = selectedDate ? 
    transactions.filter(t => t.date === selectedDate) : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
            <p className="text-muted-foreground">
              Lihat transaksi berdasarkan tanggal
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calendar */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {currentDate.format('MMMM YYYY')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(getCurrentJakartaTime())}
                    >
                      Hari ini
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
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
                        className={`
                          h-auto p-2 flex flex-col items-center justify-start text-left relative
                          ${!isCurrentMonth ? 'text-muted-foreground opacity-50' : ''}
                          ${isToday ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}
                          ${isSelected ? 'bg-accent' : ''}
                          ${summary.total > 0 ? 'border border-emerald-200 dark:border-emerald-800' : ''}
                        `}
                        onClick={() => setSelectedDate(
                          selectedDate === day.format('YYYY-MM-DD') ? null : day.format('YYYY-MM-DD')
                        )}
                      >
                        <span className="text-sm font-medium">{day.date()}</span>
                        {summary.total > 0 && (
                          <div className="flex gap-1 mt-1">
                            {summary.income > 0 && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            )}
                            {summary.expense > 0 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate 
                    ? dayjs(selectedDate).format('DD MMMM YYYY')
                    : 'Pilih Tanggal'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  selectedDateTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Tidak ada transaksi
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600">Pemasukan</span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(
                              selectedDateTransactions
                                .filter(t => t.type === 'pemasukan')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600">Pengeluaran</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(
                              selectedDateTransactions
                                .filter(t => t.type === 'pengeluaran')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          {selectedDateTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                transaction.type === 'pemasukan' 
                                  ? 'bg-emerald-100 text-emerald-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {transaction.type === 'pemasukan' ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {transaction.category}
                                </p>
                                <p className={`text-xs ${
                                  transaction.type === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'pemasukan' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Klik tanggal untuk melihat detail transaksi
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Keterangan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Pemasukan</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Pengeluaran</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-full"></div>
                  <span>Hari ini</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}