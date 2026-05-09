-- Add user_id and status to events for moderation
DO $$
BEGIN
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='user_id') THEN
        ALTER TABLE events ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='status') THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'approved'; -- Default to approved for existing events
    END IF;
END $$;

-- Update existing events to have a user_id if they don't (optional, can assign to a system admin)
-- For now, we'll leave them as NULL or assign to a system admin if one exists.

-- RLS Update
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if it exists to replace it with status-aware one
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Approved events are viewable by everyone" 
ON events FOR SELECT 
USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own events" 
ON events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending events" 
ON events FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete own pending events" 
ON events FOR DELETE 
USING (auth.uid() = user_id AND status = 'pending');

-- Admin bypass (if you have an admin role or table)
-- Assuming profiles.role = 'admin'
CREATE POLICY "Admins can do everything on events" 
ON events FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
