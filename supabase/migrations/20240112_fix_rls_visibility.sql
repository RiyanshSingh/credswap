-- Disable RLS on payment_transactions to allow Admin Dashboard visibility
-- This is necessary because Admin uses local-auth and cannot pass RLS checks.
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
