-- Fix Task Deletion Constraint Issues
-- Adds ON DELETE CASCADE to related tables so tasks can be deleted properly

-- 1. task_orders: Drop and Recreate constraint with CASCADE
ALTER TABLE public.task_orders
DROP CONSTRAINT IF EXISTS task_orders_task_id_fkey;

ALTER TABLE public.task_orders
ADD CONSTRAINT task_orders_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.tasks(id)
ON DELETE CASCADE;

-- 2. task_submissions: Drop and Recreate constraint with CASCADE
ALTER TABLE public.task_submissions
DROP CONSTRAINT IF EXISTS task_submissions_task_id_fkey;

ALTER TABLE public.task_submissions
ADD CONSTRAINT task_submissions_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.tasks(id)
ON DELETE CASCADE;

-- 3. task_reviews: Check (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'task_reviews'
    ) THEN
        ALTER TABLE public.task_reviews
        DROP CONSTRAINT IF EXISTS task_reviews_task_id_fkey;

        ALTER TABLE public.task_reviews
        ADD CONSTRAINT task_reviews_task_id_fkey
        FOREIGN KEY (task_id)
        REFERENCES public.tasks(id)
        ON DELETE CASCADE;
    END IF;
END $$;
