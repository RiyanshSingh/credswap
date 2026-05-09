-- 1. Function to notify all users when a new lost/found item is listed
CREATE OR REPLACE FUNCTION notify_all_on_lost_found_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for every user in the profiles table
    -- except for the user who posted the item
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT 
        p.id, 
        CASE WHEN NEW.type = 'lost' THEN '📢 New Lost Item' ELSE '📢 New Found Item' END,
        'A new ' || NEW.type || ' item has been listed: ' || NEW.title || ' at ' || NEW.location,
        'info',
        '/lost-and-found/' || NEW.id
    FROM profiles p
    WHERE p.id != NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to execute the function after a new item is inserted
DROP TRIGGER IF EXISTS on_lost_found_item_notification ON lost_found_items;
CREATE TRIGGER on_lost_found_item_notification
AFTER INSERT ON lost_found_items
FOR EACH ROW EXECUTE PROCEDURE notify_all_on_lost_found_item();

-- 3. Enable realtime for notifications table to ensure instant delivery
-- Note: If this fails, it might already be added. You can skip it.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
