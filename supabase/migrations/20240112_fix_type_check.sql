-- Drop potentially outdated check constraint
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_type_check;

-- Re-apply with all required types explicitly included
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale_credit', 'refund', 'fee', 'transfer'));
