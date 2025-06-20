import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id: string;
  user_id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  note: string;
  date: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  whatsapp_number: string;
  created_at: string;
};