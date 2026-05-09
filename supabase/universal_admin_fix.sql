-- ==========================================
-- UNIVERSAL ADMIN MASTER FIX (CONSISTENCY & LOGIN)
-- ==========================================

-- 1. Ensure BOTH tables exist
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Populate/Update Credentials (Riyansh) - Setting to Riyansh / Riyansh@2928
INSERT INTO public.admin_credentials (username, password, email)
VALUES ('Riyansh', 'Riyansh@2928', 'admin@example.com')
ON CONFLICT (username) DO UPDATE
SET password = 'Riyansh@2928', email = 'admin@example.com';

INSERT INTO public.admins (username, password, email)
VALUES ('Riyansh', 'Riyansh@2928', 'admin@example.com')
ON CONFLICT (username) DO UPDATE
SET password = 'Riyansh@2928', email = 'admin@example.com';

-- 3. UNIFY LOGIN FUNCTION (Checks admin_credentials)
CREATE OR REPLACE FUNCTION public.login_admin(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_credentials 
        WHERE username = p_username 
        AND password = p_password
    );
END;
$$;

-- 4. FIX ALL ADMIN RPCs TO BE CONSISTENT
-- Lost & Found
CREATE OR REPLACE FUNCTION public.admin_delete_lost_found_item(p_item_id UUID, p_username TEXT, p_password TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;
    DELETE FROM public.lost_found_items WHERE id = p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_lost_found_status(p_item_id UUID, p_status TEXT, p_username TEXT, p_password TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;
    UPDATE public.lost_found_items SET status = p_status WHERE id = p_item_id;
END;
$$;

-- Marketplace
CREATE OR REPLACE FUNCTION public.admin_get_marketplace_items(p_username TEXT, p_password TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;
    RETURN (SELECT json_agg(t) FROM (SELECT mi.*, p.full_name as seller_name, p.email as seller_email FROM marketplace_items mi LEFT JOIN profiles p ON mi.seller_id = p.id ORDER BY mi.created_at DESC) t);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_marketplace_status(p_item_id UUID, p_status TEXT, p_username TEXT, p_password TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;
    UPDATE marketplace_items SET status = p_status, updated_at = NOW() WHERE id = p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_marketplace_item(p_item_id UUID, p_username TEXT, p_password TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = p_username AND password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;
    DELETE FROM marketplace_items WHERE id = p_item_id;
END;
$$;

-- 5. Grant Permissions
GRANT ALL ON TABLE public.admin_credentials TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.admins TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.login_admin(TEXT, TEXT) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_items(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_marketplace_status(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_marketplace_item(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_lost_found_item(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_lost_found_status(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 6. ENSURE PROFILE ROLE IS ADMIN
-- Update the major profile identifiers
UPDATE public.profiles SET role = 'admin' WHERE full_name ILIKE '%Riyansh%';
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
