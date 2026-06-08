-- Allow authenticated users to create (insert) their own payment transactions
-- This is required for the "Buy Now" flow where the client inserts the record.

DROP POLICY IF EXISTS "Users can create own transactions" ON payment_transactions;
CREATE POLICY "Users can create own transactions" ON payment_transactions FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending' -- Security: User can only create 'pending' transactions
);

-- Ensure marketplace_orders also allows inserts (just in case)
-- Use 'IF NOT EXISTS' logic by attempting to drop first or using DO block, 
-- but simpler is to just add it and let it fail if exists or use a unique name.
-- To be safe, we will just ensure it exists.


DROP POLICY IF EXISTS "Users can create orders" ON marketplace_orders;
CREATE POLICY "Users can create orders" ON marketplace_orders FOR INSERT
WITH CHECK (
    auth.uid() = buyer_id
);

DROP POLICY IF EXISTS "Users can view their own orders" ON marketplace_orders;
CREATE POLICY "Users can view their own orders" ON marketplace_orders FOR SELECT
USING (
    auth.uid() = marketplace_orders.buyer_id OR 
    auth.uid() = marketplace_orders.seller_id
);
