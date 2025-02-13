export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chats: {
        Row: {
          ai_cost: number
          chat_id: string
          created_at: string
          credits_used: number
          is_deleted: boolean
          model: string
          previous_conversation: Json
          provider: string
          title: string
          total_tokens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_cost?: number
          chat_id?: string
          created_at?: string
          credits_used?: number
          is_deleted?: boolean
          model: string
          previous_conversation?: Json
          provider: string
          title: string
          total_tokens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_cost?: number
          chat_id?: string
          created_at?: string
          credits_used?: number
          is_deleted?: boolean
          model?: string
          previous_conversation?: Json
          provider?: string
          title?: string
          total_tokens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_cost: number
          chat_id: string
          conversation_id: string
          created_at: string
          credits_used: number
          edited_conversation_id: string | null
          is_edited: boolean
          tokens_consumed: number | null
        }
        Insert: {
          ai_cost?: number
          chat_id: string
          conversation_id?: string
          created_at?: string
          credits_used: number
          edited_conversation_id?: string | null
          is_edited?: boolean
          tokens_consumed?: number | null
        }
        Update: {
          ai_cost?: number
          chat_id?: string
          conversation_id?: string
          created_at?: string
          credits_used?: number
          edited_conversation_id?: string | null
          is_edited?: boolean
          tokens_consumed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chat_id_fkey1"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "fk_edited_conversation"
            columns: ["edited_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["conversation_id"]
          },
        ]
      }
      error_logs: {
        Row: {
          error_message: string
          id: number
          jwt_token: string
          parameters: Json
          path: string
          timestamp: string
          user_id: string
        }
        Insert: {
          error_message: string
          id?: number
          jwt_token: string
          parameters: Json
          path: string
          timestamp?: string
          user_id: string
        }
        Update: {
          error_message?: string
          id?: number
          jwt_token?: string
          parameters?: Json
          path?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          conversation_id: string
          created_at: string
          message: string
          message_id: string
          sender_role: string
        }
        Insert: {
          chat_id: string
          conversation_id: string
          created_at?: string
          message: string
          message_id?: string
          sender_role: string
        }
        Update: {
          chat_id?: string
          conversation_id?: string
          created_at?: string
          message?: string
          message_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["conversation_id"]
          },
        ]
      }
      user_chat_credits: {
        Row: {
          credits: number
          user_id: string
        }
        Insert: {
          credits?: number
          user_id: string
        }
        Update: {
          credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chat_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          first_name: string | null
          last_login: number | null
          last_name: string | null
          photo_url: string | null
          registered_on: number
          user_id: string
          username: string
        }
        Insert: {
          first_name?: string | null
          last_login?: number | null
          last_name?: string | null
          photo_url?: string | null
          registered_on: number
          user_id: string
          username: string
        }
        Update: {
          first_name?: string | null
          last_login?: number | null
          last_name?: string | null
          photo_url?: string | null
          registered_on?: number
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      continue_chat: {
        Args: {
          p_chat_id: string
          p_user_message: string
          p_assistant_message: string
          p_credits_used: number
          p_ai_cost: number
          p_tokens_consumed: number
        }
        Returns: {
          inserted_conversation_id: string
        }[]
      }
      edit_chat: {
        Args: {
          p_conversation_id: string
          p_user_message: string
          p_assistant_message: string
          p_credits_used: number
          p_ai_cost: number
          p_tokens_consumed: number
        }
        Returns: {
          new_conversation_id: string
        }[]
      }
      fetch_conversation_messages: {
        Args: {
          p_user_id: string
          p_chat_id: string
          p_message_limit: number
          p_before_timestamp: string
        }
        Returns: {
          conversation_id: string
          conversation_created_at: string
          model: string
          provider: string
          message_data: Json
        }[]
      }
      fetch_previous_messages_for_edit: {
        Args: {
          p_chat_id: string
          p_excluded_conversation_id: string
        }
        Returns: {
          p_conversation_id: string
          p_messages: Json
        }[]
      }
      regenerate_assistant_message: {
        Args: {
          p_conversation_id: string
          p_assistant_message: string
          p_ai_cost: number
          p_credits_used: number
          p_tokens_consumed: number
        }
        Returns: undefined
      }
      start_chat: {
        Args: {
          p_user_id: string
          p_title: string
          p_credits_used: number
          p_ai_cost: number
          p_user_message: string
          p_assistant_message: string
          p_model: string
          p_provider: string
          p_tokens_consumed: number
        }
        Returns: {
          inserted_chat_id: string
          inserted_conversation_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
