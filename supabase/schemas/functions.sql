SET
    search_path=public;
-- ---------------------------------------------------------------------------
-- count_user_messages_by_user_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_user_messages_by_user_id (p_user_id text) RETURNS integer LANGUAGE sql SECURITY INVOKER
SET
    search_path=public STABLE AS $$
  SELECT COUNT(*)::integer
  FROM chat_messages cm
  INNER JOIN chats c ON c.id = cm.chat_id
  INNER JOIN sessions s ON s.id = c.session_id
  WHERE s.user_id = p_user_id
    AND cm.role = 'user';
$$;
-- ---------------------------------------------------------------------------
-- create_session_with_initial_chat
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_session_with_initial_chat (p_session jsonb, p_initial_chat jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
    search_path=public AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- record_workflow_run (atomic insert run + steps)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_workflow_run (p_run jsonb, p_steps jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET
    search_path=public AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- upsert_chat_message_scoped
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_chat_message_scoped (p_msg jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
    search_path=public AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- delete_chat_message_and_following
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_chat_message_and_following (p_chat_id text, p_message_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
    search_path=public AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- fork_chat_apply — TS supplies pre-built message rows (parts cloned in app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fork_chat_apply (p_user_id text, p_forked_chat jsonb, p_messages jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
    search_path=public AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- get_sessions_with_unread
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_sessions_with_unread (p_user_id text, p_status text, p_limit int DEFAULT NULL, p_offset int DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER
SET
    search_path=public STABLE AS $$
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
$$;
-- ---------------------------------------------------------------------------
-- get_chat_summaries_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_chat_summaries_for_session (p_session_id text, p_user_id text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER
SET
    search_path=public STABLE AS $$
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
$$;
GRANT
EXECUTE ON FUNCTION public.count_user_messages_by_user_id (text) TO service_role;
GRANT
EXECUTE ON FUNCTION public.create_session_with_initial_chat (jsonb, jsonb) TO service_role;
GRANT
EXECUTE ON FUNCTION public.record_workflow_run (jsonb, jsonb) TO service_role;
GRANT
EXECUTE ON FUNCTION public.upsert_chat_message_scoped (jsonb) TO service_role;
GRANT
EXECUTE ON FUNCTION public.delete_chat_message_and_following (text, text) TO service_role;
GRANT
EXECUTE ON FUNCTION public.fork_chat_apply (text, jsonb, jsonb) TO service_role;
GRANT
EXECUTE ON FUNCTION public.get_sessions_with_unread (text, text, int, int) TO service_role;
GRANT
EXECUTE ON FUNCTION public.get_chat_summaries_for_session (text, text) TO service_role;
