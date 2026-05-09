-- ==========================================
-- EMERGENCY ADMIN PERMISSIONS FIX (CUSTOM CREDENTIALS)
-- ==========================================

-- 1. Grant Permissions (Unlock Functions)
GRANT USAGE ON SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE admin_credentials TO anon, authenticated, postgres, service_role;

GRANT EXECUTE ON FUNCTION login_admin(text, text) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION admin_get_marketplace_items(text, text) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION admin_update_marketplace_status(uuid, text, text, text) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION admin_delete_marketplace_item(uuid, text, text) TO anon, authenticated, postgres, service_role;

-- 2. Verify Login Function Logic
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

-- 3. Set Custom Admin Credentials (Riyansh)
-- This inserts the new admin or updates the password if it already exists.
INSERT INTO admin_credentials (username, password)
VALUES ('Riyansh', 'Riyansh@2928')
ON CONFLICT (username) DO UPDATE
SET password = 'Riyansh@2928';

-- Optional: Remove old 'admin' user if you want to clean up (Uncomment to execute)
-- DELETE FROM admin_credentials WHERE username = 'admin';
