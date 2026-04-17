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
      accounts: {
        Row: {
          access_token: string;
          created_at: string;
          expires_at: string | null;
          external_user_id: string;
          id: string;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          updated_at: string;
          user_id: string;
          username: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          expires_at?: string | null;
          external_user_id: string;
          id: string;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id: string;
          username: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          expires_at?: string | null;
          external_user_id?: string;
          id?: string;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
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
      github_installations: {
        Row: {
          account_login: string;
          account_type: string;
          created_at: string;
          id: string;
          installation_id: number;
          installation_url: string | null;
          repository_selection: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_login: string;
          account_type: string;
          created_at?: string;
          id: string;
          installation_id: number;
          installation_url?: string | null;
          repository_selection: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_login?: string;
          account_type?: string;
          created_at?: string;
          id?: string;
          installation_id?: number;
          installation_url?: string | null;
          repository_selection?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "github_installations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      linked_accounts: {
        Row: {
          created_at: string;
          external_id: string;
          id: string;
          metadata: Json | null;
          provider: string;
          updated_at: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          external_id: string;
          id: string;
          metadata?: Json | null;
          provider: string;
          updated_at?: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          external_id?: string;
          id?: string;
          metadata?: Json | null;
          provider?: string;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "linked_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          auto_commit_push_override: boolean | null;
          auto_create_pr_override: boolean | null;
          branch: string | null;
          cached_diff: Json | null;
          cached_diff_updated_at: string | null;
          clone_url: string | null;
          created_at: string;
          global_skill_refs: Json;
          hibernate_after: string | null;
          id: string;
          is_new_branch: boolean;
          last_activity_at: string | null;
          lifecycle_error: string | null;
          lifecycle_run_id: string | null;
          lifecycle_state: string | null;
          lifecycle_version: number;
          lines_added: number | null;
          lines_removed: number | null;
          pr_number: number | null;
          pr_status: string | null;
          repo_name: string | null;
          repo_owner: string | null;
          sandbox_expires_at: string | null;
          sandbox_state: Json | null;
          snapshot_created_at: string | null;
          snapshot_size_bytes: number | null;
          snapshot_url: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          vercel_project_id: string | null;
          vercel_project_name: string | null;
          vercel_team_id: string | null;
          vercel_team_slug: string | null;
        };
        Insert: {
          auto_commit_push_override?: boolean | null;
          auto_create_pr_override?: boolean | null;
          branch?: string | null;
          cached_diff?: Json | null;
          cached_diff_updated_at?: string | null;
          clone_url?: string | null;
          created_at?: string;
          global_skill_refs?: Json;
          hibernate_after?: string | null;
          id: string;
          is_new_branch?: boolean;
          last_activity_at?: string | null;
          lifecycle_error?: string | null;
          lifecycle_run_id?: string | null;
          lifecycle_state?: string | null;
          lifecycle_version?: number;
          lines_added?: number | null;
          lines_removed?: number | null;
          pr_number?: number | null;
          pr_status?: string | null;
          repo_name?: string | null;
          repo_owner?: string | null;
          sandbox_expires_at?: string | null;
          sandbox_state?: Json | null;
          snapshot_created_at?: string | null;
          snapshot_size_bytes?: number | null;
          snapshot_url?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          vercel_project_id?: string | null;
          vercel_project_name?: string | null;
          vercel_team_id?: string | null;
          vercel_team_slug?: string | null;
        };
        Update: {
          auto_commit_push_override?: boolean | null;
          auto_create_pr_override?: boolean | null;
          branch?: string | null;
          cached_diff?: Json | null;
          cached_diff_updated_at?: string | null;
          clone_url?: string | null;
          created_at?: string;
          global_skill_refs?: Json;
          hibernate_after?: string | null;
          id?: string;
          is_new_branch?: boolean;
          last_activity_at?: string | null;
          lifecycle_error?: string | null;
          lifecycle_run_id?: string | null;
          lifecycle_state?: string | null;
          lifecycle_version?: number;
          lines_added?: number | null;
          lines_removed?: number | null;
          pr_number?: number | null;
          pr_status?: string | null;
          repo_name?: string | null;
          repo_owner?: string | null;
          sandbox_expires_at?: string | null;
          sandbox_state?: Json | null;
          snapshot_created_at?: string | null;
          snapshot_size_bytes?: number | null;
          snapshot_url?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          vercel_project_id?: string | null;
          vercel_project_name?: string | null;
          vercel_team_id?: string | null;
          vercel_team_slug?: string | null;
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
      shares: {
        Row: {
          chat_id: string;
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shares_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_events: {
        Row: {
          agent_type: string;
          cached_input_tokens: number;
          created_at: string;
          id: string;
          input_tokens: number;
          model_id: string | null;
          output_tokens: number;
          provider: string | null;
          source: string;
          tool_call_count: number;
          user_id: string;
        };
        Insert: {
          agent_type?: string;
          cached_input_tokens?: number;
          created_at?: string;
          id: string;
          input_tokens?: number;
          model_id?: string | null;
          output_tokens?: number;
          provider?: string | null;
          source?: string;
          tool_call_count?: number;
          user_id: string;
        };
        Update: {
          agent_type?: string;
          cached_input_tokens?: number;
          created_at?: string;
          id?: string;
          input_tokens?: number;
          model_id?: string | null;
          output_tokens?: number;
          provider?: string | null;
          source?: string;
          tool_call_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_events_user_id_fkey";
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
          auto_commit_push: boolean;
          auto_create_pr: boolean;
          created_at: string;
          default_diff_mode: string | null;
          default_model_id: string | null;
          default_sandbox_type: string | null;
          default_subagent_model_id: string | null;
          enabled_model_ids: Json;
          global_skill_refs: Json;
          id: string;
          model_variants: Json;
          public_usage_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_sound_enabled?: boolean;
          alerts_enabled?: boolean;
          auto_commit_push?: boolean;
          auto_create_pr?: boolean;
          created_at?: string;
          default_diff_mode?: string | null;
          default_model_id?: string | null;
          default_sandbox_type?: string | null;
          default_subagent_model_id?: string | null;
          enabled_model_ids?: Json;
          global_skill_refs?: Json;
          id: string;
          model_variants?: Json;
          public_usage_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          alert_sound_enabled?: boolean;
          alerts_enabled?: boolean;
          auto_commit_push?: boolean;
          auto_create_pr?: boolean;
          created_at?: string;
          default_diff_mode?: string | null;
          default_model_id?: string | null;
          default_sandbox_type?: string | null;
          default_subagent_model_id?: string | null;
          enabled_model_ids?: Json;
          global_skill_refs?: Json;
          id?: string;
          model_variants?: Json;
          public_usage_enabled?: boolean;
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
          access_token: string;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          external_id: string;
          id: string;
          last_login_at: string;
          name: string | null;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          token_expires_at: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          access_token: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          external_id: string;
          id: string;
          last_login_at?: string;
          name?: string | null;
          provider: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          access_token?: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          external_id?: string;
          id?: string;
          last_login_at?: string;
          name?: string | null;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      vercel_project_links: {
        Row: {
          created_at: string;
          project_id: string;
          project_name: string;
          repo_name: string;
          repo_owner: string;
          team_id: string | null;
          team_slug: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          project_id: string;
          project_name: string;
          repo_name: string;
          repo_owner: string;
          team_id?: string | null;
          team_slug?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          project_id?: string;
          project_name?: string;
          repo_name?: string;
          repo_owner?: string;
          team_id?: string | null;
          team_slug?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vercel_project_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
      find_public_usage_user_candidates: {
        Args: { p_username_normalized: string };
        Returns: Json;
      };
      find_sessions_by_repo_pr: {
        Args: {
          p_pr_number: number;
          p_repo_name: string;
          p_repo_owner: string;
        };
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
      get_usage_history_rows: {
        Args: {
          p_all_time: boolean;
          p_days: number;
          p_range_from: string;
          p_range_to: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_usage_insights_bundle: {
        Args: {
          p_all_time: boolean;
          p_days: number;
          p_range_from: string;
          p_range_to: string;
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
