-- Centralized Payment/Transaction Ledger
-- Tracks all financial movements (Purchases, Sales, Refunds, Withdrawals)

-- 1. Create Ledger Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    category TEXT NOT NULL CHECK (category IN ('purchase', 'sale', 'refund', 'withdrawal', 'task_earning')),
    status TEXT NOT NULL DEFAULT 'completed',
    description TEXT,
    reference_id UUID, -- Optional link to orders or disputes
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

GRANT ALL ON public.payment_transactions TO authenticated;


-- 4. UPDATE FUNCTIONS TO LOG TRANSACTIONS

-- A. Update create_marketplace_order (Purchase Log)
CREATE OR REPLACE FUNCTION public.create_marketplace_order(item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    new_order_id UUID;
    buyer_balance NUMERIC;
BEGIN
    -- Get item details and lock row
    SELECT * INTO item_record FROM marketplace_items WHERE id = item_id FOR UPDATE;

    -- Check if valid
    IF item_record.status != 'approved' THEN
        RAISE EXCEPTION 'Item is not available for purchase';
    END IF;

    -- Create Order
    INSERT INTO marketplace_orders (item_id, buyer_id, seller_id, amount, status)
    VALUES (item_id, auth.uid(), item_record.seller_id, item_record.price, 'paid_escrow')
    RETURNING id INTO new_order_id;

    -- Mark Item as Reserved
    UPDATE marketplace_items SET status = 'reserved' WHERE id = item_id;

    -- LOG TRANSACTION: DEBIT BUYER
    -- Note: We are simulating that the user *had* wallet balance or paid externally.
    -- For this logic, we assume they paid into Escrow. 
    -- We record this as a "Purchase" transaction.
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        auth.uid(), 
        item_record.price, 
        'debit', 
        'purchase', 
        'completed', 
        'Purchase of ' || item_record.title, 
        new_order_id
    );

    RETURN new_order_id;
END;
$$;


-- B. Update release_funds (Sale Log)
CREATE OR REPLACE FUNCTION public.release_funds(order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- Get order
    SELECT * INTO order_record FROM public.marketplace_orders WHERE id = order_id FOR UPDATE;

    -- Checks
    IF order_record.status != 'completed' THEN
        RAISE EXCEPTION 'Order is not completed';
    END IF;

    IF order_record.funds_released = TRUE THEN
        RAISE EXCEPTION 'Funds already released';
    END IF;

    -- Transfer Funds to Seller Profile
    UPDATE public.profiles
    SET 
        total_earned = COALESCE(total_earned, 0) + order_record.amount,
        wallet_balance = COALESCE(wallet_balance, 0) + order_record.amount
    WHERE id = order_record.seller_id;

    -- Mark as Released
    UPDATE public.marketplace_orders
    SET funds_released = TRUE
    WHERE id = order_id;

    -- LOG TRANSACTION: CREDIT SELLER
    INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
    VALUES (
        order_record.seller_id,
        order_record.amount,
        'credit',
        'sale',
        'completed',
        'Sale earnings for Order #' || substring(order_id::text, 1, 8),
        order_id
    );

END;
$$;


-- C. Update resolve_dispute (Refund Log)
-- Note: Reusing the updated logic (Status 'approved') from previous step.
CREATE OR REPLACE FUNCTION public.resolve_dispute(
    p_dispute_id UUID,
    p_resolution_type TEXT -- 'refund' or 'release'
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
    -- Get Details
    SELECT order_id INTO v_order_id FROM public.marketplace_disputes WHERE id = p_dispute_id;
    SELECT amount, seller_id, buyer_id, item_id INTO v_order_amount, v_seller_id, v_buyer_id, v_item_id FROM public.marketplace_orders WHERE id = v_order_id;

    IF p_resolution_type = 'release' THEN
        -- Transfer to Seller
        UPDATE public.profiles
        SET 
            total_earned = COALESCE(total_earned, 0) + v_order_amount,
            wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount
        WHERE id = v_seller_id;

        -- Update Order
        UPDATE public.marketplace_orders 
        SET status = 'completed', funds_released = TRUE 
        WHERE id = v_order_id;

        -- LOG TRANSACTION: CREDIT SELLER (Sale)
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_seller_id, v_order_amount, 'credit', 'sale', 'completed', 'Dispute Resolved: Sale earnings released', v_order_id);

        -- Update Dispute
        UPDATE public.marketplace_disputes
        SET status = 'resolved_release'
        WHERE id = p_dispute_id;

    ELSIF p_resolution_type = 'refund' THEN
        -- Refund Buyer (Add to Buyer Wallet)
        UPDATE public.profiles
        SET wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount
        WHERE id = v_buyer_id;

        -- Update Order to Cancelled
        UPDATE public.marketplace_orders 
        SET status = 'cancelled'
        WHERE id = v_order_id;

        -- REACTIVATE ITEM (Approved)
        UPDATE public.marketplace_items
        SET status = 'approved'
        WHERE id = v_item_id;

        -- LOG TRANSACTION: CREDIT BUYER (Refund)
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_buyer_id, v_order_amount, 'credit', 'refund', 'completed', 'Dispute Resolved: Full Refund', v_order_id);

         -- Update Dispute
        UPDATE public.marketplace_disputes
        SET status = 'resolved_refund'
        WHERE id = p_dispute_id;
    END IF;
END;
$$;
