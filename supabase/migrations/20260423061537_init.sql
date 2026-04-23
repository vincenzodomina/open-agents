
  create table "public"."chat_messages" (
    "id" text not null,
    "chat_id" text not null,
    "role" text not null,
    "parts" jsonb not null,
    "created_at" timestamp without time zone not null default now()
      );


alter table "public"."chat_messages" enable row level security;


  create table "public"."chat_reads" (
    "user_id" text not null,
    "chat_id" text not null,
    "last_read_at" timestamp without time zone not null default now(),
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );


alter table "public"."chat_reads" enable row level security;


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


alter table "public"."chats" enable row level security;


  create table "public"."sessions" (
    "id" text not null,
    "user_id" text not null,
    "title" text not null,
    "status" text not null default 'running'::text,
    "global_skill_refs" jsonb not null default '[]'::jsonb,
    "sandbox_state" jsonb,
    "lifecycle_state" text,
    "lifecycle_version" integer not null default 0,
    "last_activity_at" timestamp without time zone,
    "sandbox_expires_at" timestamp without time zone,
    "hibernate_after" timestamp without time zone,
    "lifecycle_run_id" text,
    "lifecycle_error" text,
    "snapshot_url" text,
    "snapshot_created_at" timestamp without time zone,
    "snapshot_size_bytes" integer,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );


alter table "public"."sessions" enable row level security;


  create table "public"."user_preferences" (
    "id" text not null,
    "user_id" text not null,
    "default_model_id" text default 'anthropic/claude-haiku-4.5'::text,
    "default_subagent_model_id" text,
    "default_sandbox_type" text default 'just-bash'::text,
    "default_diff_mode" text default 'unified'::text,
    "alerts_enabled" boolean not null default true,
    "alert_sound_enabled" boolean not null default true,
    "model_variants" jsonb not null default '[]'::jsonb,
    "enabled_model_ids" jsonb not null default '[]'::jsonb,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."users" (
    "id" text not null,
    "username" text not null,
    "email" text,
    "name" text,
    "avatar_url" text,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now(),
    "last_login_at" timestamp without time zone not null default now()
      );


alter table "public"."users" enable row level security;


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


alter table "public"."workflow_run_steps" enable row level security;


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


alter table "public"."workflow_runs" enable row level security;

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE INDEX chat_reads_chat_id_idx ON public.chat_reads USING btree (chat_id);

CREATE UNIQUE INDEX chat_reads_pkey ON public.chat_reads USING btree (user_id, chat_id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE INDEX chats_session_id_idx ON public.chats USING btree (session_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX workflow_run_steps_pkey ON public.workflow_run_steps USING btree (id);

CREATE INDEX workflow_run_steps_run_id_idx ON public.workflow_run_steps USING btree (workflow_run_id);

CREATE UNIQUE INDEX workflow_run_steps_run_step_idx ON public.workflow_run_steps USING btree (workflow_run_id, step_number);

CREATE INDEX workflow_runs_chat_id_idx ON public.workflow_runs USING btree (chat_id);

CREATE UNIQUE INDEX workflow_runs_pkey ON public.workflow_runs USING btree (id);

CREATE INDEX workflow_runs_session_id_idx ON public.workflow_runs USING btree (session_id);

CREATE INDEX workflow_runs_user_id_idx ON public.workflow_runs USING btree (user_id);

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_reads" add constraint "chat_reads_pkey" PRIMARY KEY using index "chat_reads_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."workflow_run_steps" add constraint "workflow_run_steps_pkey" PRIMARY KEY using index "workflow_run_steps_pkey";

alter table "public"."workflow_runs" add constraint "workflow_runs_pkey" PRIMARY KEY using index "workflow_runs_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_chat_id_fkey";

alter table "public"."chat_reads" add constraint "chat_reads_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_reads" validate constraint "chat_reads_chat_id_fkey";

alter table "public"."chat_reads" add constraint "chat_reads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_reads" validate constraint "chat_reads_user_id_fkey";

alter table "public"."chats" add constraint "chats_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_session_id_fkey";

alter table "public"."sessions" add constraint "sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

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


