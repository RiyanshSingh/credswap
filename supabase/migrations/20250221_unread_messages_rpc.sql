-- Create a function to get the total unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE 
    (c.participant1_id = p_user_id OR c.participant2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = false
    AND NOT (p_user_id::text = ANY(COALESCE(c.deleted_by, ARRAY[]::text[])));
$$;
