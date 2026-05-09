CREATE OR REPLACE FUNCTION public.admin_delete_lost_found_item(
    p_item_id UUID,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.login_admin(p_username, p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    DELETE FROM public.lost_found_items WHERE id = p_item_id;
END;
$$;

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
BEGIN
    IF NOT public.login_admin(p_username, p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    UPDATE public.lost_found_items SET status = p_status WHERE id = p_item_id;
END;
$$;
