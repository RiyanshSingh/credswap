-- FIX TASKS RLS
-- The error "new row violates row-level security policy" means no INSERT policy exists for authenticated users.

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (Clean slate for Insert/Update)
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Creators can update their tasks" ON public.tasks;

-- 3. Add INSERT Policy
-- Allow any authenticated user to create a task, provided they set themselves as creator
CREATE POLICY "Users can create tasks" ON public.tasks 
FOR INSERT 
WITH CHECK (
    auth.uid() = creator_id
);

-- 4. Add UPDATE Policy
-- Allow creators to update their own tasks (for editing details, etc.)
CREATE POLICY "Creators can update their tasks" ON public.tasks 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- 5. Ensure Select Policy exists (Usually 'Tasks are viewable by everyone')
-- (Assuming this already exists from previous scripts, but ensuring coverage)
-- DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
-- CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);
