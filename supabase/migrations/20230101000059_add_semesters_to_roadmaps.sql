-- Migration to add semesters to roadmaps table
ALTER TABLE public.roadmaps 
ADD COLUMN IF NOT EXISTS semesters text[] DEFAULT '{}';

COMMENT ON COLUMN public.roadmaps.semesters IS 'Array of semesters (e.g., ["1", "2"]) this roadmap is relevant for';
