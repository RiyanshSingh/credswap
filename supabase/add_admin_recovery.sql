-- 1. Add Email to Admins
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Backfill existing admin (Riyansh) with a placeholder email so he can test
UPDATE public.admins 
SET email = 'admin@example.com' 
WHERE username = 'Riyansh' AND email IS NULL;

-- 2. Create Recovery Tokens Table
CREATE TABLE IF NOT EXISTS public.admin_recovery_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RPC: Request Recovery (SIMULATION)
-- Returns the token purely for testing purposes since we can't send emails
CREATE OR REPLACE FUNCTION public.request_admin_recovery(p_email TEXT)
RETURNS TEXT -- Returns key for demo
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_token TEXT;
BEGIN
    -- Find Admin
    SELECT id INTO v_admin_id FROM public.admins WHERE email = p_email;
    
    IF v_admin_id IS NULL THEN
        -- Security: Don't reveal if email exists, just return null or fake success
        -- For this demo, we'll return null to indicate "check email" generic msg
        RETURN NULL;
    END IF;

    -- Generate 6-digit Token
    v_token := floor(random() * (999999 - 100000 + 1) + 100000)::text;

    -- Store Token (Valid for 15 mins)
    INSERT INTO public.admin_recovery_tokens (admin_id, token, expires_at)
    VALUES (v_admin_id, v_token, NOW() + INTERVAL '15 minutes');

    -- IN PRODUCTION: Send Email here via pg_net or triggering an Edge Function
    -- DEMO ONLY: Return the token
    RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_admin_recovery(TEXT) TO anon, authenticated;

-- 4. RPC: Complete Reset
CREATE OR REPLACE FUNCTION public.reset_admin_password(
    p_email TEXT,
    p_token TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_token_id UUID;
BEGIN
    -- Validate Token
    SELECT t.id, t.admin_id INTO v_token_id, v_admin_id
    FROM public.admin_recovery_tokens t
    JOIN public.admins a ON t.admin_id = a.id
    WHERE a.email = p_email
    AND t.token = p_token
    AND t.used = FALSE
    AND t.expires_at > NOW();

    IF v_token_id IS NULL THEN
        RETURN FALSE; -- Invalid or Expired
    END IF;

    -- Update Password
    UPDATE public.admins 
    SET password = p_new_password 
    WHERE id = v_admin_id;

    -- Mark Token Used
    UPDATE public.admin_recovery_tokens 
    SET used = TRUE 
    WHERE id = v_token_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_admin_password(TEXT, TEXT, TEXT) TO anon, authenticated;
