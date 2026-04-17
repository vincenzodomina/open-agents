CREATE TABLE IF NOT EXISTS users (
    id text NOT NULL PRIMARY KEY,
    provider text NOT NULL,
    external_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    scope text,
    username text NOT NULL,
    email text,
    name text,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    token_expires_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_external_id_idx ON users (provider, external_id);
CREATE TABLE IF NOT EXISTS accounts (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider text DEFAULT 'github'::text NOT NULL,
    external_user_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp without time zone,
    scope text,
    username text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_id_provider_idx ON accounts (user_id, provider);
CREATE TABLE IF NOT EXISTS github_installations (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    installation_id integer NOT NULL,
    account_login text NOT NULL,
    account_type text NOT NULL,
    repository_selection text NOT NULL,
    installation_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE github_installations ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS github_installations_user_installation_idx ON github_installations (user_id, installation_id);
CREATE UNIQUE INDEX IF NOT EXISTS github_installations_user_account_idx ON github_installations (user_id, account_login);
CREATE TABLE IF NOT EXISTS vercel_project_links (
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    repo_owner text NOT NULL,
    repo_name text NOT NULL,
    project_id text NOT NULL,
    project_name text NOT NULL,
    team_id text,
    team_slug text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, repo_owner, repo_name)
);
ALTER TABLE vercel_project_links ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS sessions (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title text NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    repo_owner text,
    repo_name text,
    branch text,
    clone_url text,
    vercel_project_id text,
    vercel_project_name text,
    vercel_team_id text,
    vercel_team_slug text,
    is_new_branch boolean DEFAULT false NOT NULL,
    auto_commit_push_override boolean,
    auto_create_pr_override boolean,
    global_skill_refs jsonb DEFAULT '[]'::jsonb NOT NULL,
    sandbox_state jsonb,
    lifecycle_state text,
    lifecycle_version integer DEFAULT 0 NOT NULL,
    last_activity_at timestamp without time zone,
    sandbox_expires_at timestamp without time zone,
    hibernate_after timestamp without time zone,
    lifecycle_run_id text,
    lifecycle_error text,
    lines_added integer DEFAULT 0,
    lines_removed integer DEFAULT 0,
    pr_number integer,
    pr_status text,
    snapshot_url text,
    snapshot_created_at timestamp without time zone,
    snapshot_size_bytes integer,
    cached_diff jsonb,
    cached_diff_updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE TABLE IF NOT EXISTS linked_accounts (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider text NOT NULL,
    external_id text NOT NULL,
    workspace_id text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS linked_accounts_provider_external_workspace_idx ON linked_accounts (provider, external_id, workspace_id);
CREATE TABLE IF NOT EXISTS user_preferences (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    default_model_id text DEFAULT 'anthropic/claude-haiku-4.5'::text,
    default_subagent_model_id text,
    default_sandbox_type text DEFAULT 'vercel'::text,
    default_diff_mode text DEFAULT 'unified'::text,
    auto_commit_push boolean DEFAULT false NOT NULL,
    auto_create_pr boolean DEFAULT false NOT NULL,
    alerts_enabled boolean DEFAULT true NOT NULL,
    alert_sound_enabled boolean DEFAULT true NOT NULL,
    public_usage_enabled boolean DEFAULT false NOT NULL,
    global_skill_refs jsonb DEFAULT '[]'::jsonb NOT NULL,
    model_variants jsonb DEFAULT '[]'::jsonb NOT NULL,
    enabled_model_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS usage_events (
    id text NOT NULL PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    source text DEFAULT 'web'::text NOT NULL,
    agent_type text DEFAULT 'main'::text NOT NULL,
    provider text,
    model_id text,
    input_tokens integer DEFAULT 0 NOT NULL,
    cached_input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    tool_call_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS chats (
    id text NOT NULL PRIMARY KEY,
    session_id text NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    title text NOT NULL,
    model_id text DEFAULT 'anthropic/claude-haiku-4.5'::text,
    active_stream_id text,
    last_assistant_message_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS chats_session_id_idx ON chats (session_id);
CREATE TABLE IF NOT EXISTS chat_messages (
    id text NOT NULL PRIMARY KEY,
    chat_id text NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    role text NOT NULL,
    parts jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS chat_reads (
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    chat_id text NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    last_read_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, chat_id)
);
ALTER TABLE chat_reads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS chat_reads_chat_id_idx ON chat_reads (chat_id);
CREATE TABLE IF NOT EXISTS shares (
    id text NOT NULL PRIMARY KEY,
    chat_id text NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS shares_chat_id_idx ON shares (chat_id);
CREATE TABLE IF NOT EXISTS workflow_runs (
    id text NOT NULL PRIMARY KEY,
    chat_id text NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    session_id text NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    model_id text,
    status text NOT NULL,
    started_at timestamp without time zone NOT NULL,
    finished_at timestamp without time zone NOT NULL,
    total_duration_ms integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS workflow_runs_chat_id_idx ON workflow_runs (chat_id);
CREATE INDEX IF NOT EXISTS workflow_runs_session_id_idx ON workflow_runs (session_id);
CREATE INDEX IF NOT EXISTS workflow_runs_user_id_idx ON workflow_runs (user_id);
CREATE TABLE IF NOT EXISTS workflow_run_steps (
    id text NOT NULL PRIMARY KEY,
    workflow_run_id text NOT NULL REFERENCES workflow_runs (id) ON DELETE CASCADE,
    step_number integer NOT NULL,
    started_at timestamp without time zone NOT NULL,
    finished_at timestamp without time zone NOT NULL,
    duration_ms integer NOT NULL,
    finish_reason text,
    raw_finish_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS workflow_run_steps_run_id_idx ON workflow_run_steps (workflow_run_id);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_run_steps_run_step_idx ON workflow_run_steps (workflow_run_id, step_number);
