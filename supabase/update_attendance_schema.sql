-- 1. Ensure Check Constraint allows 'attended'
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_status_check 
CHECK (status IN ('registered', 'cancelled', 'attended'));

-- 2. Improved RPC: Marks Attendance (Force) AND Returns User Details
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
    -- 1. Get Registration
    SELECT * INTO reg_record FROM event_registrations WHERE id = ticket_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Ticket ID');
    END IF;

    -- 2. Get User Profile (Name, Email)
    SELECT * INTO user_profile FROM profiles WHERE id = reg_record.user_id;

    -- 3. Validation Checks
    -- Check if ALREADY attended
    IF reg_record.status = 'attended' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Already Scanned', 
            'user', jsonb_build_object(
                'name', COALESCE(user_profile.full_name, 'Unknown'),
                'email', COALESCE(user_profile.email, 'No Email')
            )
        );
    END IF;

    -- REMOVED "If Cancelled" block. 
    -- Now we ALLOW 'cancelled' tickets to be marked 'attended'.

    -- 4. Mark as Attended
    UPDATE event_registrations 
    SET status = 'attended' 
    WHERE id = ticket_id;

    -- 5. Return Success with User Details
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
