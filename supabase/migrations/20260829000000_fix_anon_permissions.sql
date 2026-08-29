-- Fix table permissions and RLS for anonymous & authenticated users
-- This allows marketplace, rooms, and community feeds to display seller/user details without 401/42501 errors

-- 1. Ensure schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant SELECT privileges on public tables to anon and authenticated roles
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT SELECT ON TABLE public.marketplace_items TO anon, authenticated;
GRANT SELECT ON TABLE public.rooms TO anon, authenticated;
GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT SELECT ON TABLE public.notes TO anon, authenticated;
GRANT SELECT ON TABLE public.roadmaps TO anon, authenticated;
GRANT SELECT ON TABLE public.community_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.comments TO anon, authenticated;

-- 3. Enable RLS and add public read policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- 4. Ensure marketplace items can be read by everyone
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketplace items are viewable by everyone" ON public.marketplace_items;
CREATE POLICY "Marketplace items are viewable by everyone"
ON public.marketplace_items
FOR SELECT
USING (status = 'approved' OR auth.uid() = seller_id);

-- 5. Ensure rooms can be read by everyone
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Rooms are viewable by everyone"
ON public.rooms
FOR SELECT
USING (status = 'available' OR auth.uid() = owner_id);
