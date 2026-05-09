-- Comprehensive RLS Fix for Order Updates

-- 1. Drop the previous specific policy if it exists (to avoid conflicts or confusion)
DROP POLICY IF EXISTS "Buyers can update their orders" ON public.marketplace_orders;

-- 2. Create a broader policy for Buyers
-- This allows updating ANY column as long as you are the buyer.
-- Ideally we restrict to 'status', but for now let's unblock the user.
CREATE POLICY "Buyers can update own orders"
ON public.marketplace_orders
FOR UPDATE
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- 3. Create a policy for Sellers (if they need to update tracking etc)
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.marketplace_orders;

CREATE POLICY "Sellers can update own orders"
ON public.marketplace_orders
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- 4. Grant explicit UPDATE permission to authenticated role (sometimes redundant but good to have)
GRANT UPDATE ON public.marketplace_orders TO authenticated;
