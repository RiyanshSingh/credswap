-- RPC: Admin Delete Lost & Found Item
CREATE OR REPLACE FUNCTION public.admin_delete_lost_found_item(
    p_item_id UUID,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Verify Admin Credentials by checking the admins table
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- Delete Item
    DELETE FROM public.lost_found_items WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_lost_found_item(UUID, TEXT, TEXT) TO anon, authenticated;


-- RPC: Admin Update Lost & Found Item Status
CREATE OR REPLACE FUNCTION public.admin_update_lost_found_status(
    p_item_id UUID,
    p_status TEXT,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- Update Item
    UPDATE public.lost_found_items 
    SET status = p_status
    WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_lost_found_status(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
