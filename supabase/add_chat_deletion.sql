-- 1. Add deleted_by column to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS deleted_by UUID[] DEFAULT '{}';

-- 2. RPC to Hide/Delete Conversation for a User
CREATE OR REPLACE FUNCTION public.delete_conversation(conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET deleted_by = array_append(deleted_by, auth.uid())
    WHERE id = conversation_id
    AND NOT (deleted_by @> ARRAY[auth.uid()]); -- Prevent duplicates
END;
$$;

-- 3. Trigger Function: Unhide conversation on new message
CREATE OR REPLACE FUNCTION public.unhide_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Reset deleted_by to empty array so both users see the chat again
    UPDATE public.conversations
    SET deleted_by = '{}'
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS on_new_message_unhide_conversation ON public.messages;
CREATE TRIGGER on_new_message_unhide_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.unhide_conversation_on_message();
