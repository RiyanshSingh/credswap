-- FORCE FIX ATTENDANCE SCHEMA

-- 1. DROP ALL POTENTIAL CONSTRAINTS on status
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.event_registrations'::regclass 
        AND contype = 'c' 
        AND conname LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.event_registrations DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 2. Add correct constraint
ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_status_check 
CHECK (status IN ('registered', 'cancelled', 'attended'));

-- 3. Update Trigger Function to handle 'attended'
CREATE OR REPLACE FUNCTION public.update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.status = 'registered' OR NEW.status = 'attended' THEN
            UPDATE public.events SET attendees = attendees + 1 WHERE id = NEW.event_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.status = 'registered' OR OLD.status = 'attended' THEN
            UPDATE public.events SET attendees = GREATEST(0, attendees - 1) WHERE id = OLD.event_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Case: Registered/Attended -> Cancelled (Decrease)
        IF (OLD.status = 'registered' OR OLD.status = 'attended') AND NEW.status = 'cancelled' THEN
             UPDATE public.events SET attendees = GREATEST(0, attendees - 1) WHERE id = NEW.event_id;
        
        -- Case: Cancelled -> Registered/Attended (Increase)
        ELSIF OLD.status = 'cancelled' AND (NEW.status = 'registered' OR NEW.status = 'attended') THEN
             UPDATE public.events SET attendees = attendees + 1 WHERE id = NEW.event_id;
        
        -- Other transitions (Registered -> Attended) do NOT change count.
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate RPC (Force Attended)
DROP FUNCTION IF EXISTS public.mark_attendance(UUID, JSONB);
CREATE OR REPLACE FUNCTION public.mark_attendance(
    ticket_id UUID, 
    scan_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reg_record RECORD;
    user_profile RECORD;
BEGIN
    -- Get Registration
    SELECT * INTO reg_record FROM event_registrations WHERE id = ticket_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Ticket ID');
    END IF;

    -- Get User
    SELECT * INTO user_profile FROM profiles WHERE id = reg_record.user_id;

    -- Already Attended Check
    IF reg_record.status = 'attended' THEN
        RETURN jsonb_build_object(
            'success', true, -- Return Success true even if already attended, just warn
            'message', 'Already Scanned', 
            'user', jsonb_build_object(
                'name', COALESCE(user_profile.full_name, 'Unknown'),
                'email', COALESCE(user_profile.email, 'No Email')
            )
        );
    END IF;

    -- FORCE UPDATE TO ATTENDED (Override any previous status)
    UPDATE event_registrations 
    SET status = 'attended' 
    WHERE id = ticket_id;

    -- Return Success
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Attendance Verified',
        'user', jsonb_build_object(
            'name', COALESCE(user_profile.full_name, 'Unknown'),
            'email', COALESCE(user_profile.email, 'No Email')
        )
    );
END;
$$;
