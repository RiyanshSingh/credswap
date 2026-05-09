DROP FUNCTION IF EXISTS admin_delete_lost_found_item;
CREATE OR REPLACE FUNCTION admin_delete_lost_found_item(p_item_id uuid, p_username text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    DELETE FROM lost_found_items WHERE id = p_item_id;
END;
$$;

DROP FUNCTION IF EXISTS admin_update_lost_found_status;
CREATE OR REPLACE FUNCTION admin_update_lost_found_status(p_item_id uuid, p_status text, p_username text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    UPDATE lost_found_items SET status = p_status WHERE id = p_item_id;
END;
$$;
