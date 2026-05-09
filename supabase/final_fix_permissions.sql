-- FINAL PERMISSION FIX (Run this to fix 0 Attendees issue)

-- 1. EVENT REGISTRATIONS: Allow EVERYONE (Authenticated) to READ
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all read" ON public.event_registrations;
CREATE POLICY "Allow all read" ON public.event_registrations
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all update" ON public.event_registrations;
CREATE POLICY "Allow all update" ON public.event_registrations
FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all insert" ON public.event_registrations;
CREATE POLICY "Allow all insert" ON public.event_registrations
FOR INSERT TO authenticated WITH CHECK (true);

-- 2. PROFILES: Allow EVERYONE to READ Names/Emails (Crucial for Admin List)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- 3. EVENTS: Allow Read/Write
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all events read" ON public.events;
CREATE POLICY "Allow all events read" ON public.events
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all events update" ON public.events;
CREATE POLICY "Allow all events update" ON public.events
FOR UPDATE TO authenticated USING (true);

-- 4. FORCE REFRESH CACHE (Not SQL, but good to know)
-- (The UI query needs these policies to succeed)

-- 5. Verification: Return count of registrations for debugging
SELECT 'Current Registrations Count' as label, count(*) FROM event_registrations;
