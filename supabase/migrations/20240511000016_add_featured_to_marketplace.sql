-- Add is_featured column to marketplace_items
ALTER TABLE public.marketplace_items 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Drop existing function to allow changing return type
DROP FUNCTION IF EXISTS admin_get_marketplace_items(TEXT, TEXT);

-- Update the admin_get_marketplace_items RPC to include is_featured
CREATE OR REPLACE FUNCTION public.admin_get_marketplace_items(p_username text, p_password text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT login_admin(p_username, p_password) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(t) FROM (
            SELECT 
                m.*, 
                p.full_name as seller_name,
                p.email as seller_email,
                p.avatar_url as seller_avatar
            FROM marketplace_items m
            LEFT JOIN profiles p ON m.seller_id = p.id
            ORDER BY m.created_at DESC
        ) t
    ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_items(text, text) TO anon, authenticated, service_role;


-- Add a function to toggle featured status
CREATE OR REPLACE FUNCTION admin_toggle_marketplace_featured(
    p_item_id UUID,
    p_is_featured BOOLEAN,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT login_admin(p_username, p_password) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE marketplace_items
    SET is_featured = p_is_featured
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
