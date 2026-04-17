INSERT INTO
    "auth"."users" (
        "instance_id",
        "id",
        "aud",
        "role",
        "email",
        "encrypted_password",
        "email_confirmed_at",
        "invited_at",
        "confirmation_token",
        "confirmation_sent_at",
        "recovery_token",
        "recovery_sent_at",
        "email_change_token_new",
        "email_change",
        "email_change_sent_at",
        "last_sign_in_at",
        "raw_app_meta_data",
        "raw_user_meta_data",
        "is_super_admin",
        "created_at",
        "updated_at",
        "phone",
        "phone_confirmed_at",
        "phone_change",
        "phone_change_token",
        "phone_change_sent_at",
        "email_change_token_current",
        "email_change_confirm_status",
        "banned_until",
        "reauthentication_token",
        "reauthentication_sent_at",
        "is_sso_user",
        "deleted_at",
        "is_anonymous"
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        'eb50450e-5e8f-43cb-97b4-336f1cce420e',
        'authenticated',
        'authenticated',
        'demo@example.org',
        extensions.crypt ('demo', extensions.gen_salt ('bf')),
        current_timestamp,
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"email_verified": true}',
        NULL,
        current_timestamp,
        current_timestamp,
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    )
ON CONFLICT (id) DO NOTHING;
INSERT INTO
    "auth"."identities" (
        "provider_id",
        "user_id",
        "identity_data",
        "provider",
        "last_sign_in_at",
        "created_at",
        "updated_at",
        "id"
    )
VALUES
    (
        'demo@example.org',
        'eb50450e-5e8f-43cb-97b4-336f1cce420e',
        jsonb_build_object(
            'sub',
            'eb50450e-5e8f-43cb-97b4-336f1cce420e',
            'email',
            'demo@example.org',
            'email_verified',
            true,
            'phone_verified',
            true
        ),
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp,
        extensions.gen_random_uuid ()
    )
ON CONFLICT (id) DO NOTHING;
-- -- Ensure user_profile exists for the seeded auth user (FK target for agent.user_id)
-- INSERT INTO
--     "public"."user_profile" ("id", "email")
-- VALUES
--     ('eb50450e-5e8f-43cb-97b4-336f1cce420e', 'demo@example.org')
-- ON CONFLICT (id) DO NOTHING;
INSERT INTO
    public.users (
        id,
        provider,
        external_id,
        access_token,
        refresh_token,
        scope,
        username,
        email,
        name,
        avatar_url,
        created_at,
        token_expires_at,
        updated_at,
        last_login_at
    )
VALUES
    (
        'eb50450e-5e8f-43cb-97b4-336f1cce420e',
        'supabase',
        'eb50450e-5e8f-43cb-97b4-336f1cce420e',
        'dev-bypass-placeholder-token',
        NULL,
        NULL,
        'local-dev',
        'demo@example.org',
        'Local Dev',
        NULL,
        now(),
        NULL,
        now(),
        now()
    )
ON CONFLICT (id) DO NOTHING;
-- One preferences row per user (matches app defaults; openai-first for local testing)
INSERT INTO
    public.user_preferences (
        id,
        user_id,
        default_model_id,
        default_subagent_model_id,
        default_sandbox_type,
        default_diff_mode,
        auto_commit_push,
        auto_create_pr,
        alerts_enabled,
        alert_sound_enabled,
        public_usage_enabled,
        global_skill_refs,
        model_variants,
        enabled_model_ids,
        created_at,
        updated_at
    )
VALUES
    (
        'a0000000-0000-4000-8000-000000000001',
        'eb50450e-5e8f-43cb-97b4-336f1cce420e',
        'openai/gpt-5.4',
        'openai/gpt-5.4',
        'vercel',
        'unified',
        false,
        false,
        true,
        true,
        false,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        now(),
        now()
    )
ON CONFLICT (user_id) DO NOTHING;
