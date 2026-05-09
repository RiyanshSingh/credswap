-- 1. RPC: Notify Owner of New Inquiry
-- Called from frontend when user clicks "Chat with Owner"
CREATE OR REPLACE FUNCTION public.notify_new_room_inquiry(
    p_room_id UUID,
    p_owner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_title TEXT;
    v_sender_name TEXT;
BEGIN
    -- Get Room Title
    SELECT title INTO v_room_title FROM public.rooms WHERE id = p_room_id;

    -- Get Sender Name
    SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = auth.uid();

    -- Insert Notification
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        p_owner_id,
        'New Room Inquiry 🏠',
        v_sender_name || ' is interested in your room: ' || v_room_title,
        'info',
        '/inbox' -- Directs to inbox as the user will likely start a chat
    );
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.notify_new_room_inquiry(UUID, UUID) TO authenticated;


-- 2. Trigger: Notify Admins on New Room Listing
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_room()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Loop through all admins
    FOR v_admin_id IN 
        SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_admin_id,
            'New Room Listed',
            'A new room "' || NEW.title || '" has been posted. Please review.',
            'info',
            '/rooms/' || NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_room_insert ON public.rooms;
CREATE TRIGGER on_new_room_insert
AFTER INSERT ON public.rooms
FOR EACH ROW EXECUTE PROCEDURE public.notify_admin_on_new_room();
