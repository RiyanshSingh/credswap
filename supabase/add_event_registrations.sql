
-- Create Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('registered', 'cancelled')) DEFAULT 'registered',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id) -- Prevent double registration
);

-- RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" 
ON public.event_registrations FOR SELECT 
USING (auth.uid() = user_id);

-- Users can register themselves
CREATE POLICY "Users can register themselves" 
ON public.event_registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update (cancel) their own registrations
CREATE POLICY "Users can update own registrations" 
ON public.event_registrations FOR UPDATE 
USING (auth.uid() = user_id);

-- Auto-Update Attendees Count Trigger
CREATE OR REPLACE FUNCTION public.update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.events 
        SET attendees = attendees + 1 
        WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.events 
        SET attendees = GREATEST(0, attendees - 1) 
        WHERE id = OLD.event_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW.status = 'cancelled' AND OLD.status = 'registered' THEN
             UPDATE public.events SET attendees = GREATEST(0, attendees - 1) WHERE id = NEW.event_id;
        ELSIF NEW.status = 'registered' AND OLD.status = 'cancelled' THEN
             UPDATE public.events SET attendees = attendees + 1 WHERE id = NEW.event_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_change ON public.event_registrations;
CREATE TRIGGER on_registration_change
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_event_attendees_count();

-- Grant permissions
GRANT ALL ON public.event_registrations TO authenticated;
