-- FINAL PERMISSION FIX V2 (For Custom Admin Auth)

-- The custom admin login does not sign in to Supabase Auth, so the user is effectively 'anon'.
-- We must allow 'anon' to READ the data for the Admin Dashboard to work.

-- 1. EVENT REGISTRATIONS: Allow ANON to READ
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.event_registrations;
CREATE POLICY "Allow anon read" ON public.event_registrations
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon update" ON public.event_registrations;
CREATE POLICY "Allow anon update" ON public.event_registrations
FOR UPDATE TO anon USING (true); -- Needed for manual check-in if not using RPC? RPC bypasses RLS anyway.

-- 2. PROFILES: Allow ANON to READ (for Names/Emails)
-- CAUTION: This exposes user names/emails to the public API.
-- Since this is a prototype/campus app, we accept this risk for the Admin Dashboard functionality.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles" ON public.profiles
FOR SELECT TO anon USING (true);

-- 3. EVENTS: Allow ANON to READ
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read events" ON public.events;
CREATE POLICY "Allow anon read events" ON public.events
FOR SELECT TO anon USING (true);

-- 4. Verification
SELECT 'Policy Update Complete. Please refresh dashboard.' as status;
