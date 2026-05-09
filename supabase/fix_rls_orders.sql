-- Fix for Confirm Delivery (RLS Policy for UPDATE)

-- Allow buyers to update their orders (specifically to mark as completed/delivered)
CREATE POLICY "Buyers can update their orders" 
ON public.marketplace_orders 
FOR UPDATE 
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- Also allow Admin (if needed, but usually Admin bypasses RLS if using service role, or needs explicit policy)
-- For now, ensuring buyers can confirm delivery is the priority.
