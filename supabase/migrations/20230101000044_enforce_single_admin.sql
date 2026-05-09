
-- 1. CLEANUP: Remove all other potential admin access
DELETE FROM public.admin_credentials;
UPDATE public.profiles SET role = 'student' WHERE role = 'admin';

-- 2. SET MASTER CREDENTIALS in legacy table
INSERT INTO public.admin_credentials (username, password)
VALUES ('riyansh@campulsy.in', 'Campulsy@291005');

-- 3. ENSURE USER EXISTS IN AUTH AND HAS CORRECT PASSWORD
-- Note: This uses Supabase's internal auth schema. We use ON CONFLICT to update if exists.
-- We use crypt with blowfish (standard for Supabase) to set the password.

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'riyansh@campulsy.in';

    IF v_user_id IS NULL THEN
        -- Create user if not exists
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
            'riyansh@campulsy.in',
            extensions.crypt('Campulsy@291005', extensions.gen_salt('bf')),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Riyansh Admin"}',
            false,
            now(),
            now(),
            '', '', '', ''
        )
        RETURNING id INTO v_user_id;
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt('Campulsy@291005', extensions.gen_salt('bf')),
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- 4. PROMOTE TO ADMIN IN PROFILES
    -- This ensures the is_admin() check passes
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, 'riyansh@campulsy.in', 'Riyansh Admin', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', email = 'riyansh@campulsy.in';

END $$;
