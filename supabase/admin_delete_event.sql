CREATE OR REPLACE FUNCTION public.admin_delete_event(
    p_event_id UUID,
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_valid BOOLEAN;
BEGIN
    -- Verify admin credentials
    SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
    
    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    -- Delete the event
    DELETE FROM public.events WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
