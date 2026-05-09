-- Fix Notification Type Constraint
-- The existing table has a constraint that rejects our types. We will reset it.

DO $$
BEGIN
    -- 1. Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
    END IF;

    -- 2. Add correct constraint
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('info', 'success', 'warning', 'error'));
    
END $$;
