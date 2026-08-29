-- ============================================================
-- FIX: "column reference seller_id is ambiguous" in process_marketplace_purchase
-- ============================================================

DROP FUNCTION IF EXISTS public.process_marketplace_purchase(UUID);

CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_item_id UUID)
RETURNS UUID AS $$
#variable_conflict use_variable
DECLARE
    v_item_title        TEXT;
    v_item_price        NUMERIC;
    v_item_status       TEXT;
    v_item_seller_id    UUID;
    v_buyer_id          UUID;
    v_order_id          UUID;
BEGIN
    -- 1. Get current authenticated user
    v_buyer_id := auth.uid();

    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Lock item row and read its fields into individual variables explicitly
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

    -- 4. Check buyer wallet balance
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = v_buyer_id
          AND p.wallet_balance >= v_item_price
    ) THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Please add funds to your wallet first.';
    END IF;

    -- 5. Deduct from buyer wallet
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - v_item_price
    WHERE id = v_buyer_id;

    -- 6. Mark item as sold
    UPDATE public.marketplace_items
    SET status = 'sold'
    WHERE id = p_item_id;

    -- 7. Create escrow order
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

    -- 8. Log buyer transaction
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.process_marketplace_purchase(UUID) TO authenticated;
