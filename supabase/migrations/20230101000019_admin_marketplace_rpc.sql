-- ==========================================
-- UNIVERSAL ADMIN FIX (Run this once)
-- ==========================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS admin_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Force Sync Admin User (Reset to admin/admin123)
-- This ensures you definitely have a valid login.
INSERT INTO admin_credentials (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO UPDATE
SET password = 'admin123';

-- 3. UNIFY LOGIN LOGIC (Override existing login_admin)
-- This ensures the Login Page uses the same table as the Marketplace Manager
DROP FUNCTION IF EXISTS login_admin;
CREATE OR REPLACE FUNCTION login_admin(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_credentials 
        WHERE username = p_username 
        AND password = p_password
    );
END;
$$;

-- 4. Marketplace Fetch RPC (Uses same check)
DROP FUNCTION IF EXISTS admin_get_marketplace_items;
CREATE OR REPLACE FUNCTION admin_get_marketplace_items(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials. Please Log Out and Log In again.';
    END IF;

    RETURN (
        SELECT json_agg(t) FROM (
            SELECT 
                mi.*, 
                p.full_name as seller_name, 
                p.email as seller_email,
                p.avatar_url as seller_avatar
            FROM marketplace_items mi
            LEFT JOIN profiles p ON mi.seller_id = p.id
            ORDER BY mi.created_at DESC
        ) t
    );
END;
$$;

-- 5. Update RPC
DROP FUNCTION IF EXISTS admin_update_marketplace_status;
CREATE OR REPLACE FUNCTION admin_update_marketplace_status(p_item_id uuid, p_status text, p_username text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    UPDATE marketplace_items
    SET status = p_status, updated_at = NOW()
    WHERE id = p_item_id;
END;
$$;

-- 6. Delete RPC
DROP FUNCTION IF EXISTS admin_delete_marketplace_item;
CREATE OR REPLACE FUNCTION admin_delete_marketplace_item(p_item_id uuid, p_username text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    DELETE FROM marketplace_items
    WHERE id = p_item_id;
END;
$$;
