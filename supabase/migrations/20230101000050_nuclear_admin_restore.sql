
-- ====================================================================
-- NUCLEAR MASTER ADMIN RESTORATION SCRIPT
-- ====================================================================

-- 1. Ensure extensions are available in the right place
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. COMPLETELY RESET the admin_credentials table
DROP TABLE IF EXISTS public.admin_credentials CASCADE;
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.admin_credentials (username, password)
VALUES ('riyansh@campulsy.in', 'Campulsy@291005');

-- 3. RESET ROLE IN PROFILES
-- We'll do this for any profile matching the name or email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'riyansh@campulsy.in' OR full_name ILIKE '%Riyansh%';

-- 4. THE NUCLEAR OPTION: Direct Auth Reset
-- This block creates/updates the user with the EXACT password hashing Supabase expects.
DO $$
DECLARE
    v_user_id UUID;
    v_password TEXT := 'Campulsy@291005';
    v_email TEXT := 'riyansh@campulsy.in';
    v_encrypted_password TEXT;
BEGIN
    -- Generate the encrypted password using the pgcrypto extension
    -- We try to use extensions schema, then public fallback
    BEGIN
        v_encrypted_password := extensions.crypt(v_password, extensions.gen_salt('bf', 10));
    EXCEPTION WHEN OTHERS THEN
        v_encrypted_password := crypt(v_password, gen_salt('bf', 10));
    END;

    -- Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        -- Create new user
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
            v_email,
            v_encrypted_password,
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Master Admin"}',
            false,
            now(),
            now(),
            '', '', '', ''
        )
        RETURNING id INTO v_user_id;
    ELSE
        -- Update existing user
        UPDATE auth.users 
        SET encrypted_password = v_encrypted_password,
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
            raw_user_meta_data = '{"full_name": "Master Admin"}'
        WHERE id = v_user_id;
    END IF;

    -- 5. Final Profile Promotion (Linked to the Auth ID)
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, 'Master Admin', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', email = v_email;

END $$;

-- 5. Open up the permissions for the Login verification
-- This undoes the lockouts from security_hardening.sql
GRANT ALL ON TABLE public.profiles TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.admin_credentials TO anon, authenticated, postgres, service_role;

-- Grant EXECUTE on is_admin to everyone to avoid policy recursion errors
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, postgres, service_role;

-- Restore simple policy for Profiles

DROP POLICY IF EXISTS "Allow all read for login" ON public.profiles;
CREATE POLICY "Allow all read for login" ON public.profiles FOR SELECT USING (true);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
