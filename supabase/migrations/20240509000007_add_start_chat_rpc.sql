-- Create start_chat RPC function to initiate conversations
DROP FUNCTION IF EXISTS public.start_chat(uuid, uuid);

CREATE OR REPLACE FUNCTION public.start_chat(p_other_user_id uuid, p_item_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id uuid;
    v_user_id uuid := auth.uid();
BEGIN
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Prevent self-chat
    IF v_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot start a chat with yourself';
    END IF;

    -- Look for an existing conversation
    IF p_item_id IS NOT NULL THEN
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE item_id = p_item_id
          AND ((participant1_id = v_user_id AND participant2_id = p_other_user_id)
            OR (participant1_id = p_other_user_id AND participant2_id = v_user_id))
        LIMIT 1;
    ELSE
        SELECT id INTO v_conversation_id
        FROM public.conversations
        WHERE item_id IS NULL
          AND ((participant1_id = v_user_id AND participant2_id = p_other_user_id)
            OR (participant1_id = p_other_user_id AND participant2_id = v_user_id))
        LIMIT 1;
    END IF;

    -- Create new conversation if none exists
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (
            participant1_id, 
            participant2_id, 
            item_id, 
            last_message_at
        )
        VALUES (
            v_user_id, 
            p_other_user_id, 
            p_item_id, 
            NOW()
        )
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_chat(uuid, uuid) TO authenticated;
