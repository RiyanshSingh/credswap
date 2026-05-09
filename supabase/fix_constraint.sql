-- Fix for "violates check constraint marketplace_items_status_check"
-- The 'reserved' status (and potentially 'active' or others) was missing.

-- 1. Drop the old constraint
ALTER TABLE public.marketplace_items 
DROP CONSTRAINT IF EXISTS marketplace_items_status_check;

-- 2. Add the updated constraint including 'reserved'
ALTER TABLE public.marketplace_items 
ADD CONSTRAINT marketplace_items_status_check 
CHECK (status IN ('pending', 'approved', 'sold', 'rejected', 'reserved'));
