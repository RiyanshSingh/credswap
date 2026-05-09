
-- 1. Create a Self-Healing Admin Sync RPC
-- This RPC allows the frontend to "fix" the Auth user if the legacy credentials match
-- but the Auth system is out of sync (common after migrations/resets)

DROP FUNCTION IF EXISTS public.admin_force_sync_auth;
CREATE OR REPLACE FUNCTION public.admin_force_sync_auth(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_salt TEXT;
BEGIN
    -- 1. Verify against the "Secure" local table first
    -- This table is managed by migrations and is our "Source of Truth"
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials 
        WHERE username = p_email AND password = p_password
    ) THEN
        RETURN FALSE;
    END IF;

    -- 2. Find or Create the Auth User
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    v_salt := extensions.gen_salt('bf');

    IF v_user_id IS NULL THEN
        -- Create the missing auth user
        INSERT INTO auth.users (
            id, aud, role, email, encrypted_password, 
            email_confirmed_at, last_sign_in_at, raw_app_meta_data, 
            raw_user_meta_data, is_super_admin, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            extensions.crypt(p_password, v_salt),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Master Admin"}',
            false,
            now(),
            now()
        )
        RETURNING id INTO v_user_id;
    ELSE
        -- Fix the password for the existing user
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt(p_password, v_salt),
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- 3. Ensure the Profile is also sync'd and promoted
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, p_email, 'Master Admin', 'admin'
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', email = p_email;

    RETURN TRUE;
END;
$$;

-- Grant access to everyone so the login page can call it during "healing"
GRANT EXECUTE ON FUNCTION public.admin_force_sync_auth(TEXT, TEXT) TO anon, authenticated;

-- Ensure the master credentials are in the source of truth table
DELETE FROM public.admin_credentials;
INSERT INTO public.admin_credentials (username, password)
VALUES ('riyansh@campulsy.in', 'Campulsy@291005');
