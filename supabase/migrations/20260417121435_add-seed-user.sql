
  create table "public"."accounts" (
    "id" text not null,
    "user_id" text not null,
    "provider" text not null default 'github'::text,
    "external_user_id" text not null,
    "access_token" text not null,
    "refresh_token" text,
    "expires_at" timestamp without time zone,
    "scope" text,
    "username" text not null,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."chat_messages" (
    "id" text not null,
    "chat_id" text not null,
    "role" text not null,
    "parts" jsonb not null,
    "created_at" timestamp without time zone not null default now()
      );



  create table "public"."chat_reads" (
    "user_id" text not null,
    "chat_id" text not null,
    "last_read_at" timestamp without time zone not null default now(),
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."chats" (
    "id" text not null,
    "session_id" text not null,
    "title" text not null,
    "model_id" text default 'anthropic/claude-haiku-4.5'::text,
    "active_stream_id" text,
    "last_assistant_message_at" timestamp without time zone,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."github_installations" (
    "id" text not null,
    "user_id" text not null,
    "installation_id" integer not null,
    "account_login" text not null,
    "account_type" text not null,
    "repository_selection" text not null,
    "installation_url" text,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."linked_accounts" (
    "id" text not null,
    "user_id" text not null,
    "provider" text not null,
    "external_id" text not null,
    "workspace_id" text,
    "metadata" jsonb,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."sessions" (
    "id" text not null,
    "user_id" text not null,
    "title" text not null,
    "status" text not null default 'running'::text,
    "repo_owner" text,
    "repo_name" text,
    "branch" text,
    "clone_url" text,
    "vercel_project_id" text,
    "vercel_project_name" text,
    "vercel_team_id" text,
    "vercel_team_slug" text,
    "is_new_branch" boolean not null default false,
    "auto_commit_push_override" boolean,
    "auto_create_pr_override" boolean,
    "global_skill_refs" jsonb not null default '[]'::jsonb,
    "sandbox_state" jsonb,
    "lifecycle_state" text,
    "lifecycle_version" integer not null default 0,
    "last_activity_at" timestamp without time zone,
    "sandbox_expires_at" timestamp without time zone,
    "hibernate_after" timestamp without time zone,
    "lifecycle_run_id" text,
    "lifecycle_error" text,
    "lines_added" integer default 0,
    "lines_removed" integer default 0,
    "pr_number" integer,
    "pr_status" text,
    "snapshot_url" text,
    "snapshot_created_at" timestamp without time zone,
    "snapshot_size_bytes" integer,
    "cached_diff" jsonb,
    "cached_diff_updated_at" timestamp without time zone,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."shares" (
    "id" text not null,
    "chat_id" text not null,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."usage_events" (
    "id" text not null,
    "user_id" text not null,
    "source" text not null default 'web'::text,
    "agent_type" text not null default 'main'::text,
    "provider" text,
    "model_id" text,
    "input_tokens" integer not null default 0,
    "cached_input_tokens" integer not null default 0,
    "output_tokens" integer not null default 0,
    "tool_call_count" integer not null default 0,
    "created_at" timestamp without time zone not null default now()
      );



  create table "public"."user_preferences" (
    "id" text not null,
    "user_id" text not null,
    "default_model_id" text default 'anthropic/claude-haiku-4.5'::text,
    "default_subagent_model_id" text,
    "default_sandbox_type" text default 'vercel'::text,
    "default_diff_mode" text default 'unified'::text,
    "auto_commit_push" boolean not null default false,
    "auto_create_pr" boolean not null default false,
    "alerts_enabled" boolean not null default true,
    "alert_sound_enabled" boolean not null default true,
    "public_usage_enabled" boolean not null default false,
    "global_skill_refs" jsonb not null default '[]'::jsonb,
    "model_variants" jsonb not null default '[]'::jsonb,
    "enabled_model_ids" jsonb not null default '[]'::jsonb,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."users" (
    "id" text not null,
    "provider" text not null,
    "external_id" text not null,
    "access_token" text not null,
    "refresh_token" text,
    "scope" text,
    "username" text not null,
    "email" text,
    "name" text,
    "avatar_url" text,
    "created_at" timestamp without time zone not null default now(),
    "token_expires_at" timestamp without time zone,
    "updated_at" timestamp without time zone not null default now(),
    "last_login_at" timestamp without time zone not null default now()
      );



  create table "public"."vercel_project_links" (
    "user_id" text not null,
    "repo_owner" text not null,
    "repo_name" text not null,
    "project_id" text not null,
    "project_name" text not null,
    "team_id" text,
    "team_slug" text,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );



  create table "public"."workflow_run_steps" (
    "id" text not null,
    "workflow_run_id" text not null,
    "step_number" integer not null,
    "started_at" timestamp without time zone not null,
    "finished_at" timestamp without time zone not null,
    "duration_ms" integer not null,
    "finish_reason" text,
    "raw_finish_reason" text,
    "created_at" timestamp without time zone not null default now()
      );



  create table "public"."workflow_runs" (
    "id" text not null,
    "chat_id" text not null,
    "session_id" text not null,
    "user_id" text not null,
    "model_id" text,
    "status" text not null,
    "started_at" timestamp without time zone not null,
    "finished_at" timestamp without time zone not null,
    "total_duration_ms" integer not null,
    "created_at" timestamp without time zone not null default now()
      );


CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX accounts_user_id_provider_idx ON public.accounts USING btree (user_id, provider);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE INDEX chat_reads_chat_id_idx ON public.chat_reads USING btree (chat_id);

CREATE UNIQUE INDEX chat_reads_pkey ON public.chat_reads USING btree (user_id, chat_id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE INDEX chats_session_id_idx ON public.chats USING btree (session_id);

CREATE UNIQUE INDEX github_installations_pkey ON public.github_installations USING btree (id);

CREATE UNIQUE INDEX github_installations_user_account_idx ON public.github_installations USING btree (user_id, account_login);

CREATE UNIQUE INDEX github_installations_user_installation_idx ON public.github_installations USING btree (user_id, installation_id);

CREATE UNIQUE INDEX linked_accounts_pkey ON public.linked_accounts USING btree (id);

CREATE UNIQUE INDEX linked_accounts_provider_external_workspace_idx ON public.linked_accounts USING btree (provider, external_id, workspace_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);

CREATE UNIQUE INDEX shares_chat_id_idx ON public.shares USING btree (chat_id);

CREATE UNIQUE INDEX shares_pkey ON public.shares USING btree (id);

CREATE UNIQUE INDEX usage_events_pkey ON public.usage_events USING btree (id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX users_provider_external_id_idx ON public.users USING btree (provider, external_id);

CREATE UNIQUE INDEX vercel_project_links_pkey ON public.vercel_project_links USING btree (user_id, repo_owner, repo_name);

CREATE UNIQUE INDEX workflow_run_steps_pkey ON public.workflow_run_steps USING btree (id);

CREATE INDEX workflow_run_steps_run_id_idx ON public.workflow_run_steps USING btree (workflow_run_id);

CREATE UNIQUE INDEX workflow_run_steps_run_step_idx ON public.workflow_run_steps USING btree (workflow_run_id, step_number);

CREATE INDEX workflow_runs_chat_id_idx ON public.workflow_runs USING btree (chat_id);

CREATE UNIQUE INDEX workflow_runs_pkey ON public.workflow_runs USING btree (id);

CREATE INDEX workflow_runs_session_id_idx ON public.workflow_runs USING btree (session_id);

CREATE INDEX workflow_runs_user_id_idx ON public.workflow_runs USING btree (user_id);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_reads" add constraint "chat_reads_pkey" PRIMARY KEY using index "chat_reads_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."github_installations" add constraint "github_installations_pkey" PRIMARY KEY using index "github_installations_pkey";

alter table "public"."linked_accounts" add constraint "linked_accounts_pkey" PRIMARY KEY using index "linked_accounts_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."shares" add constraint "shares_pkey" PRIMARY KEY using index "shares_pkey";

alter table "public"."usage_events" add constraint "usage_events_pkey" PRIMARY KEY using index "usage_events_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vercel_project_links" add constraint "vercel_project_links_pkey" PRIMARY KEY using index "vercel_project_links_pkey";

alter table "public"."workflow_run_steps" add constraint "workflow_run_steps_pkey" PRIMARY KEY using index "workflow_run_steps_pkey";

alter table "public"."workflow_runs" add constraint "workflow_runs_pkey" PRIMARY KEY using index "workflow_runs_pkey";

alter table "public"."accounts" add constraint "accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_user_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_chat_id_fkey";

alter table "public"."chat_reads" add constraint "chat_reads_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_reads" validate constraint "chat_reads_chat_id_fkey";

alter table "public"."chat_reads" add constraint "chat_reads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_reads" validate constraint "chat_reads_user_id_fkey";

alter table "public"."chats" add constraint "chats_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_session_id_fkey";

alter table "public"."github_installations" add constraint "github_installations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."github_installations" validate constraint "github_installations_user_id_fkey";

alter table "public"."linked_accounts" add constraint "linked_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."linked_accounts" validate constraint "linked_accounts_user_id_fkey";

alter table "public"."sessions" add constraint "sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_user_id_fkey";

alter table "public"."shares" add constraint "shares_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."shares" validate constraint "shares_chat_id_fkey";

alter table "public"."usage_events" add constraint "usage_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."usage_events" validate constraint "usage_events_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."vercel_project_links" add constraint "vercel_project_links_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."vercel_project_links" validate constraint "vercel_project_links_user_id_fkey";

alter table "public"."workflow_run_steps" add constraint "workflow_run_steps_workflow_run_id_fkey" FOREIGN KEY (workflow_run_id) REFERENCES public.workflow_runs(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_run_steps" validate constraint "workflow_run_steps_workflow_run_id_fkey";

alter table "public"."workflow_runs" add constraint "workflow_runs_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_runs" validate constraint "workflow_runs_chat_id_fkey";

alter table "public"."workflow_runs" add constraint "workflow_runs_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_runs" validate constraint "workflow_runs_session_id_fkey";

alter table "public"."workflow_runs" add constraint "workflow_runs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_runs" validate constraint "workflow_runs_user_id_fkey";

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chat_reads" to "anon";

grant insert on table "public"."chat_reads" to "anon";

grant references on table "public"."chat_reads" to "anon";

grant select on table "public"."chat_reads" to "anon";

grant trigger on table "public"."chat_reads" to "anon";

grant truncate on table "public"."chat_reads" to "anon";

grant update on table "public"."chat_reads" to "anon";

grant delete on table "public"."chat_reads" to "authenticated";

grant insert on table "public"."chat_reads" to "authenticated";

grant references on table "public"."chat_reads" to "authenticated";

grant select on table "public"."chat_reads" to "authenticated";

grant trigger on table "public"."chat_reads" to "authenticated";

grant truncate on table "public"."chat_reads" to "authenticated";

grant update on table "public"."chat_reads" to "authenticated";

grant delete on table "public"."chat_reads" to "service_role";

grant insert on table "public"."chat_reads" to "service_role";

grant references on table "public"."chat_reads" to "service_role";

grant select on table "public"."chat_reads" to "service_role";

grant trigger on table "public"."chat_reads" to "service_role";

grant truncate on table "public"."chat_reads" to "service_role";

grant update on table "public"."chat_reads" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."github_installations" to "anon";

grant insert on table "public"."github_installations" to "anon";

grant references on table "public"."github_installations" to "anon";

grant select on table "public"."github_installations" to "anon";

grant trigger on table "public"."github_installations" to "anon";

grant truncate on table "public"."github_installations" to "anon";

grant update on table "public"."github_installations" to "anon";

grant delete on table "public"."github_installations" to "authenticated";

grant insert on table "public"."github_installations" to "authenticated";

grant references on table "public"."github_installations" to "authenticated";

grant select on table "public"."github_installations" to "authenticated";

grant trigger on table "public"."github_installations" to "authenticated";

grant truncate on table "public"."github_installations" to "authenticated";

grant update on table "public"."github_installations" to "authenticated";

grant delete on table "public"."github_installations" to "service_role";

grant insert on table "public"."github_installations" to "service_role";

grant references on table "public"."github_installations" to "service_role";

grant select on table "public"."github_installations" to "service_role";

grant trigger on table "public"."github_installations" to "service_role";

grant truncate on table "public"."github_installations" to "service_role";

grant update on table "public"."github_installations" to "service_role";

grant delete on table "public"."linked_accounts" to "anon";

grant insert on table "public"."linked_accounts" to "anon";

grant references on table "public"."linked_accounts" to "anon";

grant select on table "public"."linked_accounts" to "anon";

grant trigger on table "public"."linked_accounts" to "anon";

grant truncate on table "public"."linked_accounts" to "anon";

grant update on table "public"."linked_accounts" to "anon";

grant delete on table "public"."linked_accounts" to "authenticated";

grant insert on table "public"."linked_accounts" to "authenticated";

grant references on table "public"."linked_accounts" to "authenticated";

grant select on table "public"."linked_accounts" to "authenticated";

grant trigger on table "public"."linked_accounts" to "authenticated";

grant truncate on table "public"."linked_accounts" to "authenticated";

grant update on table "public"."linked_accounts" to "authenticated";

grant delete on table "public"."linked_accounts" to "service_role";

grant insert on table "public"."linked_accounts" to "service_role";

grant references on table "public"."linked_accounts" to "service_role";

grant select on table "public"."linked_accounts" to "service_role";

grant trigger on table "public"."linked_accounts" to "service_role";

grant truncate on table "public"."linked_accounts" to "service_role";

grant update on table "public"."linked_accounts" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

grant delete on table "public"."shares" to "anon";

grant insert on table "public"."shares" to "anon";

grant references on table "public"."shares" to "anon";

grant select on table "public"."shares" to "anon";

grant trigger on table "public"."shares" to "anon";

grant truncate on table "public"."shares" to "anon";

grant update on table "public"."shares" to "anon";

grant delete on table "public"."shares" to "authenticated";

grant insert on table "public"."shares" to "authenticated";

grant references on table "public"."shares" to "authenticated";

grant select on table "public"."shares" to "authenticated";

grant trigger on table "public"."shares" to "authenticated";

grant truncate on table "public"."shares" to "authenticated";

grant update on table "public"."shares" to "authenticated";

grant delete on table "public"."shares" to "service_role";

grant insert on table "public"."shares" to "service_role";

grant references on table "public"."shares" to "service_role";

grant select on table "public"."shares" to "service_role";

grant trigger on table "public"."shares" to "service_role";

grant truncate on table "public"."shares" to "service_role";

grant update on table "public"."shares" to "service_role";

grant delete on table "public"."usage_events" to "anon";

grant insert on table "public"."usage_events" to "anon";

grant references on table "public"."usage_events" to "anon";

grant select on table "public"."usage_events" to "anon";

grant trigger on table "public"."usage_events" to "anon";

grant truncate on table "public"."usage_events" to "anon";

grant update on table "public"."usage_events" to "anon";

grant delete on table "public"."usage_events" to "authenticated";

grant insert on table "public"."usage_events" to "authenticated";

grant references on table "public"."usage_events" to "authenticated";

grant select on table "public"."usage_events" to "authenticated";

grant trigger on table "public"."usage_events" to "authenticated";

grant truncate on table "public"."usage_events" to "authenticated";

grant update on table "public"."usage_events" to "authenticated";

grant delete on table "public"."usage_events" to "service_role";

grant insert on table "public"."usage_events" to "service_role";

grant references on table "public"."usage_events" to "service_role";

grant select on table "public"."usage_events" to "service_role";

grant trigger on table "public"."usage_events" to "service_role";

grant truncate on table "public"."usage_events" to "service_role";

grant update on table "public"."usage_events" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vercel_project_links" to "anon";

grant insert on table "public"."vercel_project_links" to "anon";

grant references on table "public"."vercel_project_links" to "anon";

grant select on table "public"."vercel_project_links" to "anon";

grant trigger on table "public"."vercel_project_links" to "anon";

grant truncate on table "public"."vercel_project_links" to "anon";

grant update on table "public"."vercel_project_links" to "anon";

grant delete on table "public"."vercel_project_links" to "authenticated";

grant insert on table "public"."vercel_project_links" to "authenticated";

grant references on table "public"."vercel_project_links" to "authenticated";

grant select on table "public"."vercel_project_links" to "authenticated";

grant trigger on table "public"."vercel_project_links" to "authenticated";

grant truncate on table "public"."vercel_project_links" to "authenticated";

grant update on table "public"."vercel_project_links" to "authenticated";

grant delete on table "public"."vercel_project_links" to "service_role";

grant insert on table "public"."vercel_project_links" to "service_role";

grant references on table "public"."vercel_project_links" to "service_role";

grant select on table "public"."vercel_project_links" to "service_role";

grant trigger on table "public"."vercel_project_links" to "service_role";

grant truncate on table "public"."vercel_project_links" to "service_role";

grant update on table "public"."vercel_project_links" to "service_role";

grant delete on table "public"."workflow_run_steps" to "anon";

grant insert on table "public"."workflow_run_steps" to "anon";

grant references on table "public"."workflow_run_steps" to "anon";

grant select on table "public"."workflow_run_steps" to "anon";

grant trigger on table "public"."workflow_run_steps" to "anon";

grant truncate on table "public"."workflow_run_steps" to "anon";

grant update on table "public"."workflow_run_steps" to "anon";

grant delete on table "public"."workflow_run_steps" to "authenticated";

grant insert on table "public"."workflow_run_steps" to "authenticated";

grant references on table "public"."workflow_run_steps" to "authenticated";

grant select on table "public"."workflow_run_steps" to "authenticated";

grant trigger on table "public"."workflow_run_steps" to "authenticated";

grant truncate on table "public"."workflow_run_steps" to "authenticated";

grant update on table "public"."workflow_run_steps" to "authenticated";

grant delete on table "public"."workflow_run_steps" to "service_role";

grant insert on table "public"."workflow_run_steps" to "service_role";

grant references on table "public"."workflow_run_steps" to "service_role";

grant select on table "public"."workflow_run_steps" to "service_role";

grant trigger on table "public"."workflow_run_steps" to "service_role";

grant truncate on table "public"."workflow_run_steps" to "service_role";

grant update on table "public"."workflow_run_steps" to "service_role";

grant delete on table "public"."workflow_runs" to "anon";

grant insert on table "public"."workflow_runs" to "anon";

grant references on table "public"."workflow_runs" to "anon";

grant select on table "public"."workflow_runs" to "anon";

grant trigger on table "public"."workflow_runs" to "anon";

grant truncate on table "public"."workflow_runs" to "anon";

grant update on table "public"."workflow_runs" to "anon";

grant delete on table "public"."workflow_runs" to "authenticated";

grant insert on table "public"."workflow_runs" to "authenticated";

grant references on table "public"."workflow_runs" to "authenticated";

grant select on table "public"."workflow_runs" to "authenticated";

grant trigger on table "public"."workflow_runs" to "authenticated";

grant truncate on table "public"."workflow_runs" to "authenticated";

grant update on table "public"."workflow_runs" to "authenticated";

grant delete on table "public"."workflow_runs" to "service_role";

grant insert on table "public"."workflow_runs" to "service_role";

grant references on table "public"."workflow_runs" to "service_role";

grant select on table "public"."workflow_runs" to "service_role";

grant trigger on table "public"."workflow_runs" to "service_role";

grant truncate on table "public"."workflow_runs" to "service_role";

grant update on table "public"."workflow_runs" to "service_role";


