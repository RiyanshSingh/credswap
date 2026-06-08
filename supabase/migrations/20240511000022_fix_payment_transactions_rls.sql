-- Re-enable RLS on payment_transactions
-- Previously disabled in 20230101000011 for admin access,
-- but admin RPCs use SECURITY DEFINER which bypasses RLS anyway.
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Clean up all existing policies first to avoid duplicates
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.payment_transactions;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
FOR SELECT USING (auth.uid() = payment_transactions.user_id);

-- Users can insert their own transactions (used by RPC as fallback)
CREATE POLICY "Users can create own transactions" ON public.payment_transactions
FOR INSERT WITH CHECK (auth.uid() = payment_transactions.user_id);
