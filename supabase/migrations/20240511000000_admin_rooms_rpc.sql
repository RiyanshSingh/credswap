-- Admin RPC: Get pending rooms for moderation
-- Uses credential-based auth (same pattern as admin_get_users_with_status)
DROP FUNCTION IF EXISTS public.admin_get_pending_rooms;
CREATE OR REPLACE FUNCTION public.admin_get_pending_rooms(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Validate admin credentials
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Invalid admin credentials.';
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(t), '[]'::json) FROM (
            SELECT
                r.*,
                json_build_object(
                    'full_name', p.full_name,
                    'email',     p.email
                ) AS profiles
            FROM public.rooms r
            LEFT JOIN public.profiles p ON r.owner_id = p.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        ) t
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_pending_rooms(TEXT, TEXT) TO authenticated, anon;

-- Admin RPC: Update room status for moderation
DROP FUNCTION IF EXISTS public.admin_update_room_status;
CREATE OR REPLACE FUNCTION public.admin_update_room_status(
    p_username TEXT,
    p_password TEXT,
    p_room_id  UUID,
    p_status   TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Validate admin credentials
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Invalid admin credentials.';
    END IF;

    -- Validate status value
    IF p_status NOT IN ('available', 'rejected', 'taken', 'pending') THEN
        RAISE EXCEPTION 'Invalid status value: %', p_status;
    END IF;

    UPDATE public.rooms SET status = p_status WHERE id = p_room_id;

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_room_status(TEXT, TEXT, UUID, TEXT) TO authenticated, anon;
