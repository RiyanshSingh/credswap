-- Allow users to update conversations they are part of
-- This is required for updating 'last_message' and 'last_message_at'

create policy "Users can update their conversations"
  on conversations for update
  to authenticated
  using (
    auth.uid() = participant1_id or auth.uid() = participant2_id
  )
  with check (
    auth.uid() = participant1_id or auth.uid() = participant2_id
  );

-- Also ensure the trigger function is SECURITY DEFINER to bypass RLS if needed (redundant but safe)
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
