-- Function to safely buy an item
-- Checks if item is 'approved', then updates to 'sold'.
-- Returns true if successful, false if already sold or not found.

CREATE OR REPLACE FUNCTION buy_marketplace_item(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (admin) to bypass RLS for the UPDATE (since buyer isn't owner)
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
        -- Item not available
        RETURN FALSE;
    END IF;
END;
$$;
