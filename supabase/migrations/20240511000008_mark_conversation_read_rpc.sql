-- Create an RPC function to safely mark a conversation as read
-- This runs with SECURITY DEFINER to bypass RLS for the unread_count reset

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Only allow participants to mark as read
    IF NOT EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = p_conversation_id
          AND (participant1_id = v_user_id OR participant2_id = v_user_id)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Mark all messages from the other user as read
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND sender_id != v_user_id
      AND is_read = false;

    -- Reset unread_count
    UPDATE public.conversations
    SET unread_count = 0
    WHERE id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;
