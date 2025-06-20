import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// ============== COMPLETE TYPES ==============

// Profile Types (Updated dengan email)
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  whatsapp_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  email: string;
  full_name: string;
  whatsapp_number?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = {
  id?: string;
  email?: string;
  full_name?: string;
  whatsapp_number?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Transaction Types
export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
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
};

export type TransactionInsert = {
  id?: string;
  user_id: string;
  category_id?: string | null;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note?: string | null;
  date?: string;
  tags?: string[] | null;
  receipt_url?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TransactionUpdate = {
  id?: string;
  user_id?: string;
  category_id?: string | null;
  type?: 'pemasukan' | 'pengeluaran';
  amount?: number;
  category?: string;
  note?: string | null;
  date?: string;
  tags?: string[] | null;
  receipt_url?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Category Types
export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryInsert = {
  id?: string;
  user_id: string;
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  color?: string;
  icon?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryUpdate = {
  id?: string;
  user_id?: string;
  name?: string;
  type?: 'pemasukan' | 'pengeluaran';
  color?: string;
  icon?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Budget Types
export type Budget = {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  alert_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BudgetInsert = {
  id?: string;
  user_id: string;
  category_id?: string | null;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  alert_percentage?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BudgetUpdate = {
  id?: string;
  user_id?: string;
  category_id?: string | null;
  name?: string;
  amount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string | null;
  alert_percentage?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Savings Goal Types
export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description: string | null;
  priority: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type SavingsGoalInsert = {
  id?: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  description?: string | null;
  priority?: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavingsGoalUpdate = {
  id?: string;
  user_id?: string;
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string | null;
  description?: string | null;
  priority?: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Recurring Transaction Types
export type RecurringTransaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecurringTransactionInsert = {
  id?: string;
  user_id: string;
  category_id?: string | null;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RecurringTransactionUpdate = {
  id?: string;
  user_id?: string;
  category_id?: string | null;
  type?: 'pemasukan' | 'pengeluaran';
  amount?: number;
  category?: string;
  note?: string | null;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string | null;
  next_occurrence?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Notification Types
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
  is_read: boolean;
  action_url: string | null;
  created_at: string;
};

export type NotificationInsert = {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
  is_read?: boolean;
  action_url?: string | null;
  created_at?: string;
};

export type NotificationUpdate = {
  id?: string;
  user_id?: string;
  title?: string;
  message?: string;
  type?: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
  is_read?: boolean;
  action_url?: string | null;
  created_at?: string;
};

// Tag Types
export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TagInsert = {
  id?: string;
  user_id: string;
  name: string;
  color?: string;
  created_at?: string;
};

export type TagUpdate = {
  id?: string;
  user_id?: string;
  name?: string;
  color?: string;
  created_at?: string;
};

// View Types untuk Analytics
export type TransactionSummary = {
  user_id: string;
  month: string;
  type: 'pemasukan' | 'pengeluaran';
  total_amount: number;
  transaction_count: number;
};

export type BudgetTracking = {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  alert_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  spent_amount: number;
  spent_percentage: number;
};

export type MonthlySummary = {
  user_id: string;
  month: string;
  total_income: number;
  total_expense: number;
  net_amount: number;
  total_transactions: number;
};

// Enhanced Transaction with Category Info
export type TransactionWithCategory = Transaction & {
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
};

// ============== HELPER FUNCTIONS ==============

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}

// Get current user profile
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Create or update profile
export async function upsertProfile(profile: ProfileInsert) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }
}

// Get user transactions with pagination
export async function getUserTransactions(
  userId: string, 
  options?: {
    limit?: number;
    offset?: number;
    type?: 'pemasukan' | 'pengeluaran';
    startDate?: string;
    endDate?: string;
    search?: string;
  }
) {
  try {
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

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
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

    if (options?.search) {
      query = query.or(`category.ilike.%${options.search}%,note.ilike.%${options.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Get user categories
export async function getUserCategories(userId: string, type?: 'pemasukan' | 'pengeluaran') {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Get transaction summary for dashboard
export async function getTransactionSummary(userId: string, months = 12) {
  try {
    const { data, error } = await supabase
      .from('monthly_summary')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(months);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    throw error;
  }
}

// Get budget tracking
export async function getBudgetTracking(userId: string) {
  try {
    const { data, error } = await supabase
      .from('budget_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('spent_percentage', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching budget tracking:', error);
    throw error;
  }
}

// Get savings goals
export async function getSavingsGoals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    throw error;
  }
}

// Get unread notifications
export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Get financial overview for dashboard
export async function getFinancialOverview(userId: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get current month transactions
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`);

    if (transError) throw transError;

    // Calculate totals
    const totalIncome = transactions
      ?.filter(t => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalExpense = transactions
      ?.filter(t => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const balance = totalIncome - totalExpense;

    // Get active budgets count
    const { count: budgetCount } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get savings goals count
    const { count: goalsCount } = await supabase
      .from('savings_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false);

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions?.length || 0,
      activeBudgets: budgetCount || 0,
      activeGoals: goalsCount || 0,
    };
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    throw error;
  }
}

// Export untuk backward compatibility
export { supabase as default };