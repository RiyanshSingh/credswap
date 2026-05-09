-- ==========================================
-- FIX DELETE CASCADE (Conversations & Messages)
-- ==========================================

CREATE OR REPLACE FUNCTION admin_delete_marketplace_item(p_item_id uuid, p_username text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_ids uuid[];
BEGIN
    -- 1. Verify Admin Credentials
    IF NOT EXISTS (SELECT 1 FROM admin_credentials ac WHERE ac.username = p_username AND ac.password = p_password) THEN
        RAISE EXCEPTION 'Invalid Admin Credentials';
    END IF;

    -- 2. Clean up Conversations & Messages
    -- Get conversation IDs related to this item
    SELECT array_agg(id) INTO v_conversation_ids
    FROM conversations
    WHERE item_id = p_item_id;

    IF v_conversation_ids IS NOT NULL THEN
        -- Delete messages in these conversations
        DELETE FROM messages
        WHERE conversation_id = ANY(v_conversation_ids);

        -- Delete the conversations themselves
        DELETE FROM conversations
        WHERE id = ANY(v_conversation_ids);
    END IF;

    -- 3. Delete Notifications (Best effort, assuming jsonb or relation)
    -- If there's a notifications table referencing item_id directly:
    -- DELETE FROM notifications WHERE item_id = p_item_id;
    -- (Skipping specific notification delete unless schema is known, usually strict FKs are the blocker)

    -- 4. Delete the Marketplace Item
    DELETE FROM marketplace_items
    WHERE id = p_item_id;

END;
$$;

-- Grant permissions again just to be safe
GRANT EXECUTE ON FUNCTION admin_delete_marketplace_item(uuid, text, text) TO anon, authenticated, postgres, service_role;
