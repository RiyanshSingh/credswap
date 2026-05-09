-- Computed Field: unread_count
-- This allows us to query 'unread_count' directly on the conversations table in the frontend
-- Usage: .select('*, unread_count')

CREATE OR REPLACE FUNCTION unread_count(c conversations)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM messages m
  WHERE m.conversation_id = c.id
  AND m.is_read = false
  AND m.sender_id != auth.uid(); -- Only count messages sent by OTHERS
$$;
