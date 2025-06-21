// lib/types.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          whatsapp_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          whatsapp_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          whatsapp_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: 'pemasukan' | 'pengeluaran';
          icon: string;
          color: string;
          is_default: boolean;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'pemasukan' | 'pengeluaran';
          icon: string;
          color: string;
          is_default?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'pemasukan' | 'pengeluaran';
          icon?: string;
          color?: string;
          is_default?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'bank' | 'ewallet' | 'cash';
          initial_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'bank' | 'ewallet' | 'cash';
          initial_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
         type?: 'bank' | 'ewallet' | 'cash';
         initial_balance?: number;
         created_at?: string;
         updated_at?: string;
       };
     };
     transactions: {
       Row: {
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
       };
       Insert: {
         id?: string;
         user_id: string;
         category_id?: string | null;
         wallet_id?: string | null;
         type: 'pemasukan' | 'pengeluaran';
         amount: number;
         category: string;
         note?: string | null;
         date: string;
         tags?: string[] | null;
         receipt_url?: string | null;
         location?: string | null;
         created_at?: string;
         updated_at?: string;
       };
       Update: {
         id?: string;
         user_id?: string;
         category_id?: string | null;
         wallet_id?: string | null;
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
     };
     budgets: {
       Row: {
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
       Insert: {
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
       Update: {
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
     };
     savings_goals: {
       Row: {
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
       Insert: {
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
       Update: {
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
     };
   };
 };
};

export type WalletType = 'bank' | 'ewallet' | 'cash';

export interface Wallet {
 id: string;
 user_id: string;
 name: string;
 type: WalletType;
 initial_balance: number;
 created_at: string;
 updated_at: string;
}

export interface WalletWithBalance extends Wallet {
 current_balance: number;
}

export interface Profile {
 id: string;
 full_name: string | null;
 whatsapp_number: string | null;
 created_at: string;
 updated_at: string;
}

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