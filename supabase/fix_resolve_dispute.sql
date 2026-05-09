-- Fix resolve_dispute to allow authenticated Admin execution (via credentials)

CREATE OR REPLACE FUNCTION public.resolve_dispute(
    p_dispute_id UUID,
    p_resolution_type TEXT, -- 'refund' or 'release'
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_order_id UUID;
    v_order_amount NUMERIC;
    v_seller_id UUID;
    v_buyer_id UUID;
    v_item_id UUID;
BEGIN
    -- 1. Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- 2. Get Details
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

-- Allow Anon/Auth execution (since Admin is simulated)
GRANT EXECUTE ON FUNCTION public.resolve_dispute(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
