-- Trigger Function to update conversation details when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the Trigger on the messages table
DROP TRIGGER IF EXISTS update_last_message_on_insert ON messages;

CREATE TRIGGER update_last_message_on_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Backfill existing conversations (Fix "Started a new conversation")
UPDATE conversations c
SET 
  last_message = (
    SELECT content FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY created_at DESC LIMIT 1
  ),
  last_message_at = (
    SELECT created_at FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY created_at DESC LIMIT 1
  )
WHERE EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);

