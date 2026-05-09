-- Optimizing performance with indexes

-- Index for fetching user specific notes (My Uploads)
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Index for fetching user activities (Dashboard Activity Feed)
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Index for sorting activities by time (Recent Activity)
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Index for filtering approved notes (Public Notes Page)
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);

-- Index for filtering approved events (Events Page)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
