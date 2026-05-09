
-- ====================================================================
-- MASTER RESTORATION SCRIPT (FIXING CIRCULAR RLS & IDENTITY)
-- ====================================================================

-- 1. FIX THE CIRCULAR RLS (The real culprit)
-- We rewrite is_admin() to check the JWT metadata instead of doing a recursive table lookup
-- This is how Supabase roles are meant to be checked securely.
DROP FUNCTION IF EXISTS public.is_admin;
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the role is 'admin' in the JWT app_metadata or user_metadata
    -- This is extremely fast and avoids circular RLS lookups
    RETURN (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. DISABLE LOCK-OUT POLICIES TEMPORARILY
-- Restore essential profile visibility
DROP POLICY IF EXISTS "Enable read for all authenticated" ON public.profiles;
CREATE POLICY "Enable read for all authenticated" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- 3. ENSURE EXTENSIONS ARE ACCESSIBLE
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 4. MASTER IDENTITY SETUP (Direct Auth Override)
DO $$
DECLARE
    v_user_id UUID;
    v_password TEXT := 'Campulsy@291005';
    v_email TEXT := 'riyansh@campulsy.in';
    v_crypted_pass TEXT;
BEGIN
    -- Use a robust way to generate the hash
    v_crypted_pass := extensions.crypt(v_password, extensions.gen_salt('bf', 10));

    -- Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        -- Create user
        INSERT INTO auth.users (
            id, aud, role, email, encrypted_password, 
            email_confirmed_at, last_sign_in_at, raw_app_meta_data, 
            raw_user_meta_data, is_super_admin, created_at, updated_at,
            instance_id
        )
        VALUES (
            gen_random_uuid(), 'authenticated', 'authenticated', v_email, 
            v_crypted_pass, now(), now(),
            '{"provider": "email", "providers": ["email"], "role": "admin"}',
            '{"full_name": "Admin", "role": "admin"}',
            false, now(), now(), '00000000-0000-0000-0000-000000000000'
        ) RETURNING id INTO v_user_id;
    ELSE
        -- Update user: Force password AND metadata roles
        UPDATE auth.users 
        SET encrypted_password = v_crypted_pass,
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}',
            raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
        WHERE id = v_user_id;
    END IF;

    -- 5. Link ID to Profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, 'Admin', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', email = v_email;

    -- 6. Update legacy credentials table (Plain text fallback)
    DELETE FROM public.admin_credentials;
    INSERT INTO public.admin_credentials (username, password) VALUES (v_email, v_password);
END $$;

-- 5. RESTORE PERMISSIONS TO RPCs
GRANT ALL ON TABLE public.profiles TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.admin_credentials TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, postgres, service_role;

-- 6. RE-CREATE THE HEALING FUNCTION (Simplified & Robust)
DROP FUNCTION IF EXISTS public.admin_force_sync_auth;
CREATE OR REPLACE FUNCTION public.admin_force_sync_auth(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_user_id UUID;
    v_crypted TEXT;
BEGIN
    -- Check Master Table
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_email AND password = p_password) THEN 
        RETURN FALSE; 
    END IF;

    v_crypted := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    -- Repair Auth User
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, instance_id)
        VALUES (gen_random_uuid(), 'authenticated', 'authenticated', p_email, v_crypted, now(), '{"provider":"email", "role": "admin"}', '{"role": "admin"}', now(), now(), '00000000-0000-0000-0000-000000000000') RETURNING id INTO v_user_id;
    ELSE
        UPDATE auth.users SET encrypted_password = v_crypted, updated_at = now(), raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' WHERE id = v_user_id;
    END IF;

    -- Promote Profile
    INSERT INTO public.profiles (id, email, full_name, role) 
    VALUES (v_user_id, p_email, 'Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_force_sync_auth(TEXT, TEXT) TO anon, authenticated;
