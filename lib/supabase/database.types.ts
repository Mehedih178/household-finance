export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment" | "crypto" | "loan";
export type MoneyKind = "income" | "expense";
export type NotificationFrequency = "instant" | "daily" | "weekly";
export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type TargetType = "transaction" | "account" | "goal" | "household";

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
          kind: MoneyKind;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          color?: string;
          icon?: string;
          kind: MoneyKind;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          icon?: string;
          kind?: MoneyKind;
        };
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: AccountType;
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
          type: AccountType;
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
          type?: AccountType;
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
          kind: MoneyKind;
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
          kind: MoneyKind;
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
          kind?: MoneyKind;
          description?: string;
          occurred_on?: string;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      transaction_receipts: {
        Row: {
          id: string;
          household_id: string;
          transaction_id: string;
          storage_path: string;
          file_name: string;
          content_type: string;
          size_bytes: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          transaction_id: string;
          storage_path: string;
          file_name: string;
          content_type: string;
          size_bytes?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          file_name?: string;
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
          kind: MoneyKind;
          description: string;
          frequency: RecurringFrequency;
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
          kind: MoneyKind;
          description: string;
          frequency: RecurringFrequency;
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
          kind?: MoneyKind;
          description?: string;
          frequency?: RecurringFrequency;
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
          role: "owner" | "member";
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
          role?: "owner" | "member";
          invited_by: string;
          accepted_by?: string | null;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          status?: "pending" | "accepted" | "revoked";
          role?: "owner" | "member";
          accepted_by?: string | null;
          accepted_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          target_amount: number;
          target_date: string | null;
          color: string;
          icon: string;
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
          target_amount: number;
          target_date?: string | null;
          color?: string;
          icon?: string;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          target_amount?: number;
          target_date?: string | null;
          color?: string;
          icon?: string;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          household_id: string;
          amount: number;
          note: string | null;
          contributed_on: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          household_id: string;
          amount: number;
          note?: string | null;
          contributed_on?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          amount?: number;
          note?: string | null;
          contributed_on?: string;
        };
      };
      financial_notes: {
        Row: {
          id: string;
          household_id: string;
          target_type: TargetType;
          target_id: string | null;
          body: string;
          is_shared: boolean;
          owner_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          target_type: TargetType;
          target_id?: string | null;
          body: string;
          is_shared?: boolean;
          owner_id: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          body?: string;
          is_shared?: boolean;
        };
      };
      net_worth_snapshots: {
        Row: {
          id: string;
          household_id: string;
          snapshot_on: string;
          assets: number;
          liabilities: number;
          net_worth: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          snapshot_on?: string;
          assets?: number;
          liabilities?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          snapshot_on?: string;
          assets?: number;
          liabilities?: number;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          frequency: NotificationFrequency;
          budget_alerts: boolean;
          bills: boolean;
          goals: boolean;
          achievements: boolean;
          household_activity: boolean;
          insights: boolean;
          recurring_transactions: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          frequency?: NotificationFrequency;
          budget_alerts?: boolean;
          bills?: boolean;
          goals?: boolean;
          achievements?: boolean;
          household_activity?: boolean;
          insights?: boolean;
          recurring_transactions?: boolean;
          updated_at?: string;
        };
        Update: {
          frequency?: NotificationFrequency;
          budget_alerts?: boolean;
          bills?: boolean;
          goals?: boolean;
          achievements?: boolean;
          household_activity?: boolean;
          insights?: boolean;
          recurring_transactions?: boolean;
          updated_at?: string;
        };
      };
      notification_reads: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          notification_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          notification_id: string;
          read_at?: string;
        };
        Update: {
          read_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: AccountType;
      money_kind: MoneyKind;
      notification_frequency: NotificationFrequency;
      recurring_frequency: RecurringFrequency;
      invitation_status: "pending" | "accepted" | "revoked";
      member_role: "owner" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};
