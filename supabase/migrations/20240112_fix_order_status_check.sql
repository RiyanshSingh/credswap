-- Drop outdated status check
ALTER TABLE marketplace_orders
DROP CONSTRAINT IF EXISTS marketplace_orders_status_check;

-- Re-apply with 'payment_pending' included
-- Common statuses: pending, completed, cancelled, payment_pending, paid, delivered, disputed
ALTER TABLE marketplace_orders
ADD CONSTRAINT marketplace_orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'payment_pending', 'paid', 'delivered', 'disputed', 'shipped'));
