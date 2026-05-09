-- ENSURE PROFILE EXISTS
-- Sometimes a user exists in Auth but not in the public.profiles table.
-- This script inserts a profile for YOU (the specific user running this script).

INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
VALUES (
  auth.uid(),
  'My Verified Account', -- This will be your name
  'myemail@example.com',
  'student',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name, -- Force update name to prove it works
  avatar_url = EXCLUDED.avatar_url;

-- Also try to fix any other missing names
UPDATE public.profiles 
SET full_name = 'Campus User ' || substr(id::text, 1, 4) 
WHERE full_name IS NULL OR full_name = '';
