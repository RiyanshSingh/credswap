-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars'
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts

-- Create ALL PERMISSIONS policy for avatars bucket
-- Since Admin is custom-auth (localStorage), Supabase sees them as 'anon'.
-- We need to allow anon to upload to this specific bucket.
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatar Public Upload" ON storage.objects;
CREATE POLICY "Avatar Public Upload" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatar Public Update" ON storage.objects;
CREATE POLICY "Avatar Public Update" ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' );
