-- Trigger to Update Seller Earnings AND Item Status on Order Completion

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if status changed to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- A. Update the Seller's Profile (Earnings)
        UPDATE public.profiles
        SET 
            total_earned = COALESCE(total_earned, 0) + NEW.amount,
            wallet_balance = COALESCE(wallet_balance, 0) + NEW.amount
        WHERE id = NEW.seller_id;

        -- B. Update the Item Status to 'sold' (so it moves out of 'reserved')
        UPDATE public.marketplace_items
        SET status = 'sold'
        WHERE id = NEW.item_id;

    END IF;
    RETURN NEW;
END;
$$;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_order_complete ON public.marketplace_orders;

CREATE TRIGGER on_order_complete
AFTER UPDATE ON public.marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_completion();
