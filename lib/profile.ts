// lib/profile.ts
import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function createProfile(profile: {
  id: string;
  full_name: string;
  whatsapp_number?: string;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profile.id,
      full_name: profile.full_name,
      whatsapp_number: profile.whatsapp_number || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  full_name?: string;
  whatsapp_number?: string;
}): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}