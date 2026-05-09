-- 1. Merge existing duplicate conversations into a single thread per user-pair
-- This logic identifies all chats between the same two people and moves all messages to the most recent one.
DO $$ 
DECLARE
    conv_record RECORD;
    canonical_id UUID;
BEGIN
    FOR conv_record IN (
        SELECT DISTINCT LEAST(participant1_id, participant2_id) as p1, 
                       GREATEST(participant1_id, participant2_id) as p2 
        FROM public.conversations
    ) LOOP
        -- Find the "canonical" conversation (the one with the latest activity)
        SELECT id INTO canonical_id 
        FROM public.conversations 
        WHERE (participant1_id = conv_record.p1 AND participant2_id = conv_record.p2)
           OR (participant1_id = conv_record.p2 AND participant2_id = conv_record.p1)
        ORDER BY last_message_at DESC 
        LIMIT 1;

        -- Reassign all messages from other conversations between this pair to the canonical one
        UPDATE public.messages 
        SET conversation_id = canonical_id 
        WHERE conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE ((participant1_id = conv_record.p1 AND participant2_id = conv_record.p2)
               OR (participant1_id = conv_record.p2 AND participant2_id = conv_record.p1))
              AND id != canonical_id
        );

        -- Delete the redundant conversation records
        DELETE FROM public.conversations 
        WHERE ((participant1_id = conv_record.p1 AND participant2_id = conv_record.p2)
           OR (participant1_id = conv_record.p2 AND participant2_id = conv_record.p1))
          AND id != canonical_id;
    END LOOP;
END $$;

-- 2. Drop old constraints that allowed multiple chats per item
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_participant2_id_item_id_key;
DROP INDEX IF EXISTS public.conversations_lost_item_unique_idx;

-- 3. Add order-independent unique index to strictly enforce one chat per pair
CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_chat_per_pair_idx
ON public.conversations (LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id));

-- 4. Update the RPC logic to merge inquiries into the existing chat thread
CREATE OR REPLACE FUNCTION public.start_chat(
    other_user_id UUID,
    item_id UUID DEFAULT NULL,
    lost_item_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot chat with yourself';
  END IF;

  -- Search for existing conversation between these two people (regardless of item context)
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE 
    (participant1_id = current_user_id AND participant2_id = other_user_id)
    OR (participant1_id = other_user_id AND participant2_id = current_user_id)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    -- Update conversation with the NEWEST inquiry context
    -- This ensures the sidebar shows what the latest discussion is about
    IF start_chat.item_id IS NOT NULL OR start_chat.lost_item_id IS NOT NULL THEN
      UPDATE public.conversations 
      SET 
          item_id = start_chat.item_id,
          lost_item_id = start_chat.lost_item_id,
          last_message_at = NOW()
      WHERE id = conv_id;
    END IF;
    RETURN conv_id;
  END IF;

  -- Create new if none exists
  INSERT INTO public.conversations (
    participant1_id, 
    participant2_id, 
    item_id, 
    lost_item_id, 
    last_message, 
    last_message_at
  )
  VALUES (
    current_user_id, 
    other_user_id, 
    start_chat.item_id, 
    start_chat.lost_item_id, 
    'Started a new conversation', 
    NOW()
  )
  RETURNING id INTO conv_id;

  RETURN conv_id;
END;
$$;

-- Ensure get_or_create_conversation (if used) follows same logic
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  other_user_id UUID,
  related_item_id UUID DEFAULT NULL,
  related_lost_item_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.start_chat(other_user_id, related_item_id, related_lost_item_id);
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.start_chat(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
