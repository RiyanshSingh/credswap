-- Keep existing projects safe if migration 20260829000001 was already applied.
-- Every column reference is qualified or copied into a distinct local variable.

CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item_title TEXT;
    v_item_price NUMERIC;
    v_item_status TEXT;
    v_item_seller_id UUID;
    v_buyer_id UUID := auth.uid();
    v_order_id UUID;
    v_buyer_balance NUMERIC;
BEGIN
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated. Please log in first.';
    END IF;

    SELECT mi.title, mi.price, mi.status, mi.seller_id
    INTO v_item_title, v_item_price, v_item_status, v_item_seller_id
    FROM public.marketplace_items AS mi
    WHERE mi.id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    IF v_item_status <> 'approved' THEN
        RAISE EXCEPTION 'Item is no longer available (status: %)', v_item_status;
    END IF;

    IF v_item_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'You cannot buy your own item';
    END IF;

    SELECT p.wallet_balance
    INTO v_buyer_balance
    FROM public.profiles AS p
    WHERE p.id = v_buyer_id
    FOR UPDATE;

    IF v_buyer_balance IS NULL OR v_buyer_balance < v_item_price THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Please add funds to your wallet first.';
    END IF;

    UPDATE public.profiles AS p
    SET wallet_balance = p.wallet_balance - v_item_price
    WHERE p.id = v_buyer_id;

    UPDATE public.marketplace_items AS mi
    SET status = 'sold'
    WHERE mi.id = p_item_id;

    INSERT INTO public.marketplace_orders (
        item_id, buyer_id, seller_id, amount, status, paid_at
    )
    VALUES (
        p_item_id, v_buyer_id, v_item_seller_id, v_item_price, 'pending_delivery', NOW()
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.payment_transactions (
        user_id, amount, type, status, description, reference_id, category
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

GRANT EXECUTE ON FUNCTION public.process_marketplace_purchase(UUID) TO authenticated;
