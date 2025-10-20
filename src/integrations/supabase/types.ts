export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_positions: {
        Row: {
          amount: number
          current_price: number
          current_value: number
          entry_price: number
          entry_tx_signature: string | null
          id: string
          last_updated: string | null
          opened_at: string | null
          profit_loss_percentage: number
          token_address: string
          token_symbol: string | null
          usdc_invested: number
          user_id: string
        }
        Insert: {
          amount: number
          current_price: number
          current_value: number
          entry_price: number
          entry_tx_signature?: string | null
          id?: string
          last_updated?: string | null
          opened_at?: string | null
          profit_loss_percentage: number
          token_address: string
          token_symbol?: string | null
          usdc_invested: number
          user_id: string
        }
        Update: {
          amount?: number
          current_price?: number
          current_value?: number
          entry_price?: number
          entry_tx_signature?: string | null
          id?: string
          last_updated?: string | null
          opened_at?: string | null
          profit_loss_percentage?: number
          token_address?: string
          token_symbol?: string | null
          usdc_invested?: number
          user_id?: string
        }
        Relationships: []
      }
      bot_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          rpc_endpoint: string | null
          updated_at: string | null
          user_id: string
          wallet_public_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rpc_endpoint?: string | null
          updated_at?: string | null
          user_id: string
          wallet_public_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rpc_endpoint?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_public_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_settings: {
        Row: {
          auto_detect_enabled: boolean | null
          created_at: string | null
          id: string
          max_concurrent_positions: number | null
          max_investment_per_token: number | null
          max_rugpull_risk_score: number | null
          min_liquidity_usd: number | null
          profit_threshold_percentage: number | null
          safety_check_enabled: boolean | null
          stop_loss_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_detect_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_concurrent_positions?: number | null
          max_investment_per_token?: number | null
          max_rugpull_risk_score?: number | null
          min_liquidity_usd?: number | null
          profit_threshold_percentage?: number | null
          safety_check_enabled?: boolean | null
          stop_loss_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_detect_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_concurrent_positions?: number | null
          max_investment_per_token?: number | null
          max_rugpull_risk_score?: number | null
          min_liquidity_usd?: number | null
          profit_threshold_percentage?: number | null
          safety_check_enabled?: boolean | null
          stop_loss_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      token_launches: {
        Row: {
          created_at: string | null
          detected_at: string | null
          id: string
          initial_liquidity: number | null
          initial_price: number | null
          source: string
          status: Database["public"]["Enums"]["token_status"] | null
          token_address: string
          token_name: string | null
          token_symbol: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          initial_liquidity?: number | null
          initial_price?: number | null
          source: string
          status?: Database["public"]["Enums"]["token_status"] | null
          token_address: string
          token_name?: string | null
          token_symbol?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          id?: string
          initial_liquidity?: number | null
          initial_price?: number | null
          source?: string
          status?: Database["public"]["Enums"]["token_status"] | null
          token_address?: string
          token_name?: string | null
          token_symbol?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      token_safety: {
        Row: {
          analysis_source: string | null
          analyzed_at: string | null
          contract_verified: boolean | null
          created_at: string | null
          holder_count: number | null
          honeypot_check: boolean | null
          id: string
          liquidity_locked: boolean | null
          raw_data: Json | null
          rugpull_risk_score: number | null
          safety_status: Database["public"]["Enums"]["safety_status"] | null
          token_address: string
          top_holder_percentage: number | null
        }
        Insert: {
          analysis_source?: string | null
          analyzed_at?: string | null
          contract_verified?: boolean | null
          created_at?: string | null
          holder_count?: number | null
          honeypot_check?: boolean | null
          id?: string
          liquidity_locked?: boolean | null
          raw_data?: Json | null
          rugpull_risk_score?: number | null
          safety_status?: Database["public"]["Enums"]["safety_status"] | null
          token_address: string
          top_holder_percentage?: number | null
        }
        Update: {
          analysis_source?: string | null
          analyzed_at?: string | null
          contract_verified?: boolean | null
          created_at?: string | null
          holder_count?: number | null
          honeypot_check?: boolean | null
          id?: string
          liquidity_locked?: boolean | null
          raw_data?: Json | null
          rugpull_risk_score?: number | null
          safety_status?: Database["public"]["Enums"]["safety_status"] | null
          token_address?: string
          top_holder_percentage?: number | null
        }
        Relationships: []
      }
      trade_history: {
        Row: {
          action: string
          amount: number
          created_at: string | null
          entry_price: number | null
          error_message: string | null
          exit_price: number | null
          id: string
          position_id: string | null
          price: number
          profit_loss_percentage: number | null
          signature: string | null
          status: string | null
          token_address: string
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string | null
          entry_price?: number | null
          error_message?: string | null
          exit_price?: number | null
          id?: string
          position_id?: string | null
          price: number
          profit_loss_percentage?: number | null
          signature?: string | null
          status?: string | null
          token_address: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string | null
          entry_price?: number | null
          error_message?: string | null
          exit_price?: number | null
          id?: string
          position_id?: string | null
          price?: number
          profit_loss_percentage?: number | null
          signature?: string | null
          status?: string | null
          token_address?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_history_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "active_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      safety_status: "safe" | "warning" | "danger" | "unknown"
      token_status:
        | "detected"
        | "analyzing"
        | "approved"
        | "rejected"
        | "trading"
        | "exited"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      safety_status: ["safe", "warning", "danger", "unknown"],
      token_status: [
        "detected",
        "analyzing",
        "approved",
        "rejected",
        "trading",
        "exited",
      ],
    },
  },
} as const
