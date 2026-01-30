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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      conversation_metrics: {
        Row: {
          id: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          organization_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          organization_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          organization_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fallback_requests: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          organization_id: string
          query: string
          response: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          organization_id: string
          query: string
          response: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          organization_id?: string
          query?: string
          response?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fallback_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          isAsk: boolean
          name: string
          type: string
          voiceflow_api_key: string | null
          voiceflow_project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          isAsk?: boolean
          name: string
          type?: string
          voiceflow_api_key?: string | null
          voiceflow_project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          isAsk?: boolean
          name?: string
          type?: string
          voiceflow_api_key?: string | null
          voiceflow_project_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      statistics_preferences: {
        Row: {
          chart_type: Database["public"]["Enums"]["chart_type"]
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          chart_type: Database["public"]["Enums"]["chart_type"]
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          chart_type?: Database["public"]["Enums"]["chart_type"]
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "statistics_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tab_permissions: {
        Row: {
          created_at: string | null
          id: string
          tab_name: Database["public"]["Enums"]["tab_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tab_name: Database["public"]["Enums"]["tab_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tab_name?: Database["public"]["Enums"]["tab_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tab_permissions_user_id_fkey"
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
      can_administer_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      create_organization_member: {
        Args: {
          organization_id: string
          user_email: string
          user_name: string
          user_password: string
        }
        Returns: string
      }
      delete_user: { Args: { user_id: string }; Returns: undefined }
      initialize_statistics_preferences: {
        Args: { org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      chart_type:
        | "total_messages"
        | "total_sessions"
        | "total_conversations"
        | "escalated_count"
        | "thumbs_up"
        | "thumbs_down"
        | "success_metrics"
        | "users_over_time"
        | "sessions_over_time"
        | "messages_over_time"
        | "topics"
        | "feedback_pie"
        | "success_vs_fallback"
        | "savings_time"
        | "savings_money"
      custom_tab_icon: "default"
      metric_type:
        | "happy_face"
        | "neutral_face"
        | "sad_face"
        | "escalated_to_human"
        | "successful_answer"
        | "thumbs_up"
        | "thumbs_down"
      statistics_section:
        | "summary"
        | "detailed_analysis"
        | "question_handling"
        | "savings"
      tab_type:
        | "organizations"
        | "conversations"
        | "knowledge"
        | "statistics"
        | "home"
        | "administrator"
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
      chart_type: [
        "total_messages",
        "total_sessions",
        "total_conversations",
        "escalated_count",
        "thumbs_up",
        "thumbs_down",
        "success_metrics",
        "users_over_time",
        "sessions_over_time",
        "messages_over_time",
        "topics",
        "feedback_pie",
        "success_vs_fallback",
        "savings_time",
        "savings_money",
      ],
      custom_tab_icon: ["default"],
      metric_type: [
        "happy_face",
        "neutral_face",
        "sad_face",
        "escalated_to_human",
        "successful_answer",
        "thumbs_up",
        "thumbs_down",
      ],
      statistics_section: [
        "summary",
        "detailed_analysis",
        "question_handling",
        "savings",
      ],
      tab_type: [
        "organizations",
        "conversations",
        "knowledge",
        "statistics",
        "home",
        "administrator",
      ],
    },
  },
} as const
