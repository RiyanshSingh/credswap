-- RPC for Admin to manually verify a user's email
-- Only works if admin credentials match
DROP FUNCTION IF EXISTS admin_verify_user_manual;
CREATE OR REPLACE FUNCTION admin_verify_user_manual(
    p_user_id uuid,
    p_username text, 
    p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Authenticate using admin credentials
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- Update the auth.users table directly to mark email as confirmed
    UPDATE auth.users
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW(),
        last_sign_in_at = COALESCE(last_sign_in_at, NOW())
    WHERE id = p_user_id;

    -- If you want to log this action in a separate table, you can do it here
END;
$$;
