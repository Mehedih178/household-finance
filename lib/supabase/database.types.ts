export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          updated_at?: string;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "member";
        };
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          color: string;
          icon: string;
          kind: "income" | "expense";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          color?: string;
          icon?: string;
          kind: "income" | "expense";
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          icon?: string;
          kind?: "income" | "expense";
        };
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: "checking" | "savings" | "credit" | "cash" | "investment" | "loan";
          balance: number;
          is_shared: boolean;
          owner_id: string;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: "checking" | "savings" | "credit" | "cash" | "investment" | "loan";
          balance?: number;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: "checking" | "savings" | "credit" | "cash" | "investment" | "loan";
          balance?: number;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string | null;
          category_id: string | null;
          amount: number;
          kind: "income" | "expense";
          description: string;
          occurred_on: string;
          is_shared: boolean;
          owner_id: string;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id?: string | null;
          category_id?: string | null;
          amount: number;
          kind: "income" | "expense";
          description: string;
          occurred_on: string;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          amount?: number;
          kind?: "income" | "expense";
          description?: string;
          occurred_on?: string;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          month: string;
          amount: number;
          is_shared: boolean;
          owner_id: string;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          month: string;
          amount: number;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          month?: string;
          amount?: number;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      recurring_items: {
        Row: {
          id: string;
          household_id: string;
          account_id: string | null;
          category_id: string | null;
          amount: number;
          kind: "income" | "expense";
          description: string;
          frequency: "weekly" | "biweekly" | "monthly" | "yearly";
          next_due_on: string;
          is_shared: boolean;
          owner_id: string;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id?: string | null;
          category_id?: string | null;
          amount: number;
          kind: "income" | "expense";
          description: string;
          frequency: "weekly" | "biweekly" | "monthly" | "yearly";
          next_due_on: string;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          amount?: number;
          kind?: "income" | "expense";
          description?: string;
          frequency?: "weekly" | "biweekly" | "monthly" | "yearly";
          next_due_on?: string;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          household_id: string;
          email: string;
          token: string;
          status: "pending" | "accepted" | "revoked";
          invited_by: string;
          accepted_by: string | null;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          email: string;
          token: string;
          status?: "pending" | "accepted" | "revoked";
          invited_by: string;
          accepted_by?: string | null;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          status?: "pending" | "accepted" | "revoked";
          accepted_by?: string | null;
          accepted_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
