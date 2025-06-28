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
  console.log('🚀 createTransaction called with:', transaction.type, transaction.amount);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  console.log('✅ User authenticated, creating transaction in database...');

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

  if (error) {
    console.error('❌ Database error:', error);
    throw error;
  }

  console.log('✅ Transaction created successfully:', data.id);
  console.log('📱 Attempting to send WhatsApp notification...');

  // Send WhatsApp notification (optional, non-blocking)
  try {
    await sendTransactionNotification(data, user.id);
    console.log('✅ WhatsApp notification process completed');
  } catch (notificationError) {
    console.error('❌ Failed to send WhatsApp notification:', notificationError);
    // Don't throw error, notification failure shouldn't block transaction creation
  }

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

// Helper function to send WhatsApp notification for transaction
async function sendTransactionNotification(transaction: Transaction, userId: string): Promise<void> {
  console.log('🔔 sendTransactionNotification called for transaction:', transaction.id);
  
  try {
    // Get user profile to check WhatsApp settings
    console.log('📱 Fetching user profile for WhatsApp settings...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number')
      .eq('id', userId)
      .single();

    console.log('👤 Profile data:', { 
      userId, 
      whatsapp_number: profile?.whatsapp_number || 'Not set' 
    });

    // Check if WhatsApp number exists (if exists, notifications are considered enabled)
    if (!profile?.whatsapp_number) {
      console.log('⚠️  WhatsApp notifications disabled or no phone number');
      return;
    }

    console.log('✅ WhatsApp number found, proceeding with notification...');

    // Get wallet information
    const { data: wallet } = await supabase
      .from('wallets')
      .select('name')
      .eq('id', transaction.wallet_id)
      .single();

    // Format amount in IDR
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(transaction.amount / 100);

    // Format date
    const transactionDate = new Date(transaction.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create notification message
    const transactionType = transaction.type === 'pemasukan' ? '💰 PEMASUKAN' : '💸 PENGELUARAN';
    const emoji = transaction.type === 'pemasukan' ? '✅' : '❌';
    
    const message = `${emoji} *NOTIFIKASI TRANSAKSI*

${transactionType}
💰 Jumlah: ${formattedAmount}
📁 Kategori: ${transaction.category}
🏦 Sumber: ${wallet?.name || 'N/A'}
📅 Tanggal: ${transactionDate}
${transaction.note ? `📝 Catatan: ${transaction.note}` : ''}

Transaksi Anda berhasil dicatat dalam Finance Tracker! 🎉`;

    console.log('📤 Sending WhatsApp message via API to:', profile.whatsapp_number);
    console.log('💬 Message content preview:', message.substring(0, 100) + '...');

    // Send notification via API endpoint (works from client-side)
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: profile.whatsapp_number,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ WhatsApp notification sent successfully for transaction:', transaction.id);
    console.log('📱 API Response:', result);
  } catch (error) {
    console.error('Error sending transaction notification:', error);
    throw error;
  }
}