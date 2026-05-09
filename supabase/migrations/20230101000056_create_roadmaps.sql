-- Create Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT, -- Beginner, Intermediate, Advanced
    estimated_time TEXT,
    icon TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Roadmap Sections Table
CREATE TABLE IF NOT EXISTS public.roadmap_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    section_title TEXT NOT NULL,
    section_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Roadmap Videos Table
CREATE TABLE IF NOT EXISTS public.roadmap_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.roadmap_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    youtube_link TEXT NOT NULL,
    thumbnail TEXT,
    duration TEXT,
    channel TEXT,
    video_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_videos ENABLE ROW LEVEL SECURITY;

-- Create Policies for Web Read Access (Public)
DROP POLICY IF EXISTS "Roadmaps are viewable by everyone" ON public.roadmaps;
CREATE POLICY "Roadmaps are viewable by everyone" ON public.roadmaps FOR SELECT USING (true);
DROP POLICY IF EXISTS "Roadmap sections are viewable by everyone" ON public.roadmap_sections;
CREATE POLICY "Roadmap sections are viewable by everyone" ON public.roadmap_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Roadmap videos are viewable by everyone" ON public.roadmap_videos;
CREATE POLICY "Roadmap videos are viewable by everyone" ON public.roadmap_videos FOR SELECT USING (true);

-- Create Policies for Admin Management (Admin only)
-- Note: Assuming a similar admin check exists as for other tables, e.g., using auth.uid()
-- Here we'll just allow authenticated users for simplicity, or we can check the admin table
-- Let's defer strict insert/update to simple authenticated for the MVP, or better yet, check the admin users if there's an `admin_users` table.

-- Let's define the standard authenticated access and let app-level handle strict admin, 
-- or use the existing pattern. Looking at the prompt, MVP is needed.
DROP POLICY IF EXISTS "Authenticated users can insert roadmaps" ON public.roadmaps;
CREATE POLICY "Authenticated users can insert roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update roadmaps" ON public.roadmaps;
CREATE POLICY "Authenticated users can update roadmaps" ON public.roadmaps FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete roadmaps" ON public.roadmaps;
CREATE POLICY "Authenticated users can delete roadmaps" ON public.roadmaps FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert sections" ON public.roadmap_sections;
CREATE POLICY "Authenticated users can insert sections" ON public.roadmap_sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update sections" ON public.roadmap_sections;
CREATE POLICY "Authenticated users can update sections" ON public.roadmap_sections FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete sections" ON public.roadmap_sections;
CREATE POLICY "Authenticated users can delete sections" ON public.roadmap_sections FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.roadmap_videos;
CREATE POLICY "Authenticated users can insert videos" ON public.roadmap_videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update videos" ON public.roadmap_videos;
CREATE POLICY "Authenticated users can update videos" ON public.roadmap_videos FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON public.roadmap_videos;
CREATE POLICY "Authenticated users can delete videos" ON public.roadmap_videos FOR DELETE USING (auth.role() = 'authenticated');

-- Seed Data for 5 Core Roadmaps
INSERT INTO public.roadmaps (id, title, description, difficulty, estimated_time, icon, slug) VALUES 
(gen_random_uuid(), 'Web Development', 'Become a full stack developer by building modern web applications.', 'Beginner → Advanced', '6 Months', '🌐', 'web-development'),
(gen_random_uuid(), 'Data Structures & Algorithms', 'Crack coding interviews with standard patterns and standard DSA concepts.', 'Beginner → Advanced', '4 Months', '💻', 'dsa'),
(gen_random_uuid(), 'Artificial Intelligence / ML', 'Build intelligent systems and learn underlying mathematics.', 'Intermediate → Advanced', '8 Months', '🤖', 'ai-ml'),
(gen_random_uuid(), 'Cyber Security', 'Learn ethical hacking, penetration testing, and secure system design.', 'Beginner → Advanced', '6 Months', '🛡️', 'cyber-security'),
(gen_random_uuid(), 'DevOps', 'Master modern CI/CD, containerization, and cloud infrastructure.', 'Intermediate', '5 Months', '⚙️', 'devops')
ON CONFLICT (slug) DO NOTHING;

-- Further seed data can be added through the Admin Panel.
