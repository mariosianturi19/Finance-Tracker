// lib/transactions.ts
import { supabase } from './supabase';

export interface CreateTransactionData {
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  wallet_id: string;
  note?: string | null;
  date: string;
  tags?: string[];
  receipt_url?: string | null;
  location?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  wallet_id: string | null;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note: string | null;
  date: string;
  tags: string[] | null;
  receipt_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export async function createTransaction(transaction: CreateTransactionData): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id: transaction.wallet_id,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      note: transaction.note,
      date: transaction.date,
      tags: transaction.tags,
      receipt_url: transaction.receipt_url,
      location: transaction.location,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTransactions(year?: number, month?: number): Promise<Transaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (year && month) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getTransactionsByWallet(walletId: string, year?: number, month?: number): Promise<Transaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('wallet_id', walletId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (year && month) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateTransaction(id: string, updates: Partial<CreateTransactionData>): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTransactionStats(walletId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', user.id);

  if (walletId) {
    query = query.eq('wallet_id', walletId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: data?.length || 0,
  };

  if (data) {
    stats.totalIncome = data
      .filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    
    stats.totalExpense = data
      .filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    
    stats.balance = stats.totalIncome - stats.totalExpense;
  }

  return stats;
}