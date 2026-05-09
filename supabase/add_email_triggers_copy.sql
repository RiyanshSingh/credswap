-- Enable pg_net for making HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to invoke the Edge Function
CREATE OR REPLACE FUNCTION public.invoke_email_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT := 'https://PROJECT_REF.functions.supabase.co/send-email'; -- Placeholder
    v_api_key TEXT := 'YOUR_SUPABASE_ANON_KEY'; -- Placeholder for Authorization
    v_payload JSONB;
BEGIN
    -- 1. Welcome Email (Triggered on public.profiles or auth.users)
    -- We'll attach this to public.profiles since that's where we have the name
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'type', 'welcome',
            'payload', jsonb_build_object(
                'email', NEW.email,
                'name', NEW.full_name
            )
        );
    
    -- 2. Admin Recovery (Triggered on admin_recovery_tokens)
    ELSIF TG_TABLE_NAME = 'admin_recovery_tokens' AND TG_OP = 'INSERT' THEN
        -- Need to fetch admin email
        DECLARE
            v_admin_email TEXT;
        BEGIN
            SELECT email INTO v_admin_email FROM public.admins WHERE id = NEW.admin_id;
            
            v_payload := jsonb_build_object(
                'type', 'reset_password',
                'payload', jsonb_build_object(
                    'email', v_admin_email,
                    'token', NEW.token
                )
            );
        END;

    -- 3. Ticket Purchase (Triggered on event_registrations)
    ELSIF TG_TABLE_NAME = 'event_registrations' AND TG_OP = 'INSERT' THEN
         -- Need to fetch event details and user email
         DECLARE
            v_event_title TEXT;
            v_event_date TEXT;
            v_event_venue TEXT;
            v_user_email TEXT;
            v_user_name TEXT;
         BEGIN
            SELECT title, date, venue INTO v_event_title, v_event_date, v_event_venue 
            FROM public.events WHERE id = NEW.event_id;
            
            SELECT email, full_name INTO v_user_email, v_user_name 
            FROM public.profiles WHERE id = NEW.user_id;

            v_payload := jsonb_build_object(
                'type', 'ticket',
                'payload', jsonb_build_object(
                    'email', v_user_email,
                    'eventTitle', v_event_title,
                    'date', v_event_date,
                    'venue', v_event_venue,
                    'qrData', jsonb_build_object('ticketId', NEW.id, 'user', v_user_name, 'eventId', NEW.event_id)
                )
            );
         END;
    END IF;

    -- Send Async Request via pg_net
    -- Note: In local dev, this might fail without proper setup. 
    -- We assume the user configures the URL and Keys.
    PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_key
        ),
        body := v_payload
    );

    RETURN NEW;
END;
$$;

-- Triggers

-- 1. Welcome Email
DROP TRIGGER IF EXISTS on_profile_created_email ON public.profiles;
CREATE TRIGGER on_profile_created_email
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.invoke_email_function();

-- 2. Admin Recovery
DROP TRIGGER IF EXISTS on_admin_recovery_email ON public.admin_recovery_tokens;
CREATE TRIGGER on_admin_recovery_email
AFTER INSERT ON public.admin_recovery_tokens
FOR EACH ROW
EXECUTE FUNCTION public.invoke_email_function();

-- 3. Event Registration (Ticket)
DROP TRIGGER IF EXISTS on_ticket_purchased_email ON public.event_registrations;
CREATE TRIGGER on_ticket_purchased_email
AFTER INSERT ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.invoke_email_function();
