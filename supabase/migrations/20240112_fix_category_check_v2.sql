-- 1. Drop the failing constraint first
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_category_check;

-- 2. Sanitize existing data
-- Update any rows with NULL category or invalid categories to 'marketplace' (safe default)
UPDATE payment_transactions
SET category = 'marketplace'
WHERE category IS NULL 
   OR category NOT IN ('deposit', 'withdrawal', 'purchase', 'refund', 'marketplace', 'task');

-- 3. Now it is safe to add the constraint back
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_category_check 
CHECK (category IN ('deposit', 'withdrawal', 'purchase', 'refund', 'marketplace', 'task'));
