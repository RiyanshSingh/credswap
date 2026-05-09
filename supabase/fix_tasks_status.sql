-- FIX TASK STATUS CONSTRAINT
-- The error "violates check constraint tasks_status_check" means 'open' isn't allowed.
-- We will relax this constraint to allow our new statuses.

-- 1. Drop the restrictive constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. Add a new, broader constraint (supporting both old and new values)
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN (
    'open', 'Open', 
    'pending', 'Pending', 
    'assigned', 'Assigned', 
    'in_progress', 'In Progress', 
    'completed', 'Completed', 
    'disputed', 'Disputed',
    'cancelled', 'Cancelled'
));
