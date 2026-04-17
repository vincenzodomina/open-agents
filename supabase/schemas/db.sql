


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "provider" "text" DEFAULT 'github'::"text" NOT NULL,
    "external_user_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "expires_at" timestamp without time zone,
    "scope" "text",
    "username" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "text" NOT NULL,
    "chat_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "parts" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_reads" (
    "user_id" "text" NOT NULL,
    "chat_id" "text" NOT NULL,
    "last_read_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "model_id" "text" DEFAULT 'anthropic/claude-haiku-4.5'::"text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "active_stream_id" "text",
    "last_assistant_message_at" timestamp without time zone
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_installations" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "installation_id" integer NOT NULL,
    "account_login" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "repository_selection" "text" NOT NULL,
    "installation_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."github_installations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."linked_accounts" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "workspace_id" "text",
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."linked_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "repo_owner" "text",
    "repo_name" "text",
    "branch" "text",
    "clone_url" "text",
    "is_new_branch" boolean DEFAULT false NOT NULL,
    "sandbox_state" "jsonb",
    "lines_added" integer DEFAULT 0,
    "lines_removed" integer DEFAULT 0,
    "pr_number" integer,
    "pr_status" "text",
    "snapshot_url" "text",
    "snapshot_created_at" timestamp without time zone,
    "snapshot_size_bytes" integer,
    "cached_diff" "jsonb",
    "cached_diff_updated_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "lifecycle_state" "text",
    "lifecycle_version" integer DEFAULT 0 NOT NULL,
    "last_activity_at" timestamp without time zone,
    "sandbox_expires_at" timestamp without time zone,
    "hibernate_after" timestamp without time zone,
    "lifecycle_run_id" "text",
    "lifecycle_error" "text",
    "auto_commit_push_override" boolean,
    "vercel_project_id" "text",
    "vercel_project_name" "text",
    "vercel_team_id" "text",
    "vercel_team_slug" "text",
    "auto_create_pr_override" boolean,
    "global_skill_refs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shares" (
    "id" "text" NOT NULL,
    "chat_id" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_events" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "source" "text" DEFAULT 'web'::"text" NOT NULL,
    "agent_type" "text" DEFAULT 'main'::"text" NOT NULL,
    "provider" "text",
    "model_id" "text",
    "input_tokens" integer DEFAULT 0 NOT NULL,
    "cached_input_tokens" integer DEFAULT 0 NOT NULL,
    "output_tokens" integer DEFAULT 0 NOT NULL,
    "tool_call_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "default_model_id" "text" DEFAULT 'anthropic/claude-haiku-4.5'::"text",
    "default_sandbox_type" "text" DEFAULT 'vercel'::"text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "default_subagent_model_id" "text",
    "model_variants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "auto_commit_push" boolean DEFAULT false NOT NULL,
    "default_diff_mode" "text" DEFAULT 'unified'::"text",
    "auto_create_pr" boolean DEFAULT false NOT NULL,
    "global_skill_refs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "enabled_model_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "alerts_enabled" boolean DEFAULT true NOT NULL,
    "alert_sound_enabled" boolean DEFAULT true NOT NULL,
    "public_usage_enabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "scope" "text",
    "username" "text" NOT NULL,
    "email" "text",
    "name" "text",
    "avatar_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "last_login_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "token_expires_at" timestamp without time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vercel_project_links" (
    "user_id" "text" NOT NULL,
    "repo_owner" "text" NOT NULL,
    "repo_name" "text" NOT NULL,
    "project_id" "text" NOT NULL,
    "project_name" "text" NOT NULL,
    "team_id" "text",
    "team_slug" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vercel_project_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_run_steps" (
    "id" "text" NOT NULL,
    "workflow_run_id" "text" NOT NULL,
    "step_number" integer NOT NULL,
    "started_at" timestamp without time zone NOT NULL,
    "finished_at" timestamp without time zone NOT NULL,
    "duration_ms" integer NOT NULL,
    "finish_reason" "text",
    "raw_finish_reason" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_run_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_runs" (
    "id" "text" NOT NULL,
    "chat_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "model_id" "text",
    "status" "text" NOT NULL,
    "started_at" timestamp without time zone NOT NULL,
    "finished_at" timestamp without time zone NOT NULL,
    "total_duration_ms" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_runs" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_reads"
    ADD CONSTRAINT "chat_reads_user_id_chat_id_pk" PRIMARY KEY ("user_id", "chat_id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_installations"
    ADD CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."linked_accounts"
    ADD CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vercel_project_links"
    ADD CONSTRAINT "vercel_project_links_user_id_repo_owner_repo_name_pk" PRIMARY KEY ("user_id", "repo_owner", "repo_name");



ALTER TABLE ONLY "public"."workflow_run_steps"
    ADD CONSTRAINT "workflow_run_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "accounts_user_id_provider_idx" ON "public"."accounts" USING "btree" ("user_id", "provider");



CREATE INDEX "chat_reads_chat_id_idx" ON "public"."chat_reads" USING "btree" ("chat_id");



CREATE INDEX "chats_session_id_idx" ON "public"."chats" USING "btree" ("session_id");



CREATE UNIQUE INDEX "github_installations_user_account_idx" ON "public"."github_installations" USING "btree" ("user_id", "account_login");



CREATE UNIQUE INDEX "github_installations_user_installation_idx" ON "public"."github_installations" USING "btree" ("user_id", "installation_id");



CREATE UNIQUE INDEX "linked_accounts_provider_external_workspace_idx" ON "public"."linked_accounts" USING "btree" ("provider", "external_id", "workspace_id");



CREATE INDEX "sessions_user_id_idx" ON "public"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "shares_chat_id_idx" ON "public"."shares" USING "btree" ("chat_id");



CREATE UNIQUE INDEX "users_provider_external_id_idx" ON "public"."users" USING "btree" ("provider", "external_id");



CREATE INDEX "workflow_run_steps_run_id_idx" ON "public"."workflow_run_steps" USING "btree" ("workflow_run_id");



CREATE UNIQUE INDEX "workflow_run_steps_run_step_idx" ON "public"."workflow_run_steps" USING "btree" ("workflow_run_id", "step_number");



CREATE INDEX "workflow_runs_chat_id_idx" ON "public"."workflow_runs" USING "btree" ("chat_id");



CREATE INDEX "workflow_runs_session_id_idx" ON "public"."workflow_runs" USING "btree" ("session_id");



CREATE INDEX "workflow_runs_user_id_idx" ON "public"."workflow_runs" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_reads"
    ADD CONSTRAINT "chat_reads_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_reads"
    ADD CONSTRAINT "chat_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."github_installations"
    ADD CONSTRAINT "github_installations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."linked_accounts"
    ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shares"
    ADD CONSTRAINT "shares_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vercel_project_links"
    ADD CONSTRAINT "vercel_project_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_run_steps"
    ADD CONSTRAINT "workflow_run_steps_workflow_run_id_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_reads" TO "anon";
GRANT ALL ON TABLE "public"."chat_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_reads" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."github_installations" TO "anon";
GRANT ALL ON TABLE "public"."github_installations" TO "authenticated";
GRANT ALL ON TABLE "public"."github_installations" TO "service_role";



GRANT ALL ON TABLE "public"."linked_accounts" TO "anon";
GRANT ALL ON TABLE "public"."linked_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."linked_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."shares" TO "anon";
GRANT ALL ON TABLE "public"."shares" TO "authenticated";
GRANT ALL ON TABLE "public"."shares" TO "service_role";



GRANT ALL ON TABLE "public"."usage_events" TO "anon";
GRANT ALL ON TABLE "public"."usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vercel_project_links" TO "anon";
GRANT ALL ON TABLE "public"."vercel_project_links" TO "authenticated";
GRANT ALL ON TABLE "public"."vercel_project_links" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_run_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_run_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_run_steps" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_runs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_runs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































