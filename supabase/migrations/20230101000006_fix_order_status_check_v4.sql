-- FIX V4: Add 'paid_escrow' to the allowed statuses
ALTER TABLE marketplace_orders
DROP CONSTRAINT IF EXISTS marketplace_orders_status_check_v3;

-- Sanitize just in case
UPDATE marketplace_orders
SET status = 'pending'
WHERE status IS NULL 
   OR status NOT IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped', 'paid_escrow');

-- Apply constraint with a NEW name v4
ALTER TABLE marketplace_orders
ADD CONSTRAINT marketplace_orders_status_check_v4
CHECK (status IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped', 'paid_escrow'));
