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
-- Ensure user_profile exists for the seeded auth user (FK target for agent.user_id)
INSERT INTO
    "public"."user_profile" ("id", "email")
VALUES
    ('eb50450e-5e8f-43cb-97b4-336f1cce420e', 'demo@example.org')
ON CONFLICT (id) DO NOTHING;