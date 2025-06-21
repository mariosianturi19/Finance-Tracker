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

export async function getCategories(): Promise<Category[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},is_default.eq.true`)
    .order('name');

  if (error) throw error;
  return data || [];
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