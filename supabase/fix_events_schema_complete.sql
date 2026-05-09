-- MASTER FIX: Events Table Schema & Policies
-- Run this in your Supabase SQL Editor to fix the "user_id column not found" error

-- 1. Add CORE columns (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='user_id') THEN
        ALTER TABLE events ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='status') THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 2. Add COMPREHENSIVE fields (if missing)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('Offline', 'Online', 'Hybrid')),
ADD COLUMN IF NOT EXISTS start_date TEXT,
ADD COLUMN IF NOT EXISTS end_date TEXT,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_link TEXT,
ADD COLUMN IF NOT EXISTS registration_deadline TEXT,
ADD COLUMN IF NOT EXISTS entry_fee TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS contact_details TEXT,
ADD COLUMN IF NOT EXISTS guest_speaker TEXT,
ADD COLUMN IF NOT EXISTS prize_details TEXT,
ADD COLUMN IF NOT EXISTS certificate_details TEXT,
ADD COLUMN IF NOT EXISTS sponsors TEXT,
ADD COLUMN IF NOT EXISTS event_stage TEXT CHECK (event_stage IN ('Upcoming', 'Ongoing', 'Completed')),
ADD COLUMN IF NOT EXISTS hashtags TEXT[];

-- 3. Ensure RLS is enabled and policies are correct
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Approved events are viewable by everyone" ON events;
CREATE POLICY "Approved events are viewable by everyone" 
ON events FOR SELECT 
USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events" 
ON events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending events" ON events;
CREATE POLICY "Users can update own pending events" 
ON events FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete own pending events" ON events;
CREATE POLICY "Users can delete own pending events" 
ON events FOR DELETE 
USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can do everything on events" ON events;
CREATE POLICY "Admins can do everything on events" 
ON events FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Defaults for existing records
UPDATE events SET status = 'approved' WHERE status IS NULL;
UPDATE events SET event_stage = 'Upcoming' WHERE event_stage IS NULL;
UPDATE events SET mode = 'Offline' WHERE mode IS NULL;
UPDATE events SET level = 'Beginner' WHERE level IS NULL;
