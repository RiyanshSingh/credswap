-- Fix RLS policies for system_settings to allow admin updates and inserts
-- and add a secure RPC for admin settings management

-- 1. Ensure policies exist for admin access (using service_role bypass or explicit checks)
-- However, for the dashboard to work with the anon key + custom auth, we need a secure RPC.

CREATE OR REPLACE FUNCTION admin_update_system_setting(
    p_key text,
    p_value text,
    p_username text,
    p_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator (service_role) privileges
AS $$
BEGIN
    -- Verify Admin Credentials
    IF NOT EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    -- Perform Upsert
    INSERT INTO system_settings (key, value, description)
    VALUES (p_key, p_value, 'Updated via admin RPC')
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description;

    RETURN true;
END;
$$;

-- Also ensure public read access is enabled if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON system_settings FOR SELECT USING (true);
    END IF;
END
$$;
