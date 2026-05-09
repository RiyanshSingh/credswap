-- FIX PROFILE VISIBILITY (Missing Names)
-- The "Campulsy User" fallback appears when the app cannot read the seller's profile.
-- This is usually due to Row Level Security (RLS) blocking access.

-- 1. Enable RLS (good practice) but...
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL existing restrictive Select policies to be safe
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
DROP POLICY IF EXISTS "Users can see all profiles" ON public.profiles;

-- 3. CREATE a truly public Read policy
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- 4. Verify triggers exist (so new users get profiles)
-- (This part is just for info, Supabase usually handles this via handle_new_user)
