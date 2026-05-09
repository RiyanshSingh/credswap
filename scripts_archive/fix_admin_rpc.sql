-- FIX: RE-INIT ADMIN ACCESS & PERMISSIONS
-- This script ensures the admins table is accessible via the login_admin RPC

-- 1. Ensure Admins Table exists
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RESET ADMIN CREDENTIALS (Idempotent)
INSERT INTO public.admins (username, password)
VALUES ('Riyansh', 'Riyansh123')
ON CONFLICT (username) DO UPDATE 
SET password = 'Riyansh123';

-- 3. ENSURE LOGIN RPC IS PUBLICLY ACCESSIBLE (NON-AUTH ROLE)
CREATE OR REPLACE FUNCTION public.login_admin(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE username = p_username AND password = p_password
    );
END;
$$;

-- IMPORTANT: Granting execute to anon so the login form can actually check credentials before a session exists
GRANT EXECUTE ON FUNCTION public.login_admin(TEXT, TEXT) TO anon, authenticated;

-- Ensure the search_path is safe
ALTER FUNCTION public.login_admin(TEXT, TEXT) SET search_path = public;

-- Verification log (Only visible in Supabase dashboard)
-- SELECT 'Admin RPC Fixed' as status;
