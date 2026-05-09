-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON events;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON events;

-- Create comprehensive policies
-- 1. Everyone can view events
CREATE POLICY "Enable read access for all users" ON events
FOR SELECT TO public USING (true);

-- 2. Authenticated users (Admins) can Create, Update, Delete
CREATE POLICY "Enable all for authenticated users" ON events
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
