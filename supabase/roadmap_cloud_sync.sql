-- Track roadmap enrollments
CREATE TABLE IF NOT EXISTS public.roadmap_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, roadmap_id)
);

-- Track individual video progress
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.roadmap_videos(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Add RLS policies
ALTER TABLE public.roadmap_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

-- Users can see/manage their own data
CREATE POLICY "Users can manage their own roadmap enrollments"
    ON public.roadmap_enrollments FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roadmap progress"
    ON public.roadmap_progress FOR ALL
    USING (auth.uid() = user_id);
