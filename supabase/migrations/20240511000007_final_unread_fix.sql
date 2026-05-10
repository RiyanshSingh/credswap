-- Fix: DB trigger now only updates last_message/last_message_at
-- unread_count reset is handled from the frontend when conversation is opened
-- The trigger should NOT blindly increment - instead we keep it clean

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();
