-- Enable Deletion for Task Creators

DROP POLICY IF EXISTS "Creators can delete their own tasks" ON public.tasks;

CREATE POLICY "Creators can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (
    auth.uid() = creator_id
);
