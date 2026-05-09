-- 48-Hour Escrow Window Implementation

-- 1. Add columns to track completion time and fund status
ALTER TABLE public.marketplace_orders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funds_released BOOLEAN DEFAULT FALSE;

-- 2. RESET the Trigger Logic to STOP automatic payout
-- We modify the existing function 'handle_order_completion'
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if status changed to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- A. Mark as Completed but DO NOT Release Funds yet
        -- We update the order row itself (careful of recursion, but this is a BEFORE or AFTER trigger? It was AFTER)
        -- Since it's AFTER update, we can't efficiently update NEW here without another UPDATE query.
        -- Ideally, the update that SET status='completed' should also SET completed_at=NOW().
        -- But for safety, we'll do a separate update or rely on the application to set it.
        -- ACTUALLY: Let's do a separate UPDATE to set completed_at if it's null.
        UPDATE public.marketplace_orders 
        SET completed_at = now() 
        WHERE id = NEW.id AND completed_at IS NULL;

        -- B. Update the Item Status to 'sold' (Item is physically delivered)
        UPDATE public.marketplace_items
        SET status = 'sold'
        WHERE id = NEW.item_id;

        -- C. DO NOT Update Wallet Balance here anymore. 
        -- Funds remain in the "Pending" state (since funds_released is false).

    END IF;
    RETURN NEW;
END;
$$;

-- 3. Create RPC to Release Funds (Manual by Admin or Auto by Script)
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

    -- Transfer Funds
    UPDATE public.profiles
    SET 
        total_earned = COALESCE(total_earned, 0) + order_record.amount,
        wallet_balance = COALESCE(wallet_balance, 0) + order_record.amount
    WHERE id = order_record.seller_id;

    -- Mark as Released
    UPDATE public.marketplace_orders
    SET funds_released = TRUE
    WHERE id = order_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.release_funds(uuid) TO authenticated;
