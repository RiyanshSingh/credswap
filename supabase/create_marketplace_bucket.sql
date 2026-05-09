-- Create a storage bucket for marketplace items if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'marketplace' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'marketplace' AND auth.role() = 'authenticated' );

-- Policy to allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'marketplace' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'marketplace' AND auth.uid() = owner );

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'marketplace' AND auth.uid() = owner );
