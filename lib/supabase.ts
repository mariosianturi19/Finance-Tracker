// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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