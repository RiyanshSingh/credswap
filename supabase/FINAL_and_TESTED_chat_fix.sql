-- FORCE RELOAD SCHEMA CACHE FIRST
NOTIFY pgrst, 'reload schema';

-- Drop function to ensure clean slate
DROP FUNCTION IF EXISTS public.start_chat(uuid, uuid, uuid);

-- Recreate Function
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

  -- Prevent chatting with self
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot chat with yourself';
  END IF;

  -- Search for existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE 
    ((participant1_id = current_user_id AND participant2_id = other_user_id)
    OR (participant1_id = other_user_id AND participant2_id = current_user_id))
    AND (conversations.item_id IS NOT DISTINCT FROM start_chat.item_id)
    AND (conversations.lost_item_id IS NOT DISTINCT FROM start_chat.lost_item_id)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new
  INSERT INTO conversations (
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

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.start_chat(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_chat(UUID, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_chat(UUID, UUID, UUID) TO anon;

-- FORCE RELOAD SCHEMA CACHE AGAIN TO BE SURE
NOTIFY pgrst, 'reload schema';
