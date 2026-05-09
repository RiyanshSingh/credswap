-- Updated RPC to fetch users with email verification status AND attendance counts
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
    confirmed_at timestamptz,
    attendance_present bigint,
    attendance_absent bigint,
    attendance_halfday bigint
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
        u.email_confirmed_at as confirmed_at,
        COALESCE(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END), 0) as attendance_present,
        COALESCE(SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END), 0) as attendance_absent,
        COALESCE(SUM(CASE WHEN ar.status = 'halfday' THEN 1 ELSE 0 END), 0) as attendance_halfday
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.attendance_records ar ON p.id = ar.user_id
    GROUP BY p.id, u.email_confirmed_at
    ORDER BY p.created_at DESC;
END;
$$;
