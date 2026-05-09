-- 1. Drop the potentially outdated/failing check constraint
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_type_check;

-- 2. Sanitize existing data
-- Update any rows with invalid types to 'purchase' (safe default for now)
UPDATE payment_transactions
SET type = 'purchase'
WHERE type IS NULL 
   OR type NOT IN ('deposit', 'withdrawal', 'purchase', 'sale_credit', 'refund', 'fee', 'transfer');

-- 3. Re-apply with all required types explicitly included
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale_credit', 'refund', 'fee', 'transfer'));
