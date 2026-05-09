-- Add Dedicated Earnings Table
-- Separate table to track user financial state (Balances)

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.user_earnings (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    total_earned NUMERIC DEFAULT 0,
    pending_amount NUMERIC DEFAULT 0,
    withdrawable_balance NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own earnings" ON public.user_earnings;
CREATE POLICY "Users can view own earnings" ON public.user_earnings
    FOR SELECT USING (auth.uid() = user_id);

GRANT ALL ON public.user_earnings TO authenticated;

-- 3. MIGRATION: Populate with existing data
-- A. Insert all profiles
INSERT INTO public.user_earnings (user_id, total_earned, withdrawable_balance)
SELECT id, COALESCE(total_earned, 0), COALESCE(wallet_balance, 0)
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- B. Calculate and Update Pending Amounts
-- Pending = Sum of orders where seller = user AND funds_released = false AND status NOT IN ('cancelled', 'created')
-- ('created' shouldn't count as pending yet until paid, but 'paid_escrow' does)
UPDATE public.user_earnings ue
SET pending_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.marketplace_orders mo
    WHERE mo.seller_id = ue.user_id
    AND mo.funds_released = FALSE
    AND mo.status IN ('paid_escrow', 'delivered', 'completed', 'disputed') 
    -- 'completed' + funds_released=false means held in escrow window
);


-- 4. UPDATE FUNCTIONS TO SYNC THIS TABLE

-- A. Update create_marketplace_order
-- Triggers: +Pending for Seller, (Ledger Log handled separately or here? Keeping existing ledger logic is fine)
CREATE OR REPLACE FUNCTION public.create_marketplace_order(item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    new_order_id UUID;
BEGIN
    SELECT * INTO item_record FROM marketplace_items WHERE id = item_id FOR UPDATE;

    IF item_record.status != 'approved' THEN
        RAISE EXCEPTION 'Item is not available for purchase';
    END IF;

    INSERT INTO marketplace_orders (item_id, buyer_id, seller_id, amount, status)
    VALUES (item_id, auth.uid(), item_record.seller_id, item_record.price, 'paid_escrow')
    RETURNING id INTO new_order_id;

    UPDATE marketplace_items SET status = 'reserved' WHERE id = item_id;

    -- SYNC EARNINGS: +Pending for Seller
    INSERT INTO public.user_earnings (user_id, pending_amount)
    VALUES (item_record.seller_id, item_record.price)
    ON CONFLICT (user_id) 
    DO UPDATE SET pending_amount = user_earnings.pending_amount + item_record.price;

    -- (Ledger Log preserved from previous script if run, else we add it here? 
    -- To allow independent running, I will re-add ledger insert if table exists, or skip. 
    -- actually, standard practice is to overwrite the function fully. I will include the Ledger Insert if appropriate, 
    -- but user might not have run the previous script.
    -- Safest is to overwrite with the SUPERSET of logic (Ledger + Earnings).
    -- I will assume Ledger Table exists as I just created it.
    
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (auth.uid(), item_record.price, 'debit', 'purchase', 'completed', 'Purchase of ' || item_record.title, new_order_id);

    RETURN new_order_id;
END;
$$;


-- B. Update release_funds
CREATE OR REPLACE FUNCTION public.release_funds(order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record RECORD;
BEGIN
    SELECT * INTO order_record FROM public.marketplace_orders WHERE id = order_id FOR UPDATE;

    IF order_record.status != 'completed' THEN
        RAISE EXCEPTION 'Order is not completed';
    END IF;
    IF order_record.funds_released = TRUE THEN
        RAISE EXCEPTION 'Funds already released';
    END IF;

    -- Update Profiles (Legacy/Backup)
    UPDATE public.profiles
    SET total_earned = COALESCE(total_earned, 0) + order_record.amount,
        wallet_balance = COALESCE(wallet_balance, 0) + order_record.amount
    WHERE id = order_record.seller_id;

    -- Sync Earnings Table: -Pending, +Total, +Withdrawable
    UPDATE public.user_earnings
    SET pending_amount = pending_amount - order_record.amount,
        total_earned = total_earned + order_record.amount,
        withdrawable_balance = withdrawable_balance + order_record.amount
    WHERE user_id = order_record.seller_id;

    UPDATE public.marketplace_orders SET funds_released = TRUE WHERE id = order_id;

    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (order_record.seller_id, order_record.amount, 'credit', 'sale', 'completed', 'Sale earnings released', order_id);
END;
$$;


-- C. Update resolve_dispute
CREATE OR REPLACE FUNCTION public.resolve_dispute(
    p_dispute_id UUID,
    p_resolution_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_amount NUMERIC;
    v_seller_id UUID;
    v_buyer_id UUID;
    v_item_id UUID;
BEGIN
    SELECT order_id INTO v_order_id FROM public.marketplace_disputes WHERE id = p_dispute_id;
    SELECT amount, seller_id, buyer_id, item_id INTO v_order_amount, v_seller_id, v_buyer_id, v_item_id FROM public.marketplace_orders WHERE id = v_order_id;

    IF p_resolution_type = 'release' THEN
        -- Profiles Update
        UPDATE public.profiles
        SET total_earned = COALESCE(total_earned, 0) + v_order_amount,
            wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount
        WHERE id = v_seller_id;

        -- Earnings Update: -Pending, +Total, +Withdrawable
        UPDATE public.user_earnings
        SET pending_amount = pending_amount - v_order_amount,
            total_earned = total_earned + v_order_amount,
            withdrawable_balance = withdrawable_balance + v_order_amount
        WHERE user_id = v_seller_id;

        UPDATE public.marketplace_orders SET status = 'completed', funds_released = TRUE WHERE id = v_order_id;
        
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_seller_id, v_order_amount, 'credit', 'sale', 'completed', 'Dispute Resolved: Released', v_order_id);

        UPDATE public.marketplace_disputes SET status = 'resolved_release' WHERE id = p_dispute_id;

    ELSIF p_resolution_type = 'refund' THEN
        -- Refund Buyer (Profiles)
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount WHERE id = v_buyer_id;

        -- Refund Buyer (Earnings Table)
        INSERT INTO public.user_earnings (user_id, withdrawable_balance)
        VALUES (v_buyer_id, v_order_amount)
        ON CONFLICT (user_id) DO UPDATE SET withdrawable_balance = user_earnings.withdrawable_balance + v_order_amount;

        -- Remove from Seller Pending
        UPDATE public.user_earnings
        SET pending_amount = pending_amount - v_order_amount
        WHERE user_id = v_seller_id;

        UPDATE public.marketplace_orders SET status = 'cancelled' WHERE id = v_order_id;
        UPDATE public.marketplace_items SET status = 'approved' WHERE id = v_item_id;

        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_buyer_id, v_order_amount, 'credit', 'refund', 'completed', 'Dispute Resolved: Refund', v_order_id);

        UPDATE public.marketplace_disputes SET status = 'resolved_refund' WHERE id = p_dispute_id;
    END IF;
END;
$$;
