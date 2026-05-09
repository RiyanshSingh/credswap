-- 1. Add Wallet to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- 2. Create Payment Transactions Table (The Ledger)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale_credit', 'refund')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
    reference_id TEXT, -- E.g. Order ID, or UPI Ref ID
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Only System/Admin can insert/update (Technically via RPC or Service Role is safer, but for now allow strict inserts if needed)
-- For safety, we often rely on Database Functions (RPC) to touch wallets to prevent client-side manipulation.

-- 3. Create Disputes Table
CREATE TABLE IF NOT EXISTS marketplace_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES marketplace_orders(id) NOT NULL,
    raised_by UUID REFERENCES profiles(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_refund', 'resolved_seller', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view disputes they are involved in" ON marketplace_disputes;
CREATE POLICY "Users can view disputes they are involved in" ON marketplace_disputes FOR SELECT 
USING (
    auth.uid() = raised_by OR 
    EXISTS (
        SELECT 1 FROM marketplace_orders mo 
        WHERE mo.id = marketplace_disputes.order_id 
        AND (mo.buyer_id = auth.uid() OR mo.seller_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can raise disputes" ON marketplace_disputes;
CREATE POLICY "Users can raise disputes" ON marketplace_disputes FOR INSERT 
WITH CHECK (auth.uid() = raised_by);

-- 4. Update Marketplace Orders
-- We need to track if funds were released.
ALTER TABLE marketplace_orders 
ADD COLUMN IF NOT EXISTS funds_released BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transaction_ref TEXT; -- To store the Payment Proof ID

-- 5. RPC Function: Request Withdrawal (Safe way to interact with wallet)

DROP FUNCTION IF EXISTS request_withdrawal;
CREATE OR REPLACE FUNCTION request_withdrawal(amount DECIMAL, method TEXT, details TEXT)
RETURNS VOID AS $$
DECLARE
    current_bal DECIMAL;
BEGIN
    -- Check balance
    SELECT wallet_balance INTO current_bal FROM profiles WHERE id = auth.uid();
    
    IF current_bal < amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- Deduct from wallet (Hold it)
    UPDATE profiles SET wallet_balance = wallet_balance - amount WHERE id = auth.uid();

    -- Create Transaction Record
    INSERT INTO payment_transactions (user_id, amount, type, status, description, reference_id)
    VALUES (auth.uid(), amount, 'withdrawal', 'pending', 'Withdrawal Request via ' || method || ': ' || details, request_withdrawal.details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
