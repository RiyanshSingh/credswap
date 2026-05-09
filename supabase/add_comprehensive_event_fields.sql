-- Add comprehensive fields to the events table
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

-- Update existing events to have some default values for mandatory fields if any
UPDATE events SET event_stage = 'Upcoming' WHERE event_stage IS NULL;
UPDATE events SET mode = 'Offline' WHERE mode IS NULL;
UPDATE events SET level = 'Beginner' WHERE level IS NULL;
