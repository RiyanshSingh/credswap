-- 1. Drop the potentially outdated/failing check constraint
ALTER TABLE marketplace_orders
DROP CONSTRAINT IF EXISTS marketplace_orders_status_check;

-- 2. Sanitize existing data
-- Update any rows with invalid statuses to 'pending' (safe default)
-- This ensures all rows satisfy the new check before we apply it.
UPDATE marketplace_orders
SET status = 'pending'
WHERE status IS NULL 
   OR status NOT IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped');

-- 3. Re-apply with all required statuses explicitly included
ALTER TABLE marketplace_orders
ADD CONSTRAINT marketplace_orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped'));
