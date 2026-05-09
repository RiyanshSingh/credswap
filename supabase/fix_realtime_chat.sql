-- FIX REALTIME CHAT
-- 1. Add tables to supabase_realtime publication
-- This is REQUIRED for the client to receive updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles; -- For presence/status updates

-- 2. Ensure Replica Identity is set (usually DEFAULT is fine, but FULL ensures all cols)
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- 3. Verify RLS Policies allow "SELECT" for the recipient
-- (Existing policies should cover this, but this is a sanity check comment)
-- Policy: "Users can view messages in conversations they belong to"
