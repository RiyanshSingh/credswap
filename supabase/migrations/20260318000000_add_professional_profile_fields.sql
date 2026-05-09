-- Add new fields to the profiles table for better professional matchmaking

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS graduation_year TEXT,
ADD COLUMN IF NOT EXISTS current_role TEXT,
ADD COLUMN IF NOT EXISTS spoken_languages TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[];
