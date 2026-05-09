-- Admin Identity Setup

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Storing plain text as explicitly requested for this demo
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed Admin User (Idempotent)
INSERT INTO public.admins (username, password)
VALUES ('Riyansh', 'Riyansh123')
ON CONFLICT (username) DO NOTHING;

-- 2.5 Ensure Role Column Exists in Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 3. Create System Admin Profile
-- We need to satisfy the FK constraint to auth.users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000000') THEN
        INSERT INTO auth.users (id, email)
        VALUES ('a0000000-0000-0000-0000-000000000000', 'admin@campusconnect.com');
    END IF;
END $$;

INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'System Admin',
    'admin@campusconnect.com',
    'admin',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
)
ON CONFLICT (id) DO UPDATE
SET full_name = 'System Admin', role = 'admin';

-- 4. RPC: Admin Login
-- Returns true if credentials match
CREATE OR REPLACE FUNCTION public.login_admin(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE username = p_username AND password = p_password
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_admin(TEXT, TEXT) TO anon, authenticated;

-- 5. RPC: Post Message as Admin
-- Allows posting a message to the dispute chat with the System Admin ID
-- verifying credentials securely on the server side.
CREATE OR REPLACE FUNCTION public.post_admin_message(
    p_dispute_id UUID,
    p_content TEXT,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_system_admin_uuid UUID := 'a0000000-0000-0000-0000-000000000000';
BEGIN
    -- Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- Insert Message
    INSERT INTO public.dispute_messages (
        dispute_id,
        sender_id, -- Uses the System Admin Profile ID
        content,
        is_admin_message
    ) VALUES (
        p_dispute_id,
        v_system_admin_uuid,
        p_content,
        TRUE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_admin_message(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
