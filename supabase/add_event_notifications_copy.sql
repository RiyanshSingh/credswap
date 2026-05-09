-- 1. Notify Attendee on Registration
CREATE OR REPLACE FUNCTION public.notify_on_event_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_event_title TEXT;
BEGIN
    -- Get Event Title
    SELECT title INTO v_event_title
    FROM public.events 
    WHERE id = NEW.event_id;

    -- Notify Attendee
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        NEW.user_id,
        'Registration Confirmed! 🎟️',
        'You have successfully registered for: ' || v_event_title || '. View your ticket.',
        'success',
        '/events/' || NEW.event_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_registration_insert ON public.event_registrations;
CREATE TRIGGER on_event_registration_insert
AFTER INSERT ON public.event_registrations
FOR EACH ROW EXECUTE PROCEDURE public.notify_on_event_registration();


-- 2. Notify Attendees on Event Update
CREATE OR REPLACE FUNCTION public.notify_on_event_update()
RETURNS TRIGGER AS $$
DECLARE
    v_attendee RECORD;
BEGIN
    -- Check if Critical Info Changed (Date, Time, Venue)
    IF (OLD.date IS DISTINCT FROM NEW.date) OR 
       (OLD.time IS DISTINCT FROM NEW.time) OR 
       (OLD.venue IS DISTINCT FROM NEW.venue) THEN
       
        -- Loop through all registered attendees
        FOR v_attendee IN 
            SELECT user_id FROM public.event_registrations 
            WHERE event_id = NEW.id AND status = 'registered'
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                v_attendee.user_id,
                'Event Update 📢',
                'Important update for ' || NEW.title || '. The venue or time has changed. Please check details.',
                'warning',
                '/events/' || NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_update_trigger ON public.events;
CREATE TRIGGER on_event_update_trigger
AFTER UPDATE ON public.events
FOR EACH ROW EXECUTE PROCEDURE public.notify_on_event_update();
