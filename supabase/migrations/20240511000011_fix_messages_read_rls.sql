-- Nuclear fix: ensure messages RLS allows users to update is_read on messages they received

-- First ensure there's a proper RLS policy for updating is_read
-- Users should be able to mark messages as read if they are a participant in that conversation

DROP POLICY IF EXISTS "Users can update read status of messages they received" ON public.messages;

CREATE POLICY "Users can update read status of messages they received"
ON public.messages
FOR UPDATE
USING (
    -- User must be a participant in the conversation (not the sender)
    sender_id != auth.uid()
    AND conversation_id IN (
        SELECT id FROM public.conversations
        WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
)
WITH CHECK (true);
