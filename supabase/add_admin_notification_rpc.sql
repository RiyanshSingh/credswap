-- 1. Get Admin Notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications(
    p_username TEXT,
    p_password TEXT
)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user_id UUID;
    v_system_admin_id UUID := 'a0000000-0000-0000-0000-000000000000';
BEGIN
    -- Verify Credentials
    PERFORM 1 FROM public.admins 
    WHERE username = p_username AND password = p_password;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Credentials';
    END IF;

    -- Return notifications for the System Admin ID
    -- (The Room Trigger sends to ALL admins, which includes this ID)
    RETURN QUERY 
    SELECT * FROM public.notifications 
    WHERE user_id = v_system_admin_id
    ORDER BY created_at DESC
    LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_notifications(TEXT, TEXT) TO anon, authenticated;


-- 2. Mark Admin Notification Read
CREATE OR REPLACE FUNCTION public.mark_admin_notification_read(
    p_notification_id UUID,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify Credentials
    PERFORM 1 FROM public.admins 
    WHERE username = p_username AND password = p_password;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Credentials';
    END IF;

    UPDATE public.notifications
    SET is_read = TRUE
    WHERE id = p_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_admin_notification_read(UUID, TEXT, TEXT) TO anon, authenticated;

-- 3. Clear Admin Notifications
CREATE OR REPLACE FUNCTION public.clear_admin_notifications(
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_system_admin_id UUID := 'a0000000-0000-0000-0000-000000000000';
BEGIN
    -- Verify Credentials
    PERFORM 1 FROM public.admins 
    WHERE username = p_username AND password = p_password;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Credentials';
    END IF;

    DELETE FROM public.notifications
    WHERE user_id = v_system_admin_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_admin_notifications(TEXT, TEXT) TO anon, authenticated;
