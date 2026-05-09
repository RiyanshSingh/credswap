
-- ==========================================
-- EMERGENCY ADMIN LOGIN RESTORATION (UNDO SECURITY HARDENING LOCKOUT)
-- ==========================================

-- 1. DROP the restrictive policies from security_hardening that are causing the lockout
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. RESTORE broader access temporarily so the login can verify your role
CREATE POLICY "Enable read access for all users" ON public.profiles
FOR SELECT USING (true);

-- 3. FIX PERMISSIONS on sensitive tables that were revoked
GRANT ALL ON TABLE public.admin_credentials TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, postgres, service_role;

-- 4. ENSURE THE HEALING FUNCTION IS UNBLOCKED
-- Security hardening might have moved schemas or restricted extensions
CREATE OR REPLACE FUNCTION public.admin_force_sync_auth(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_user_id UUID;
    v_crypted_pass TEXT;
BEGIN
    -- Explicitly use extensions schema for crypt and gen_salt
    v_crypted_pass := extensions.crypt(p_password, extensions.gen_salt('bf'));

    -- 1. Check against Master Table
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_email AND password = p_password) THEN 
        RETURN FALSE; 
    END IF;

    -- 2. Repair/Create Auth User
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, instance_id
        )
        VALUES (
            gen_random_uuid(), 'authenticated', 'authenticated', p_email, 
            v_crypted_pass, now(), '{"provider":"email"}', '{"full_name":"Admin"}', 
            now(), now(), '00000000-0000-0000-0000-000000000000'
        ) RETURNING id INTO v_user_id;
    ELSE
        UPDATE auth.users 
        SET encrypted_password = v_crypted_pass, 
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- 3. Promote Profile
    INSERT INTO public.profiles (id, email, full_name, role, is_admin) 
    VALUES (v_user_id, p_email, 'Admin', 'admin', true) 
    ON CONFLICT (id) DO UPDATE SET role = 'admin', is_admin = true;

    RETURN TRUE;
END; 
$$;

GRANT EXECUTE ON FUNCTION public.admin_force_sync_auth(TEXT, TEXT) TO anon, authenticated;

-- 5. SET THE CREDENTIALS ONE LAST TIME
DELETE FROM public.admin_credentials;
INSERT INTO public.admin_credentials (username, password) VALUES ('riyansh@campulsy.in', 'Campulsy@291005');

-- 6. RE-GRANT EXECUTE ON IS_ADMIN (Security hardening might have messed this up)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
