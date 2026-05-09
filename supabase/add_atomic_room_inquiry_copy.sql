-- Atomic RPC for Room Inquiry
-- 1. Creates/Gets Conversation
-- 2. Sends Auto-Message
-- 3. Notifies Owner
CREATE OR REPLACE FUNCTION public.create_room_inquiry(
    p_room_id UUID,
    p_owner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_room_title TEXT;
    v_sender_name TEXT;
    v_msg_content TEXT;
BEGIN
    -- 1. Get Room & Sender Details
    SELECT title INTO v_room_title FROM public.rooms WHERE id = p_room_id;
    SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = auth.uid();
    
    -- 2. Get or Create Conversation (Reuse existing logic or call start_chat)
    -- We can call the existing start_chat function
    v_conversation_id := public.start_chat(p_owner_id);

    -- 3. Insert Auto-Message (Only if not already sent recently? No, always send for new inquiry click)
    v_msg_content := 'Hi, I am interested in your room listing: ' || v_room_title;

    -- Check if this specific message was just sent to avoid duplicates (optional, but good for UX)
    IF NOT EXISTS (
        SELECT 1 FROM public.messages 
        WHERE conversation_id = v_conversation_id 
        AND sender_id = auth.uid() 
        AND content = v_msg_content
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
        INSERT INTO public.messages (conversation_id, sender_id, content)
        VALUES (v_conversation_id, auth.uid(), v_msg_content);

        -- Update conversation last_message
        UPDATE public.conversations 
        SET last_message = v_msg_content, last_message_at = NOW()
        WHERE id = v_conversation_id;
    END IF;

    -- 4. Notify Owner
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        p_owner_id,
        'New Room Inquiry 🏠',
        v_sender_name || ' is interested in your room: ' || v_room_title,
        'info',
        '/inbox?chat=' || v_conversation_id
    );

    RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_room_inquiry(UUID, UUID) TO authenticated;
