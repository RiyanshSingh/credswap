-- RE-INIT ADMIN ACCESS (Fix Login Issues)

-- 1. Ensure Admins Table Exists & Disable RLS
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- DISABLE RLS on admins (It's a system table for this app, RPC handles security)
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 2. Upsert Default Admin
INSERT INTO public.admins (username, password)
VALUES ('Riyansh', 'Riyansh123')
ON CONFLICT (username) DO UPDATE 
SET password = 'Riyansh123'; -- Reset password just in case

-- 3. Recreate Login RPC
CREATE OR REPLACE FUNCTION public.login_admin(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE username = p_username AND password = p_password
    );
END;
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.login_admin(TEXT, TEXT) TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO service_role;

-- 5. Verification
SELECT count(*) as admin_count FROM public.admins;
