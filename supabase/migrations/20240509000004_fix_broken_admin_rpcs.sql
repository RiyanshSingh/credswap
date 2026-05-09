-- Comprehensive Fix for Admin RPCs
-- Restores credential-based validation to match the Admin Dashboard UI

-- 1. admin_get_users_with_status
DROP FUNCTION IF EXISTS public.admin_get_users_with_status(text, text);
DROP FUNCTION IF EXISTS public.admin_get_users_with_status();
CREATE OR REPLACE FUNCTION public.admin_get_users_with_status(p_username text, p_password text)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;
    RETURN COALESCE((
        SELECT jsonb_agg(t) FROM (
            SELECT p.*, (SELECT count(*) FROM event_registrations er WHERE er.user_id = p.id) as registrations_count
            FROM profiles p ORDER BY p.created_at DESC
        ) t
    ), '[]'::jsonb);
END;
$$;

-- 2. admin_update_marketplace_status
DROP FUNCTION IF EXISTS public.admin_update_marketplace_status(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_marketplace_status(uuid, text);
CREATE OR REPLACE FUNCTION public.admin_update_marketplace_status(p_item_id uuid, p_status text, p_username text, p_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;
    UPDATE marketplace_items SET status = p_status, updated_at = NOW() WHERE id = p_item_id;
END;
$$;

-- 3. admin_delete_marketplace_item
DROP FUNCTION IF EXISTS public.admin_delete_marketplace_item(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_delete_marketplace_item(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_marketplace_item(p_item_id uuid, p_username text, p_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;
    DELETE FROM marketplace_items WHERE id = p_item_id;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.admin_get_users_with_status(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_marketplace_status(uuid, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_marketplace_item(uuid, text, text) TO anon, authenticated, service_role;
