-- Fix admin users status: include verified flag from auth.users

DROP FUNCTION IF EXISTS public.admin_get_users_with_status;
CREATE OR REPLACE FUNCTION public.admin_get_users_with_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    RETURN (
        SELECT json_agg(t) FROM (
            SELECT
                p.id,
                p.full_name,
                COALESCE(p.email, u.email) as email,
                p.avatar_url,
                p.college,
                p.branch,
                p.semester,
                p.wallet_balance,
                p.created_at,
                (u.email_confirmed_at IS NOT NULL) as is_verified,
                u.email_confirmed_at as confirmed_at,
                (SELECT count(*) FROM public.event_registrations er WHERE er.user_id = p.id) as registrations_count
            FROM public.profiles p
            LEFT JOIN auth.users u ON p.id = u.id
            GROUP BY p.id, u.email, u.email_confirmed_at
            ORDER BY p.created_at DESC
        ) t
    );
END;
$$;
