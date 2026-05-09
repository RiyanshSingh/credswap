-- Add missing columns to roadmaps table
ALTER TABLE public.roadmaps 
ADD COLUMN IF NOT EXISTS prerequisites TEXT,
ADD COLUMN IF NOT EXISTS skills_gained TEXT;

-- Update existing records if needed (optional)
COMMENT ON COLUMN public.roadmaps.prerequisites IS 'Stored as newline-separated or comma-separated string';
COMMENT ON COLUMN public.roadmaps.skills_gained IS 'Stored as newline-separated or comma-separated string';
