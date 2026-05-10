-- Fix mark_conversation_read to NOT update unread_count column
-- Sidebar already computes unread count directly from messages table
-- This ensures the RPC never fails due to column issues

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

    -- Only mark messages from the other user as read
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND sender_id != v_user_id
      AND is_read = false;

END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;
