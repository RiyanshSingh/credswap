-- ============================================================
-- FIX: Remove invalid updated_at column from marketplace_items
-- ============================================================

DROP FUNCTION IF EXISTS public.process_marketplace_purchase(UUID);

CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_item_id UUID)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_variable
DECLARE
    v_item_title        TEXT;
    v_item_price        NUMERIC;
    v_item_status       TEXT;
    v_item_seller_id    UUID;
    v_buyer_id          UUID;
    v_order_id          UUID;
    v_buyer_balance     NUMERIC;
BEGIN
    -- 1. Authenticated user
    v_buyer_id := auth.uid();
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated. Please log in first.';
    END IF;

    -- 2. Lock item row
    SELECT
        mi.title,
        mi.price,
        mi.status,
        mi.seller_id
    INTO
        v_item_title,
        v_item_price,
        v_item_status,
        v_item_seller_id
    FROM public.marketplace_items mi
    WHERE mi.id = p_item_id
    FOR UPDATE;

    -- 3. Validate item
    IF v_item_title IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    IF v_item_status != 'approved' THEN
        RAISE EXCEPTION 'Item is no longer available (status: %)', v_item_status;
    END IF;

    IF v_item_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'You cannot buy your own item';
    END IF;

    -- 4. Check buyer balance
    SELECT p.wallet_balance INTO v_buyer_balance
    FROM public.profiles p
    WHERE p.id = v_buyer_id;

    IF v_buyer_balance IS NULL OR v_buyer_balance < v_item_price THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Please add funds to your wallet first.';
    END IF;

    -- 5. Deduct from buyer
    UPDATE public.profiles p
    SET wallet_balance = p.wallet_balance - v_item_price
    WHERE p.id = v_buyer_id;

    -- 6. Mark item sold (without updated_at)
    UPDATE public.marketplace_items mi
    SET status = 'sold', buyer_id = v_buyer_id
    WHERE mi.id = p_item_id;

    -- 7. Insert escrow order
    INSERT INTO public.marketplace_orders (
        item_id,
        buyer_id,
        seller_id,
        amount,
        status,
        paid_at
    )
    VALUES (
        p_item_id,
        v_buyer_id,
        v_item_seller_id,
        v_item_price,
        'pending_delivery',
        NOW()
    )
    RETURNING id INTO v_order_id;

    -- 8. Transaction log
    INSERT INTO public.payment_transactions (
        user_id,
        amount,
        type,
        status,
        description,
        reference_id,
        category
    )
    VALUES (
        v_buyer_id,
        v_item_price,
        'purchase',
        'completed',
        'Purchase: ' || v_item_title,
        v_order_id::TEXT,
        'marketplace'
    );

    RETURN v_order_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_marketplace_purchase(UUID) TO authenticated;
