export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          whatsapp_number: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          whatsapp_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          whatsapp_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
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
        Insert: {
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
        Update: {
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
      };
      transactions: {
        Row: {
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
        Insert: {
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
        Update: {
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
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'budget_alert' | 'goal_reminder' | 'transaction_reminder' | 'general';
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      transaction_summary: {
        Row: {
          user_id: string;
          month: string;
          type: 'pemasukan' | 'pengeluaran';
          total_amount: number;
          transaction_count: number;
        };
      };
      budget_tracking: {
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
          spent_amount: number;
          spent_percentage: number;
        };
      };
      monthly_summary: {
        Row: {
          user_id: string;
          month: string;
          total_income: number;
          total_expense: number;
          net_amount: number;
          total_transactions: number;
        };
      };
    };
    Functions: {
      create_default_categories: {
        Args: {
          user_uuid: string;
        };
        Returns: void;
      };
    };
  };
}