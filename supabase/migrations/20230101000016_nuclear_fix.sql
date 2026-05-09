-- FORCE FIX: Drop any potential constraint on status
ALTER TABLE marketplace_orders
DROP CONSTRAINT IF EXISTS marketplace_orders_status_check;

ALTER TABLE marketplace_orders
DROP CONSTRAINT IF EXISTS marketplace_orders_status_check_key;

-- Sanitize AGAIN just to be safe
UPDATE marketplace_orders
SET status = 'pending'
WHERE status IS NULL 
   OR status NOT IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped');

-- Apply constraint with a NEW name to avoid conflicts
-- and include all possible valid statuses
ALTER TABLE marketplace_orders
ADD CONSTRAINT marketplace_orders_status_check_v3
CHECK (status IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped'));
