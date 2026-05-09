-- Fix missing admin_get_marketplace_items function and ensure it matches the UI expectations
DROP FUNCTION IF EXISTS public.admin_get_marketplace_items(text, text);
DROP FUNCTION IF EXISTS public.admin_get_marketplace_items();

CREATE OR REPLACE FUNCTION public.admin_get_marketplace_items(p_username text, p_password text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate credentials against the correct table name 'admin_credentials'
    IF NOT EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(t) FROM (
            SELECT 
                mi.*, 
                jsonb_build_object(
                    'full_name', p.full_name,
                    'email', p.email,
                    'avatar_url', p.avatar_url
                ) as profiles
            FROM marketplace_items mi
            LEFT JOIN profiles p ON mi.seller_id = p.id
            ORDER BY mi.created_at DESC
        ) t
    ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_items(text, text) TO anon, authenticated, service_role;
