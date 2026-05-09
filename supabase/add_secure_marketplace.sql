-- Secure Marketplace Schema Upgrade

-- 1. Create Orders Table (Tracks the transaction lifecycle)
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.marketplace_items(id) NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'paid_escrow', 'delivered', 'completed', 'disputed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Disputes Table (For conflict resolution)
CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.marketplace_orders(id) NOT NULL,
    raised_by UUID REFERENCES public.profiles(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved_refund', 'resolved_release')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Orders: Users can see their own orders (as buyer or seller)
CREATE POLICY "Users can view their own orders" ON public.marketplace_orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Disputes: Users can see disputes they are part of
CREATE POLICY "Users can view their own disputes" ON public.marketplace_disputes
    FOR SELECT USING (auth.uid() = raised_by);

-- 5. RPC Function: Create Secure Order
-- Replaces the simple 'buy_marketplace_item'
CREATE OR REPLACE FUNCTION public.create_marketplace_order(item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    new_order_id UUID;
BEGIN
    -- Get item details and lock row
    SELECT * INTO item_record FROM marketplace_items WHERE id = item_id FOR UPDATE;

    -- Check if valid
    IF item_record.status != 'approved' THEN
        RAISE EXCEPTION 'Item is not available for purchase';
    END IF;

    -- Create Order
    INSERT INTO marketplace_orders (item_id, buyer_id, seller_id, amount, status)
    VALUES (item_id, auth.uid(), item_record.seller_id, item_record.price, 'paid_escrow') -- Simulate immediate payment to escrow
    RETURNING id INTO new_order_id;

    -- Mark Item as Reserved (so no one else buys it)
    UPDATE marketplace_items SET status = 'reserved' WHERE id = item_id;

    RETURN new_order_id;
END;
$$;

-- Grant permissions
GRANT ALL ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.marketplace_disputes TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_marketplace_order(uuid) TO authenticated;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
