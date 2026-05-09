-- Run this in your Supabase SQL Editor to enable the "Buy Now" feature

-- 1. Create the Secure Buying Function
CREATE OR REPLACE FUNCTION public.buy_marketplace_item(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to allow updating "sold" status
AS $$
DECLARE
    item_status TEXT;
BEGIN
    -- Check current status
    SELECT status INTO item_status FROM marketplace_items WHERE id = item_id;

    IF item_status = 'approved' THEN
        -- Update to sold
        UPDATE marketplace_items SET status = 'sold' WHERE id = item_id;
        RETURN TRUE;
    ELSE
        -- Item not available (already sold or pending)
        RETURN FALSE;
    END IF;
END;
$$;

-- 2. Grant Permissions so the App can call it
GRANT EXECUTE ON FUNCTION public.buy_marketplace_item(uuid) TO anon, authenticated, service_role;

-- 3. Refresh the API Cache to make it visible immediately
NOTIFY pgrst, 'reload schema';
