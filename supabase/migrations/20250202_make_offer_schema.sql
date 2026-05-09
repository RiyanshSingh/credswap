-- ==========================================
-- MARKETPLACE OFFERS & NOTIFICATIONS SCHEMA
-- ==========================================

-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'offer_received', 'offer_accepted', 'offer_rejected', 'system'
    title text NOT NULL,
    message text NOT NULL,
    link text, -- URL to redirect to (e.g. /listing/xyz)
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Create Marketplace Offers Table
CREATE TABLE IF NOT EXISTS marketplace_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE,
    buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- RLS for Offers
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;

-- Buyer can create offers
DROP POLICY IF EXISTS "Buyers can create offers" ON marketplace_offers;
CREATE POLICY "Buyers can create offers"
ON marketplace_offers FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Buyer can view their own offers
DROP POLICY IF EXISTS "Buyers can view own offers" ON marketplace_offers;
CREATE POLICY "Buyers can view own offers"
ON marketplace_offers FOR SELECT
USING (auth.uid() = buyer_id);

-- Seller can view offers on their items
DROP POLICY IF EXISTS "Sellers can view offers on their items" ON marketplace_offers;
CREATE POLICY "Sellers can view offers on their items"
ON marketplace_offers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM marketplace_items mi
        WHERE mi.id = item_id AND mi.seller_id = auth.uid()
    )
);

-- Seller can update status (Accept/Reject)
DROP POLICY IF EXISTS "Sellers can update offers on their items" ON marketplace_offers;
CREATE POLICY "Sellers can update offers on their items"
ON marketplace_offers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM marketplace_items mi
        WHERE mi.id = item_id AND mi.seller_id = auth.uid()
    )
);

-- 3. Notification Triggers

-- Trigger Function: Notify Seller on New Offer
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

    -- Insert Notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        v_seller_id,
        'offer_received',
        'New Offer: ₹' || NEW.amount,
        v_buyer_name || ' made an offer on "' || v_item_title || '"',
        '/marketplace/' || NEW.item_id || '?action=manage_offers' -- Redirect to listing with auto-open
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_offer_created
AFTER INSERT ON marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION notify_seller_on_offer();

-- Trigger Function: Notify Buyer on Status Change
CREATE OR REPLACE FUNCTION notify_buyer_on_offer_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item_title text;
BEGIN
    -- Only notify if status changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get Item Title
    SELECT title INTO v_item_title
    FROM marketplace_items WHERE id = NEW.item_id;

    -- Insert Notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        NEW.buyer_id,
        'offer_' || NEW.status, -- offer_accepted / offer_rejected
        'Offer ' || INITCAP(NEW.status),
        'Your offer for "' || v_item_title || '" was ' || NEW.status,
        '/marketplace/' || NEW.item_id
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_offer_status_change
AFTER UPDATE ON marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION notify_buyer_on_offer_update();
