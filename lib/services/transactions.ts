import { supabase, Transaction, TransactionInsert, TransactionUpdate } from '../supabase';

export class TransactionService {
  static async getTransactions(
    userId: string,
    options?: {
      limit?: number;
      type?: 'pemasukan' | 'pengeluaran';
      startDate?: string;
      endDate?: string;
      categoryId?: string;
    }
  ) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories!category_id (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTransaction(id: string, updates: TransactionUpdate) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories!category_id (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}