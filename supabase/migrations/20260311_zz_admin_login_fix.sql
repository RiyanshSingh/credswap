-- Enforce single admin login: ID "Riyansh" + password "Riyansh@2928"
-- Internal admin email used for Supabase Auth

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1) Demote any existing admins
    UPDATE public.profiles
    SET role = 'student', is_admin = false
    WHERE role = 'admin' OR is_admin = true;

    -- 2) Ensure auth user exists with correct password
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@campulsy.in';

    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, last_sign_in_at, raw_app_meta_data,
            raw_user_meta_data, is_super_admin, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@campulsy.in',
            extensions.crypt('Riyansh@2928', extensions.gen_salt('bf')),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Riyansh"}',
            false,
            now(),
            now(),
            '', '', '', ''
        )
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('Riyansh@2928', extensions.gen_salt('bf')),
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- 3) Ensure admin profile
    INSERT INTO public.profiles (id, email, full_name, role, is_admin)
    VALUES (v_user_id, 'admin@campulsy.in', 'Riyansh', 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', is_admin = true, email = 'admin@campulsy.in', full_name = 'Riyansh';

    -- 4) Legacy admin_credentials (if present)
    IF to_regclass('public.admin_credentials') IS NOT NULL THEN
        DELETE FROM public.admin_credentials;
        INSERT INTO public.admin_credentials (username, password)
        VALUES ('Riyansh', 'Riyansh@2928');
    END IF;
END $$;
