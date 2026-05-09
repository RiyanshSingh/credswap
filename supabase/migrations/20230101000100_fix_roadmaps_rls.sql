-- Fix RLS Policies for Roadmaps to allow admin management even without Supabase Auth session
-- (Because AdminDashboard uses custom RPC login)


DROP POLICY IF EXISTS "Enable insert for all (admin handled)" ON public.roadmaps;
CREATE POLICY "Enable insert for all (admin handled)" ON public.roadmaps FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all (admin handled)" ON public.roadmaps;
CREATE POLICY "Enable update for all (admin handled)" ON public.roadmaps FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all (admin handled)" ON public.roadmaps;
CREATE POLICY "Enable delete for all (admin handled)" ON public.roadmaps FOR DELETE USING (true);

-- Ensure the column is definitely there and a safe default
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS semesters text[] DEFAULT '{}';
