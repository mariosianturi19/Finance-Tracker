// lib/categories.ts
import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  icon: string;
  color: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

// Kategori default hardcoded sesuai permintaan
const defaultCategories: Category[] = [
  // Kategori Pengeluaran
  { id: 'exp-1', name: 'Makan', type: 'pengeluaran', icon: '🍽️', color: '#ef4444', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-2', name: 'Jajan', type: 'pengeluaran', icon: '🍿', color: '#f97316', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-3', name: 'Listrik', type: 'pengeluaran', icon: '⚡', color: '#eab308', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-4', name: 'Bensin', type: 'pengeluaran', icon: '⛽', color: '#22c55e', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-5', name: 'Laundry', type: 'pengeluaran', icon: '👕', color: '#06b6d4', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-6', name: 'Jalan-jalan', type: 'pengeluaran', icon: '✈️', color: '#8b5cf6', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'exp-7', name: 'Lainnya', type: 'pengeluaran', icon: '📦', color: '#6b7280', is_default: true, user_id: null, created_at: new Date().toISOString() },
  
  // Kategori Pemasukan
  { id: 'inc-1', name: 'Gaji', type: 'pemasukan', icon: '💰', color: '#10b981', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'inc-2', name: 'Freelance', type: 'pemasukan', icon: '💻', color: '#3b82f6', is_default: true, user_id: null, created_at: new Date().toISOString() },
  { id: 'inc-3', name: 'Lainnya', type: 'pemasukan', icon: '💎', color: '#8b5cf6', is_default: true, user_id: null, created_at: new Date().toISOString() },
];

export async function getCategories(): Promise<Category[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Return default categories if user not authenticated
    return defaultCategories;
  }

  try {
    // Try to get categories from database
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .order('name');

    if (error) {
      console.warn('Error fetching categories from database, using defaults:', error);
      return defaultCategories;
    }

    // If no categories in database, return defaults
    if (!data || data.length === 0) {
      return defaultCategories;
    }

    return data;
  } catch (error) {
    console.warn('Error accessing database, using default categories:', error);
    return defaultCategories;
  }
}

export async function createCategory(category: {
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  icon: string;
  color: string;
}): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      is_default: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: {
  name?: string;
  icon?: string;
  color?: string;
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}