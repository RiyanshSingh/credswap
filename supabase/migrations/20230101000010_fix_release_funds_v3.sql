-- Fix release_funds function v3: Use transaction_ref to correctly link buyer's transaction
DROP FUNCTION IF EXISTS release_funds;
CREATE OR REPLACE FUNCTION release_funds(order_id UUID)
RETURNS VOID AS $$
DECLARE
    ord RECORD;
BEGIN
    -- Get order details
    SELECT * INTO ord FROM marketplace_orders WHERE id = order_id;
    
    IF ord IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Update Order (Allow if paid_escrow OR already completed but funds not released)
    IF ord.funds_released THEN
         RAISE EXCEPTION 'Funds already released';
    END IF;

    UPDATE marketplace_orders 
    SET status = 'completed', funds_released = TRUE 
    WHERE id = order_id;

    -- Credit Seller Wallet
    UPDATE profiles 
    SET wallet_balance = wallet_balance + ord.amount 
    WHERE id = ord.seller_id;

    -- Create Transaction Record for Seller (Credit)
    INSERT INTO payment_transactions (
        user_id, 
        amount, 
        type, 
        status, 
        description, 
        reference_id, 
        category 
    )
    VALUES (
        ord.seller_id, 
        ord.amount, 
        'sale_credit', 
        'completed', 
        'Funds Released for Order #' || substring(order_id::text, 1, 8), 
        order_id::text, 
        'marketplace' 
    );

    -- NEW FIX: Update Buyer's Transaction Status to Completed
    -- We use ord.transaction_ref to find the specific payment transaction row ID
    IF ord.transaction_ref IS NOT NULL THEN
        UPDATE payment_transactions
        SET status = 'completed'
        WHERE id::text = ord.transaction_ref;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
