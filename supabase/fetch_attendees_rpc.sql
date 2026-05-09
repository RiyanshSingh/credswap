-- RPC TO FETCH ATTENDEES (Bypassing RLS)

-- Since Direct Select is blocked by RLS for the custom admin, we use a Trusted RPC.
-- This function runs as System (Security Definer) and has full access.

DROP FUNCTION IF EXISTS public.get_admin_event_data(UUID);

CREATE OR REPLACE FUNCTION public.get_admin_event_data(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- <--- Critical: Runs with Superuser privileges
SET search_path = public -- Secure search path
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        to_jsonb(r) || jsonb_build_object(
            'profiles', jsonb_build_object(
                'full_name', p.full_name,
                'email', p.email,
                'avatar_url', p.avatar_url
            )
        )
    )
    INTO result
    FROM event_registrations r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = p_event_id;

    -- Return empty array if null
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Allow Anon (Guest/Custom Admin) to run this
GRANT EXECUTE ON FUNCTION public.get_admin_event_data(UUID) TO anon, authenticated, service_role;

SELECT 'RPC Created: get_admin_event_data' as status;
