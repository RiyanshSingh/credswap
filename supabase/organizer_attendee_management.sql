-- 1. Update RLS Polices for event_registrations
-- Allow Organizers to VIEW registrations for their own events
CREATE POLICY "Organizers can view event registrations" 
ON public.event_registrations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_registrations.event_id 
        AND e.user_id = auth.uid()
    )
);

-- 2. New RPC: get_event_attendees_for_organizer
-- Securely fetch attendee profiles for an organizer's event
CREATE OR REPLACE FUNCTION public.get_event_attendees_for_organizer(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_owner UUID;
    result JSONB;
BEGIN
    -- Verify event ownership
    SELECT user_id INTO v_event_owner FROM events WHERE id = p_event_id;
    
    IF v_event_owner != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You are not the owner of this event.';
    END IF;

    -- Fetch attendees
    SELECT jsonb_agg(
        to_jsonb(r) || jsonb_build_object(
            'profiles', jsonb_build_object(
                'full_name', p.full_name,
                'email', p.email,
                'avatar_url', p.avatar_url
            )
        )
    )
    INTO result
    FROM event_registrations r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = p_event_id;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_attendees_for_organizer(UUID) TO authenticated;

-- 3. Harden mark_attendance
-- Now checks if the caller is the event owner or an admin
CREATE OR REPLACE FUNCTION public.mark_attendance(
    ticket_id UUID, 
    scan_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    reg_record RECORD;
    user_profile RECORD;
    v_event_owner UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Get Registration & Event Owner
    SELECT r.*, e.user_id as event_owner INTO reg_record 
    FROM event_registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.id = ticket_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Ticket ID');
    END IF;

    -- 2. Authorization Check
    -- Check if admin via profiles (since we don't have rpc for admin tables check here easily without params)
    SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = auth.uid();
    
    IF NOT (reg_record.event_owner = auth.uid() OR COALESCE(v_is_admin, false)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You cannot scan tickets for this event.');
    END IF;

    -- 3. Get User Profile
    SELECT * INTO user_profile FROM profiles WHERE id = reg_record.user_id;

    -- 4. Validation Checks
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

    -- 5. Mark as Attended
    UPDATE event_registrations 
    SET status = 'attended' 
    WHERE id = ticket_id;

    -- 6. Return Success
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

GRANT EXECUTE ON FUNCTION public.mark_attendance(UUID, JSONB) TO authenticated;
