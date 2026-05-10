-- FINAL FIX: Remove unread_count from trigger completely
-- unread_count will be managed purely from the frontend via mark_conversation_read RPC
-- Trigger only handles last_message and last_message_at

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();
