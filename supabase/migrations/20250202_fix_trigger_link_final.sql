-- Force update the notification trigger function to ensure links are correct
-- Run this script to fix the "View Details" link for ALL NEW OFFERS.

CREATE OR REPLACE FUNCTION notify_seller_on_offer()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seller_id uuid;
    v_item_title text;
    v_buyer_name text;
BEGIN
    -- Get Item & Seller Info
    SELECT seller_id, title INTO v_seller_id, v_item_title
    FROM marketplace_items WHERE id = NEW.item_id;

    -- Get Buyer Name
    SELECT full_name INTO v_buyer_name
    FROM profiles WHERE id = NEW.buyer_id;

    -- Insert Notification with CORRECT DEEP LINK
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        v_seller_id,
        'offer_received',
        'New Offer: ₹' || NEW.amount,
        v_buyer_name || ' made an offer on "' || v_item_title || '"',
        '/marketplace/' || NEW.item_id || '?action=manage_offers' -- DEEP LINK
    );

    RETURN NEW;
END;
$$;
