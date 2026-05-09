-- RPC to fetch users with email verification status (for admins)
-- Improved with explicit search path and better schema handling
CREATE OR REPLACE FUNCTION admin_get_users_with_status(p_username text, p_password text)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    college text,
    branch text,
    semester text,
    wallet_balance numeric,
    created_at timestamptz,
    is_verified boolean,
    confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Authenticate using admin credentials
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.college,
        p.branch,
        p.semester,
        p.wallet_balance::numeric,
        p.created_at,
        u.email_confirmed_at IS NOT NULL as is_verified,
        u.email_confirmed_at as confirmed_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$;
