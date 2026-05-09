-- Create User Downloads Table for History
CREATE TABLE IF NOT EXISTS user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own downloads" 
ON user_downloads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own downloads" 
ON user_downloads FOR SELECT 
USING (auth.uid() = user_id);
