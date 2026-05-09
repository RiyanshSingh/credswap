-- 1. Update Check Constraint to allow 'removed_by_admin'
ALTER TABLE public.lost_found_items 
DROP CONSTRAINT IF EXISTS lost_found_items_status_check;

ALTER TABLE public.lost_found_items 
ADD CONSTRAINT lost_found_items_status_check 
CHECK (status IN ('open', 'resolved', 'removed_by_admin'));

-- 2. Update Admin Delete RPC for Soft Delete + Notification
CREATE OR REPLACE FUNCTION public.admin_delete_lost_found_item(
    p_item_id UUID,
    p_username TEXT,
    p_password TEXT -- Verification still required
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_item_owner_id UUID;
    v_item_title TEXT;
BEGIN
    -- Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- Get Item Details BEFORE update
    SELECT user_id, title INTO v_item_owner_id, v_item_title 
    FROM public.lost_found_items 
    WHERE id = p_item_id;

    IF v_item_owner_id IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    -- Soft Delete: Update status to 'removed_by_admin'
    UPDATE public.lost_found_items 
    SET status = 'removed_by_admin'
    WHERE id = p_item_id;

    -- Send Notification to User
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        v_item_owner_id,
        'Listing Removed by Admin',
        'Your lost & found listing "' || v_item_title || '" has been removed by the administrator.',
        'destructive',
        '/lost-and-found/' || p_item_id -- User can still view details if we allow it in RLS
    );
END;
$$;

-- 3. Update Status RPC (Optional: to notify on resolve too)
CREATE OR REPLACE FUNCTION public.admin_update_lost_found_status(
    p_item_id UUID,
    p_status TEXT,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_item_owner_id UUID;
    v_item_title TEXT;
BEGIN
    -- Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

     -- Get Item Details
    SELECT user_id, title INTO v_item_owner_id, v_item_title 
    FROM public.lost_found_items 
    WHERE id = p_item_id;

    -- Update Item
    UPDATE public.lost_found_items 
    SET status = p_status
    WHERE id = p_item_id;

    -- Notify User if Resolved
    IF p_status = 'resolved' THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_item_owner_id,
            'Listing Resolved',
            'Your listing "' || v_item_title || '" has been marked as resolved.',
            'success',
            '/lost-and-found/' || p_item_id
        );
    END IF;
END;
$$;
