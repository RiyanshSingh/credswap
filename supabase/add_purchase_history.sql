-- Add buyer_id column to marketplace_items if it doesn't exist
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES profiles(id);

-- Update the secure buying function to record the buyer
CREATE OR REPLACE FUNCTION public.buy_marketplace_item(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_status TEXT;
    buyer_uid UUID;
BEGIN
    -- Get current user ID
    buyer_uid := auth.uid();

    -- Check current status
    SELECT status INTO item_status FROM marketplace_items WHERE id = item_id;

    IF item_status = 'approved' THEN
        -- Update to sold AND set buyer_id
        UPDATE marketplace_items 
        SET status = 'sold', 
            buyer_id = buyer_uid 
        WHERE id = item_id;
        
        RETURN TRUE;
    ELSE
        -- Item not available
        RETURN FALSE;
    END IF;
END;
$$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
