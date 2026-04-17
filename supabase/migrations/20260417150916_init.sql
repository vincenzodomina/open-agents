
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

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.count_user_messages_by_user_id(p_user_id text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM chat_messages cm
  INNER JOIN chats c ON c.id = cm.chat_id
  INNER JOIN sessions s ON s.id = c.session_id
  WHERE s.user_id = p_user_id
    AND cm.role = 'user';
$function$
;

CREATE OR REPLACE FUNCTION public.create_session_with_initial_chat(p_session jsonb, p_initial_chat jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sess sessions%ROWTYPE;
  v_chat chats%ROWTYPE;
BEGIN
  INSERT INTO sessions
  SELECT *
  FROM jsonb_populate_record(NULL::sessions, p_session)
  RETURNING * INTO v_sess;

  INSERT INTO chats (
    id,
    session_id,
    title,
    model_id,
    active_stream_id,
    last_assistant_message_at,
    created_at,
    updated_at
  )
  VALUES (
    (p_initial_chat->>'id')::text,
    v_sess.id,
    (p_initial_chat->>'title')::text,
    COALESCE((p_initial_chat->>'model_id')::text, 'anthropic/claude-haiku-4.5'),
    NULL,
    NULL,
    COALESCE((p_initial_chat->>'created_at')::timestamptz, now()),
    COALESCE((p_initial_chat->>'updated_at')::timestamptz, now())
  )
  RETURNING * INTO v_chat;

  RETURN jsonb_build_object(
    'session', to_jsonb(v_sess),
    'chat', to_jsonb(v_chat)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_chat_message_and_following(p_chat_id text, p_message_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ordered_ids text[];
  roles text[];
  start_ix int;
  i int;
  target_role text;
  ids_to_delete text[];
  latest_assistant timestamptz;
BEGIN
  SELECT array_agg(id ORDER BY created_at, id),
         array_agg(role ORDER BY created_at, id)
  INTO ordered_ids, roles
  FROM chat_messages
  WHERE chat_id = p_chat_id;

  IF ordered_ids IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  start_ix := array_position(ordered_ids, p_message_id);
  IF start_ix IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  target_role := roles[start_ix];
  IF target_role IS DISTINCT FROM 'user' THEN
    RETURN jsonb_build_object('status', 'not_user_message');
  END IF;

  ids_to_delete := ordered_ids[start_ix:array_length(ordered_ids, 1)];

  DELETE FROM chat_messages
  WHERE chat_id = p_chat_id
    AND id = ANY(ids_to_delete);

  SELECT cm.created_at INTO latest_assistant
  FROM chat_messages cm
  WHERE cm.chat_id = p_chat_id
    AND cm.role = 'assistant'
  ORDER BY cm.created_at DESC, cm.id DESC
  LIMIT 1;

  UPDATE chats
  SET
    last_assistant_message_at = latest_assistant,
    updated_at = now()
  WHERE id = p_chat_id;

  RETURN jsonb_build_object(
    'status', 'deleted',
    'deleted_message_ids', to_jsonb(ids_to_delete)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_public_usage_user_candidates(p_username_normalized text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sub.id,
        'username', sub.username,
        'name', sub.name,
        'avatarUrl', sub.avatar_url,
        'lastLoginAt', sub.last_login_at,
        'publicUsageEnabled', sub.public_usage_enabled
      )
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT u.id, u.username, u.name, u.avatar_url, u.last_login_at, up.public_usage_enabled
    FROM users u
    LEFT JOIN user_preferences up ON up.user_id = u.id
    WHERE lower(u.username) = p_username_normalized
    ORDER BY u.last_login_at DESC NULLS LAST, u.id
    LIMIT 10
  ) sub;
$function$
;

CREATE OR REPLACE FUNCTION public.find_sessions_by_repo_pr(p_repo_owner text, p_repo_name text, p_pr_number integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(s)),
    '[]'::jsonb
  )
  FROM sessions s
  WHERE lower(s.repo_owner) = lower(p_repo_owner)
    AND lower(s.repo_name) = lower(p_repo_name)
    AND s.pr_number = p_pr_number;
$function$
;

CREATE OR REPLACE FUNCTION public.fork_chat_apply(p_user_id text, p_forked_chat jsonb, p_messages jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_chat chats%ROWTYPE;
  elem jsonb;
  v_now timestamptz := now();
BEGIN
  INSERT INTO chats (
    id,
    session_id,
    title,
    model_id,
    active_stream_id,
    last_assistant_message_at,
    created_at,
    updated_at
  )
  VALUES (
    (p_forked_chat->>'id')::text,
    (p_forked_chat->>'session_id')::text,
    (p_forked_chat->>'title')::text,
    COALESCE((p_forked_chat->>'model_id')::text, 'anthropic/claude-haiku-4.5'),
    NULL,
    NULLIF(p_forked_chat->>'last_assistant_message_at', '')::timestamptz,
    COALESCE((p_forked_chat->>'created_at')::timestamptz, v_now),
    COALESCE((p_forked_chat->>'updated_at')::timestamptz, v_now)
  )
  RETURNING * INTO v_chat;

  FOR elem IN SELECT jsonb_array_elements(p_messages)
  LOOP
    INSERT INTO chat_messages (id, chat_id, role, parts, created_at)
    VALUES (
      (elem->>'id')::text,
      v_chat.id,
      (elem->>'role')::text,
      elem->'parts',
      (elem->>'created_at')::timestamptz
    );
  END LOOP;

  INSERT INTO chat_reads (user_id, chat_id, last_read_at, created_at, updated_at)
  VALUES (p_user_id, v_chat.id, v_now, v_now, v_now)
  ON CONFLICT (user_id, chat_id) DO UPDATE
  SET
    last_read_at = EXCLUDED.last_read_at,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('chat', to_jsonb(v_chat));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_chat_summaries_for_session(p_session_id text, p_user_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'sessionId', c.session_id,
        'title', c.title,
        'modelId', c.model_id,
        'activeStreamId', c.active_stream_id,
        'lastAssistantMessageAt', c.last_assistant_message_at,
        'createdAt', c.created_at,
        'updatedAt', c.updated_at,
        'hasUnread',
          CASE
            WHEN c.last_assistant_message_at IS NULL THEN false
            WHEN cr.last_read_at IS NULL THEN true
            WHEN c.last_assistant_message_at > cr.last_read_at THEN true
            ELSE false
          END,
        'isStreaming', c.active_stream_id IS NOT NULL
      )
      ORDER BY c.created_at
    ),
    '[]'::jsonb
  )
  FROM chats c
  LEFT JOIN chat_reads cr ON cr.chat_id = c.id AND cr.user_id = p_user_id
  WHERE c.session_id = p_session_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sessions_with_unread(p_user_id text, p_status text, p_limit integer DEFAULT NULL::integer, p_offset integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      s.id,
      s.title,
      s.status,
      s.repo_owner AS "repoOwner",
      s.repo_name AS "repoName",
      s.branch,
      s.lines_added AS "linesAdded",
      s.lines_removed AS "linesRemoved",
      s.pr_number AS "prNumber",
      s.pr_status AS "prStatus",
      s.created_at AS "createdAt",
      COALESCE(MAX(c.updated_at), s.created_at) AS "lastActivityAt",
      COALESCE(BOOL_OR(
        CASE
          WHEN c.last_assistant_message_at IS NULL THEN false
          WHEN cr.last_read_at IS NULL THEN true
          WHEN c.last_assistant_message_at > cr.last_read_at THEN true
          ELSE false
        END
      ), false) AS "hasUnread",
      COALESCE(BOOL_OR(c.active_stream_id IS NOT NULL), false) AS "hasStreaming",
      (
        ARRAY_AGG(c.id ORDER BY c.updated_at DESC, c.created_at DESC)
        FILTER (WHERE c.id IS NOT NULL)
      )[1] AS "latestChatId"
    FROM sessions s
    LEFT JOIN chats c ON c.session_id = s.id
    LEFT JOIN chat_reads cr ON cr.chat_id = c.id AND cr.user_id = p_user_id
    WHERE s.user_id = p_user_id
      AND (
        p_status IS NULL
        OR p_status = 'all'
        OR (p_status = 'active' AND s.status <> 'archived')
        OR (p_status = 'archived' AND s.status = 'archived')
      )
    GROUP BY s.id
  )
  SELECT COALESCE(
    jsonb_agg(row_to_json(base)::jsonb ORDER BY base."createdAt" DESC),
    '[]'::jsonb
  )
  FROM (
    SELECT * FROM base
    ORDER BY "createdAt" DESC
    LIMIT COALESCE(p_limit, 2147483647)
    OFFSET COALESCE(p_offset, 0)
  ) AS base;
$function$
;

CREATE OR REPLACE FUNCTION public.get_usage_domain_leaderboard_rows(p_domain text, p_range_from date, p_range_to date, p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz;
  v_rows jsonb;
BEGIN
  v_since := now() - make_interval(days => COALESCE(p_days, 280));

  IF p_range_from IS NOT NULL AND p_range_to IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(row_to_json(t)::jsonb),
      '[]'::jsonb
    )
    INTO v_rows
    FROM (
      SELECT
        u.id AS "userId",
        u.email,
        u.username,
        u.name,
        u.avatar_url AS "avatarUrl",
        ue.model_id AS "modelId",
        COALESCE(SUM(ue.input_tokens), 0)::double precision AS "totalInputTokens",
        COALESCE(SUM(ue.output_tokens), 0)::double precision AS "totalOutputTokens"
      FROM usage_events ue
      INNER JOIN users u ON u.id = ue.user_id
      WHERE u.email IS NOT NULL
        AND lower(split_part(u.email, '@', 2)) = p_domain
        AND date(ue.created_at) >= p_range_from
        AND date(ue.created_at) <= p_range_to
      GROUP BY u.id, u.email, u.username, u.name, u.avatar_url, ue.model_id
    ) t;
    RETURN v_rows;
  END IF;

  SELECT COALESCE(
    jsonb_agg(row_to_json(t)::jsonb),
    '[]'::jsonb
  )
  INTO v_rows
  FROM (
    SELECT
      u.id AS "userId",
      u.email,
      u.username,
      u.name,
      u.avatar_url AS "avatarUrl",
      ue.model_id AS "modelId",
      COALESCE(SUM(ue.input_tokens), 0)::double precision AS "totalInputTokens",
      COALESCE(SUM(ue.output_tokens), 0)::double precision AS "totalOutputTokens"
    FROM usage_events ue
    INNER JOIN users u ON u.id = ue.user_id
    WHERE u.email IS NOT NULL
      AND lower(split_part(u.email, '@', 2)) = p_domain
      AND ue.created_at >= v_since
    GROUP BY u.id, u.email, u.username, u.name, u.avatar_url, ue.model_id
  ) t;

  RETURN v_rows;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_usage_history_rows(p_user_id text, p_range_from date, p_range_to date, p_all_time boolean, p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz;
  v_rows jsonb;
BEGIN
  IF p_all_time THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT
        date(ue.created_at)::text AS date,
        ue.source,
        ue.agent_type AS "agentType",
        ue.provider,
        ue.model_id AS "modelId",
        COALESCE(SUM(ue.input_tokens), 0)::double precision AS "inputTokens",
        COALESCE(SUM(ue.cached_input_tokens), 0)::double precision AS "cachedInputTokens",
        COALESCE(SUM(ue.output_tokens), 0)::double precision AS "outputTokens",
        COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0)::double precision AS "messageCount",
        COALESCE(SUM(ue.tool_call_count), 0)::double precision AS "toolCallCount"
      FROM usage_events ue
      WHERE ue.user_id = p_user_id
      GROUP BY date(ue.created_at), ue.source, ue.agent_type, ue.provider, ue.model_id
    ) t;
    RETURN v_rows;
  END IF;

  IF p_range_from IS NOT NULL AND p_range_to IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT
        date(ue.created_at)::text AS date,
        ue.source,
        ue.agent_type AS "agentType",
        ue.provider,
        ue.model_id AS "modelId",
        COALESCE(SUM(ue.input_tokens), 0)::double precision AS "inputTokens",
        COALESCE(SUM(ue.cached_input_tokens), 0)::double precision AS "cachedInputTokens",
        COALESCE(SUM(ue.output_tokens), 0)::double precision AS "outputTokens",
        COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0)::double precision AS "messageCount",
        COALESCE(SUM(ue.tool_call_count), 0)::double precision AS "toolCallCount"
      FROM usage_events ue
      WHERE ue.user_id = p_user_id
        AND date(ue.created_at) >= p_range_from
        AND date(ue.created_at) <= p_range_to
      GROUP BY date(ue.created_at), ue.source, ue.agent_type, ue.provider, ue.model_id
    ) t;
    RETURN v_rows;
  END IF;

  v_since := now() - make_interval(days => COALESCE(p_days, 280));

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      date(ue.created_at)::text AS date,
      ue.source,
      ue.agent_type AS "agentType",
      ue.provider,
      ue.model_id AS "modelId",
      COALESCE(SUM(ue.input_tokens), 0)::double precision AS "inputTokens",
      COALESCE(SUM(ue.cached_input_tokens), 0)::double precision AS "cachedInputTokens",
      COALESCE(SUM(ue.output_tokens), 0)::double precision AS "outputTokens",
      COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0)::double precision AS "messageCount",
      COALESCE(SUM(ue.tool_call_count), 0)::double precision AS "toolCallCount"
    FROM usage_events ue
    WHERE ue.user_id = p_user_id
      AND ue.created_at >= v_since
    GROUP BY date(ue.created_at), ue.source, ue.agent_type, ue.provider, ue.model_id
  ) t;

  RETURN v_rows;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_usage_insights_bundle(p_user_id text, p_range_from date, p_range_to date, p_all_time boolean, p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz;
  v_agg jsonb;
  v_sessions jsonb;
BEGIN
  IF p_all_time THEN
    SELECT jsonb_build_object(
      'totalInputTokens', COALESCE(SUM(ue.input_tokens), 0),
      'totalCachedInputTokens', COALESCE(SUM(ue.cached_input_tokens), 0),
      'totalOutputTokens', COALESCE(SUM(ue.output_tokens), 0),
      'totalToolCallCount', COALESCE(SUM(ue.tool_call_count), 0),
      'mainInputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.input_tokens ELSE 0 END), 0),
      'mainOutputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.output_tokens ELSE 0 END), 0),
      'mainAssistantTurnCount', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0),
      'largestMainTurnTokens', COALESCE(MAX(
        CASE WHEN ue.agent_type = 'main'
          THEN ue.input_tokens::bigint + ue.output_tokens::bigint
          ELSE NULL
        END
      ), 0)
    )
    INTO v_agg
    FROM usage_events ue
    WHERE ue.user_id = p_user_id;

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'repoOwner', s.repo_owner,
          'repoName', s.repo_name,
          'prNumber', s.pr_number,
          'prStatus', s.pr_status,
          'linesAdded', s.lines_added,
          'linesRemoved', s.lines_removed,
          'updatedAt', s.updated_at
        )
      ),
      '[]'::jsonb
    )
    INTO v_sessions
    FROM sessions s
    WHERE s.user_id = p_user_id;

    RETURN jsonb_build_object('aggregate', v_agg, 'sessions', v_sessions);
  END IF;

  IF p_range_from IS NOT NULL AND p_range_to IS NOT NULL THEN
    SELECT jsonb_build_object(
      'totalInputTokens', COALESCE(SUM(ue.input_tokens), 0),
      'totalCachedInputTokens', COALESCE(SUM(ue.cached_input_tokens), 0),
      'totalOutputTokens', COALESCE(SUM(ue.output_tokens), 0),
      'totalToolCallCount', COALESCE(SUM(ue.tool_call_count), 0),
      'mainInputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.input_tokens ELSE 0 END), 0),
      'mainOutputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.output_tokens ELSE 0 END), 0),
      'mainAssistantTurnCount', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0),
      'largestMainTurnTokens', COALESCE(MAX(
        CASE WHEN ue.agent_type = 'main'
          THEN ue.input_tokens::bigint + ue.output_tokens::bigint
          ELSE NULL
        END
      ), 0)
    )
    INTO v_agg
    FROM usage_events ue
    WHERE ue.user_id = p_user_id
      AND date(ue.created_at) >= p_range_from
      AND date(ue.created_at) <= p_range_to;

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'repoOwner', s.repo_owner,
          'repoName', s.repo_name,
          'prNumber', s.pr_number,
          'prStatus', s.pr_status,
          'linesAdded', s.lines_added,
          'linesRemoved', s.lines_removed,
          'updatedAt', s.updated_at
        )
      ),
      '[]'::jsonb
    )
    INTO v_sessions
    FROM sessions s
    WHERE s.user_id = p_user_id
      AND date(s.updated_at) >= p_range_from
      AND date(s.updated_at) <= p_range_to;

    RETURN jsonb_build_object('aggregate', v_agg, 'sessions', v_sessions);
  END IF;

  v_since := now() - make_interval(days => COALESCE(p_days, 280));

  SELECT jsonb_build_object(
    'totalInputTokens', COALESCE(SUM(ue.input_tokens), 0),
    'totalCachedInputTokens', COALESCE(SUM(ue.cached_input_tokens), 0),
    'totalOutputTokens', COALESCE(SUM(ue.output_tokens), 0),
    'totalToolCallCount', COALESCE(SUM(ue.tool_call_count), 0),
    'mainInputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.input_tokens ELSE 0 END), 0),
    'mainOutputTokens', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN ue.output_tokens ELSE 0 END), 0),
    'mainAssistantTurnCount', COALESCE(SUM(CASE WHEN ue.agent_type = 'main' THEN 1 ELSE 0 END), 0),
    'largestMainTurnTokens', COALESCE(MAX(
      CASE WHEN ue.agent_type = 'main'
        THEN ue.input_tokens::bigint + ue.output_tokens::bigint
        ELSE NULL
      END
    ), 0)
  )
  INTO v_agg
  FROM usage_events ue
  WHERE ue.user_id = p_user_id
    AND ue.created_at >= v_since;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'repoOwner', s.repo_owner,
        'repoName', s.repo_name,
        'prNumber', s.pr_number,
        'prStatus', s.pr_status,
        'linesAdded', s.lines_added,
        'linesRemoved', s.lines_removed,
        'updatedAt', s.updated_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_sessions
  FROM sessions s
  WHERE s.user_id = p_user_id
    AND s.updated_at >= v_since;

  RETURN jsonb_build_object('aggregate', v_agg, 'sessions', v_sessions);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_workflow_run(p_run jsonb, p_steps jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  elem jsonb;
BEGIN
  INSERT INTO workflow_runs (
    id,
    chat_id,
    session_id,
    user_id,
    model_id,
    status,
    started_at,
    finished_at,
    total_duration_ms,
    created_at
  )
  VALUES (
    (p_run->>'id')::text,
    (p_run->>'chat_id')::text,
    (p_run->>'session_id')::text,
    (p_run->>'user_id')::text,
    NULLIF(p_run->>'model_id', '')::text,
    (p_run->>'status')::text,
    (p_run->>'started_at')::timestamptz,
    (p_run->>'finished_at')::timestamptz,
    (p_run->>'total_duration_ms')::int,
    COALESCE((p_run->>'created_at')::timestamptz, now())
  )
  ON CONFLICT (id) DO NOTHING;

  IF p_steps IS NULL OR jsonb_array_length(p_steps) = 0 THEN
    RETURN;
  END IF;

  FOR elem IN SELECT jsonb_array_elements(p_steps)
  LOOP
    INSERT INTO workflow_run_steps (
      id,
      workflow_run_id,
      step_number,
      started_at,
      finished_at,
      duration_ms,
      finish_reason,
      raw_finish_reason,
      created_at
    )
    VALUES (
      (elem->>'id')::text,
      (p_run->>'id')::text,
      (elem->>'step_number')::int,
      (elem->>'started_at')::timestamptz,
      (elem->>'finished_at')::timestamptz,
      (elem->>'duration_ms')::int,
      NULLIF(elem->>'finish_reason', '')::text,
      NULLIF(elem->>'raw_finish_reason', '')::text,
      COALESCE((elem->>'created_at')::timestamptz, now())
    )
    ON CONFLICT (workflow_run_id, step_number) DO NOTHING;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_chat_message_scoped(p_msg jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ins chat_messages%ROWTYPE;
  v_upd chat_messages%ROWTYPE;
BEGIN
  INSERT INTO chat_messages (id, chat_id, role, parts, created_at)
  VALUES (
    (p_msg->>'id')::text,
    (p_msg->>'chat_id')::text,
    (p_msg->>'role')::text,
    p_msg->'parts',
    COALESCE((p_msg->>'created_at')::timestamptz, now())
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO v_ins;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'inserted',
      'message', to_jsonb(v_ins)
    );
  END IF;

  UPDATE chat_messages
  SET parts = p_msg->'parts'
  WHERE id = (p_msg->>'id')::text
    AND chat_id = (p_msg->>'chat_id')::text
    AND role = (p_msg->>'role')::text
  RETURNING * INTO v_upd;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'updated',
      'message', to_jsonb(v_upd)
    );
  END IF;

  RETURN jsonb_build_object('status', 'conflict');
END;
$function$
;

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


