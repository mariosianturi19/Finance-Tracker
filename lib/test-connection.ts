import { supabase } from './supabase';

export async function testDatabaseConnection() {
  try {
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { authData, authError });

    // Test basic query
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    console.log('Categories test:', { categories, categoriesError });

    // Test transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
      
    console.log('Transactions test:', { transactions, transactionsError });

    return {
      auth: !authError,
      categories: !categoriesError,
      transactions: !transactionsError
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      auth: false,
      categories: false,
      transactions: false
    };
  }
}