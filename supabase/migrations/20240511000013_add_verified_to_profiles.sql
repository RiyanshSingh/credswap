-- Add is_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Auto-verify existing users with non-free email domains
UPDATE public.profiles 
SET is_verified = true 
WHERE email NOT LIKE '%@gmail.com' 
  AND email NOT LIKE '%@yahoo.com' 
  AND email NOT LIKE '%@hotmail.com' 
  AND email NOT LIKE '%@outlook.com';

-- Create an RPC for admins to manually verify/unverify users
CREATE OR REPLACE FUNCTION admin_verify_user(p_username TEXT, p_password TEXT, target_user_id UUID, verify_status BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate admin credentials
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can verify users.';
    END IF;

    -- Update the verification status
    UPDATE public.profiles
    SET is_verified = verify_status
    WHERE id = target_user_id;
END;
$$;

-- Trigger to auto-verify new users with non-free email domains
CREATE OR REPLACE FUNCTION auto_verify_college_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND 
     NEW.email NOT LIKE '%@gmail.com' AND 
     NEW.email NOT LIKE '%@yahoo.com' AND 
     NEW.email NOT LIKE '%@hotmail.com' AND 
     NEW.email NOT LIKE '%@outlook.com' THEN
    NEW.is_verified = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_verify_college_email ON public.profiles;
CREATE TRIGGER tr_auto_verify_college_email
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION auto_verify_college_email();
