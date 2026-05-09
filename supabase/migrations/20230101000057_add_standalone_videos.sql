-- Add roadmap_id to roadmap_videos to support stand-alone videos
ALTER TABLE public.roadmap_videos ADD COLUMN roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE;

-- Backfill roadmap_id for existing videos
UPDATE public.roadmap_videos v
SET roadmap_id = s.roadmap_id
FROM public.roadmap_sections s
WHERE v.section_id = s.id;

-- Make section_id optional
ALTER TABLE public.roadmap_videos ALTER COLUMN section_id DROP NOT NULL;

-- Add index for roadmap_id
CREATE INDEX IF NOT EXISTS idx_roadmap_videos_roadmap_id ON public.roadmap_videos(roadmap_id);
