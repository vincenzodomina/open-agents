export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          chat_id: string;
          created_at: string;
          id: string;
          parts: Json;
          role: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          id: string;
          parts: Json;
          role: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          id?: string;
          parts?: Json;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_reads: {
        Row: {
          chat_id: string;
          created_at: string;
          last_read_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          last_read_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          last_read_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_reads_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_reads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: {
          active_stream_id: string | null;
          created_at: string;
          id: string;
          last_assistant_message_at: string | null;
          model_id: string | null;
          session_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active_stream_id?: string | null;
          created_at?: string;
          id: string;
          last_assistant_message_at?: string | null;
          model_id?: string | null;
          session_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active_stream_id?: string | null;
          created_at?: string;
          id?: string;
          last_assistant_message_at?: string | null;
          model_id?: string | null;
          session_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          global_skill_refs: Json;
          hibernate_after: string | null;
          id: string;
          last_activity_at: string | null;
          lifecycle_error: string | null;
          lifecycle_run_id: string | null;
          lifecycle_state: string | null;
          lifecycle_version: number;
          sandbox_expires_at: string | null;
          sandbox_state: Json | null;
          snapshot_created_at: string | null;
          snapshot_size_bytes: number | null;
          snapshot_url: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          global_skill_refs?: Json;
          hibernate_after?: string | null;
          id: string;
          last_activity_at?: string | null;
          lifecycle_error?: string | null;
          lifecycle_run_id?: string | null;
          lifecycle_state?: string | null;
          lifecycle_version?: number;
          sandbox_expires_at?: string | null;
          sandbox_state?: Json | null;
          snapshot_created_at?: string | null;
          snapshot_size_bytes?: number | null;
          snapshot_url?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          global_skill_refs?: Json;
          hibernate_after?: string | null;
          id?: string;
          last_activity_at?: string | null;
          lifecycle_error?: string | null;
          lifecycle_run_id?: string | null;
          lifecycle_state?: string | null;
          lifecycle_version?: number;
          sandbox_expires_at?: string | null;
          sandbox_state?: Json | null;
          snapshot_created_at?: string | null;
          snapshot_size_bytes?: number | null;
          snapshot_url?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          alert_sound_enabled: boolean;
          alerts_enabled: boolean;
          created_at: string;
          default_diff_mode: string | null;
          default_model_id: string | null;
          default_sandbox_type: string | null;
          default_subagent_model_id: string | null;
          enabled_model_ids: Json;
          id: string;
          model_variants: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_sound_enabled?: boolean;
          alerts_enabled?: boolean;
          created_at?: string;
          default_diff_mode?: string | null;
          default_model_id?: string | null;
          default_sandbox_type?: string | null;
          default_subagent_model_id?: string | null;
          enabled_model_ids?: Json;
          id: string;
          model_variants?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          alert_sound_enabled?: boolean;
          alerts_enabled?: boolean;
          created_at?: string;
          default_diff_mode?: string | null;
          default_model_id?: string | null;
          default_sandbox_type?: string | null;
          default_subagent_model_id?: string | null;
          enabled_model_ids?: Json;
          id?: string;
          model_variants?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          id: string;
          last_login_at: string;
          name: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id: string;
          last_login_at?: string;
          name?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          last_login_at?: string;
          name?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      workflow_run_steps: {
        Row: {
          created_at: string;
          duration_ms: number;
          finish_reason: string | null;
          finished_at: string;
          id: string;
          raw_finish_reason: string | null;
          started_at: string;
          step_number: number;
          workflow_run_id: string;
        };
        Insert: {
          created_at?: string;
          duration_ms: number;
          finish_reason?: string | null;
          finished_at: string;
          id: string;
          raw_finish_reason?: string | null;
          started_at: string;
          step_number: number;
          workflow_run_id: string;
        };
        Update: {
          created_at?: string;
          duration_ms?: number;
          finish_reason?: string | null;
          finished_at?: string;
          id?: string;
          raw_finish_reason?: string | null;
          started_at?: string;
          step_number?: number;
          workflow_run_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_run_steps_workflow_run_id_fkey";
            columns: ["workflow_run_id"];
            isOneToOne: false;
            referencedRelation: "workflow_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_runs: {
        Row: {
          chat_id: string;
          created_at: string;
          finished_at: string;
          id: string;
          model_id: string | null;
          session_id: string;
          started_at: string;
          status: string;
          total_duration_ms: number;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          finished_at: string;
          id: string;
          model_id?: string | null;
          session_id: string;
          started_at: string;
          status: string;
          total_duration_ms: number;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          finished_at?: string;
          id?: string;
          model_id?: string | null;
          session_id?: string;
          started_at?: string;
          status?: string;
          total_duration_ms?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_runs_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_runs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_runs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      count_user_messages_by_user_id: {
        Args: { p_user_id: string };
        Returns: number;
      };
      create_session_with_initial_chat: {
        Args: { p_initial_chat: Json; p_session: Json };
        Returns: Json;
      };
      delete_chat_message_and_following: {
        Args: { p_chat_id: string; p_message_id: string };
        Returns: Json;
      };
      fork_chat_apply: {
        Args: { p_forked_chat: Json; p_messages: Json; p_user_id: string };
        Returns: Json;
      };
      get_chat_summaries_for_session: {
        Args: { p_session_id: string; p_user_id: string };
        Returns: Json;
      };
      get_sessions_with_unread: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_status: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      record_workflow_run: {
        Args: { p_run: Json; p_steps: Json };
        Returns: undefined;
      };
      upsert_chat_message_scoped: { Args: { p_msg: Json }; Returns: Json };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
