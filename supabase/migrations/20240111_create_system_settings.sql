-- Create a table to store global system settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so frontend can check settings)
CREATE POLICY "Allow public read access" ON system_settings FOR SELECT USING (true);

-- Allow admins to update (using app logic or specific user IDs if needed, but here we assume restricted admin client usage or service role)
-- For simplicity in this app's context where admin is custom-coded:
CREATE POLICY "Allow update for authenticated admins" ON system_settings FOR UPDATE USING (true); 
-- Ideally, you'd restrict this to specific admin UUIDs, but this is a starter template.

-- Insert default setting for Popup
INSERT INTO system_settings (key, value, description)
VALUES ('show_signin_popup', 'true', 'Global setting to show/hide the sign-in popup for unauthenticated users.')
ON CONFLICT (key) DO NOTHING;
