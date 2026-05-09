-- FIX/UPDATE TASKS SCHEMA (Final Fix)

-- 1. Ensure columns exist (Standardizing on 'reward' not 'reward_amount')
DO $$ 
BEGIN 
    -- 'reward' likely exists, but ensure it checks out.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reward') THEN
        ALTER TABLE public.tasks ADD COLUMN reward NUMERIC DEFAULT 0;
    END IF;

    -- Add other columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'steps') THEN
        ALTER TABLE public.tasks ADD COLUMN steps JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'requirements') THEN
        ALTER TABLE public.tasks ADD COLUMN requirements JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'type') THEN
        ALTER TABLE public.tasks ADD COLUMN type TEXT DEFAULT 'Online';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'difficulty') THEN
        ALTER TABLE public.tasks ADD COLUMN difficulty TEXT DEFAULT 'Easy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'spots_total') THEN
        ALTER TABLE public.tasks ADD COLUMN spots_total INTEGER DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'spots_taken') THEN
        ALTER TABLE public.tasks ADD COLUMN spots_taken INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'expires_at') THEN
        ALTER TABLE public.tasks ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
    END IF;
END $$;


-- 2. Create 'task_submissions' table (Safe create)
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_url TEXT,
    status TEXT DEFAULT 'pending',
    feedback TEXT,
    earnings_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Policies (Safe drop & recreate)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own submissions" ON public.task_submissions;
CREATE POLICY "Users can view own submissions" ON public.task_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create submissions" ON public.task_submissions;
CREATE POLICY "Users can create submissions" ON public.task_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all submissions" ON public.task_submissions;
CREATE POLICY "Admins can view all submissions" ON public.task_submissions FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Seed Data (Using 'reward' column)
INSERT INTO public.tasks (title, description, reward, type, difficulty, steps, requirements, spots_total, spots_taken, deadline)
SELECT 
    'Design a College Event Poster',
    'Create a vibrant poster for the upcoming Tech Fest. Must be A4 size and include the college logo.',
    500,
    'Online',
    'Medium',
    '["Download the brand kit", "Create design in Canva/Photoshop", "Submit PDF or PNG"]'::jsonb,
    '["Proficient in Graphic Design", "Submit before Friday"]'::jsonb,
    5,
    2,
    '2024-12-30'
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE title = 'Design a College Event Poster');

INSERT INTO public.tasks (title, description, reward, type, difficulty, steps, requirements, spots_total, spots_taken, deadline)
SELECT 
    'Organize a Cleanup Drive',
    'Lead a team of 5 students to clean up the campus park.',
    1000,
    'Offline',
    'Hard',
    '["Gather a team", "Collect cleaning supplies from admin", "Clean the park for 2 hours", "Upload photo of team"]'::jsonb,
    '["Must be on campus", "Physical work required"]'::jsonb,
    2,
    0,
    '2024-12-31'
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE title = 'Organize a Cleanup Drive');
