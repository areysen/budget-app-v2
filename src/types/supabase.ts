export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          context: Json
          created_at: string | null
          expires_at: string | null
          household_id: string | null
          id: string
          recommendation: string
          status: string | null
          type: string
        }
        Insert: {
          confidence_score?: number | null
          context: Json
          created_at?: string | null
          expires_at?: string | null
          household_id?: string | null
          id?: string
          recommendation: string
          status?: string | null
          type: string
        }
        Update: {
          confidence_score?: number | null
          context?: Json
          created_at?: string | null
          expires_at?: string | null
          household_id?: string | null
          id?: string
          recommendation?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          created_at: string | null
          household_id: string | null
          id: string
          is_active: boolean | null
          is_system_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_type: string
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_type?: string
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system_default?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          account_name: string | null
          account_type: string | null
          created_at: string | null
          household_id: string | null
          id: string
          institution_name: string | null
          is_active: boolean | null
          last_sync_at: string | null
          plaid_access_token: string
          plaid_item_id: string
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          institution_name?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          plaid_access_token: string
          plaid_item_id: string
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          institution_name?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          plaid_access_token?: string
          plaid_item_id?: string
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      envelopes: {
        Row: {
          created_at: string | null
          default_amount: number | null
          description: string | null
          household_id: string | null
          id: string
          is_active: boolean | null
          name: string
          rollover_limit: number | null
          rollover_rule: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_amount?: number | null
          description?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rollover_limit?: number | null
          rollover_rule?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_amount?: number | null
          description?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rollover_limit?: number | null
          rollover_rule?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envelopes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          anchor_date: string | null
          category: string | null
          created_at: string | null
          estimated_amount: number
          frequency_config: Json | null
          frequency_type: string | null
          household_id: string | null
          id: string
          is_active: boolean | null
          is_variable: boolean | null
          name: string
          next_due_date: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          anchor_date?: string | null
          category?: string | null
          created_at?: string | null
          estimated_amount: number
          frequency_config?: Json | null
          frequency_type?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_variable?: boolean | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          anchor_date?: string | null
          category?: string | null
          created_at?: string | null
          estimated_amount?: number
          frequency_config?: Json | null
          frequency_type?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_variable?: boolean | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          can_approve_transactions: boolean | null
          can_edit_budget: boolean | null
          created_at: string | null
          household_id: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          can_approve_transactions?: boolean | null
          can_edit_budget?: boolean | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          can_approve_transactions?: boolean | null
          can_edit_budget?: boolean | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          budget_setup_complete: boolean
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          pay_schedule_type: string | null
        }
        Insert: {
          budget_setup_complete?: boolean
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          pay_schedule_type?: string | null
        }
        Update: {
          budget_setup_complete?: boolean
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          pay_schedule_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          amount: number
          anchor_date: string | null
          created_at: string | null
          frequency_config: Json | null
          frequency_type: string | null
          household_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          next_payment_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          anchor_date?: string | null
          created_at?: string | null
          frequency_config?: Json | null
          frequency_type?: string | null
          household_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          next_payment_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          anchor_date?: string | null
          created_at?: string | null
          frequency_config?: Json | null
          frequency_type?: string | null
          household_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          next_payment_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      paycheck_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          household_id: string | null
          id: string
          notes: string | null
          start_date: string
          status: string
          total_income: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          household_id?: string | null
          id?: string
          notes?: string | null
          start_date: string
          status?: string
          total_income?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          household_id?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          total_income?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paycheck_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paycheck_periods_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      period_envelopes: {
        Row: {
          allocated_amount: number
          envelope_id: string | null
          id: string
          notes: string | null
          period_id: string | null
          rollover_from_previous: number | null
          spent_amount: number
        }
        Insert: {
          allocated_amount?: number
          envelope_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          rollover_from_previous?: number | null
          spent_amount?: number
        }
        Update: {
          allocated_amount?: number
          envelope_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          rollover_from_previous?: number | null
          spent_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "period_envelopes_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_envelopes_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      period_fixed_expenses: {
        Row: {
          actual_amount: number | null
          allocated_amount: number
          due_date: string | null
          fixed_expense_id: string | null
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_date: string | null
          period_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          allocated_amount: number
          due_date?: string | null
          fixed_expense_id?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_date?: string | null
          period_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          allocated_amount?: number
          due_date?: string | null
          fixed_expense_id?: string | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_date?: string | null
          period_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "period_fixed_expenses_fixed_expense_id_fkey"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_fixed_expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      period_income: {
        Row: {
          amount: number
          created_at: string | null
          expected_date: string | null
          id: string
          is_confirmed: boolean | null
          period_id: string | null
          received_date: string | null
          source_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expected_date?: string | null
          id?: string
          is_confirmed?: boolean | null
          period_id?: string | null
          received_date?: string | null
          source_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expected_date?: string | null
          id?: string
          is_confirmed?: boolean | null
          period_id?: string | null
          received_date?: string | null
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_income_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_transactions: {
        Row: {
          amount: number
          category: string[] | null
          created_at: string | null
          description: string
          household_id: string | null
          id: string
          merchant_name: string | null
          pending: boolean | null
          plaid_account_id: string
          plaid_transaction_id: string
          posted_date: string | null
          raw_data: Json | null
          transaction_date: string
        }
        Insert: {
          amount: number
          category?: string[] | null
          created_at?: string | null
          description: string
          household_id?: string | null
          id?: string
          merchant_name?: string | null
          pending?: boolean | null
          plaid_account_id: string
          plaid_transaction_id: string
          posted_date?: string | null
          raw_data?: Json | null
          transaction_date: string
        }
        Update: {
          amount?: number
          category?: string[] | null
          created_at?: string | null
          description?: string
          household_id?: string | null
          id?: string
          merchant_name?: string | null
          pending?: boolean | null
          plaid_account_id?: string
          plaid_transaction_id?: string
          posted_date?: string | null
          raw_data?: Json | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          amount: number
          contribution_date: string | null
          contribution_type: string | null
          created_at: string | null
          created_by: string | null
          goal_id: string | null
          household_id: string | null
          id: string
          notes: string | null
          period_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          contribution_date?: string | null
          contribution_type?: string | null
          created_at?: string | null
          created_by?: string | null
          goal_id?: string | null
          household_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          contribution_date?: string | null
          contribution_type?: string | null
          created_at?: string | null
          created_by?: string | null
          goal_id?: string | null
          household_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_balance: number | null
          description: string | null
          household_id: string | null
          id: string
          is_active: boolean | null
          is_emergency_fund: boolean | null
          is_roundup_target: boolean | null
          name: string
          sort_order: number | null
          target_amount: number | null
          target_date: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency_fund?: boolean | null
          is_roundup_target?: boolean | null
          name: string
          sort_order?: number | null
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          household_id?: string | null
          id?: string
          is_active?: boolean | null
          is_emergency_fund?: boolean | null
          is_roundup_target?: boolean | null
          name?: string
          sort_order?: number | null
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      spending_insights: {
        Row: {
          category: string | null
          comparison_value: number | null
          created_at: string | null
          household_id: string | null
          id: string
          insight_text: string
          insight_type: string
          metric_value: number | null
          period_id: string | null
          severity: string | null
        }
        Insert: {
          category?: string | null
          comparison_value?: number | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          insight_text: string
          insight_type: string
          metric_value?: number | null
          period_id?: string | null
          severity?: string | null
        }
        Update: {
          category?: string | null
          comparison_value?: number | null
          created_at?: string | null
          household_id?: string | null
          id?: string
          insight_text?: string
          insight_type?: string
          metric_value?: number | null
          period_id?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spending_insights_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_insights_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_transactions: {
        Row: {
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          description: string
          entered_by: string | null
          envelope_id: string | null
          fixed_expense_id: string | null
          household_id: string | null
          id: string
          notes: string | null
          period_id: string | null
          plaid_transaction_id: string | null
          roundup_amount: number | null
          savings_goal_id: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          entered_by?: string | null
          envelope_id?: string | null
          fixed_expense_id?: string | null
          household_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          plaid_transaction_id?: string | null
          roundup_amount?: number | null
          savings_goal_id?: string | null
          transaction_date: string
        }
        Update: {
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          entered_by?: string | null
          envelope_id?: string | null
          fixed_expense_id?: string | null
          household_id?: string | null
          id?: string
          notes?: string | null
          period_id?: string | null
          plaid_transaction_id?: string | null
          roundup_amount?: number | null
          savings_goal_id?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_fixed_expense_id_fkey"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "paycheck_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_plaid_transaction_id_fkey"
            columns: ["plaid_transaction_id"]
            isOneToOne: false
            referencedRelation: "plaid_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_savings_goal_id_fkey"
            columns: ["savings_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
