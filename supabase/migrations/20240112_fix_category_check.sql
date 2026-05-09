-- Drop the restrictive check constraint on category
-- It seems the existing check does not include 'marketplace'
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_category_check;

-- Optional: Add a new, more inclusive check if desired, or leave it open.
-- For now, let's just add a new one that definitely includes 'marketplace'
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_category_check 
CHECK (category IN ('deposit', 'withdrawal', 'purchase', 'refund', 'marketplace', 'task'));
