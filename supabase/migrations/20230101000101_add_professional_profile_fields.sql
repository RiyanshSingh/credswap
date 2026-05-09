-- Add new fields to the profiles table for better professional matchmaking

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spoken_languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
