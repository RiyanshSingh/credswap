
-- 1. Ensure the user's profile is promoted to Admin
-- This allows the 'is_admin()' check in security_hardening.sql to pass
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'riyansh@campulsy.in';

-- 2. Update the legacy admin_credentials table
-- Although newer RPCs use auth.uid(), some older ones might still reference this table.
-- We ensure both the exact email and a shortened version are supported.
INSERT INTO public.admin_credentials (username, password)
VALUES ('riyansh@campulsy.in', 'Campulsy@291005')
ON CONFLICT (username) DO UPDATE
SET password = 'Campulsy@291005';

-- If they use just 'riyansh' as ID in some places
INSERT INTO public.admin_credentials (username, password)
VALUES ('riyansh', 'Campulsy@291005')
ON CONFLICT (username) DO UPDATE
SET password = 'Campulsy@291005';

-- 3. In case the user doesn't have a profile yet (but exists in auth.users)
-- This is a safety measure to ensure the next login attempt syncs the role
-- Note: Profiles are usually created by a trigger on auth.users
