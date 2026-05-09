-- Fix Notification Data and Constraint
-- 1. Clean up existing invalid data
-- We set any type that isn't in our allowed list to 'info' to satisfy the constraint we want to add.
UPDATE public.notifications 
SET type = 'info' 
WHERE type NOT IN ('info', 'success', 'warning', 'error') 
   OR type IS NULL;

-- 2. Drop existing constraint if it exists (to be safe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
    END IF;
END $$;

-- 3. Add the constraint
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error'));
