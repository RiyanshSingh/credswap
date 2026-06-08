-- Create the verification documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for the bucket (idempotent - drop first to avoid conflicts)
DROP POLICY IF EXISTS "Verification Documents Upload" ON storage.objects;
CREATE POLICY "Verification Documents Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

DROP POLICY IF EXISTS "Verification Documents View Own" ON storage.objects;
CREATE POLICY "Verification Documents View Own"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Verification Documents Admin View" ON storage.objects;
CREATE POLICY "Verification Documents Admin View"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents');
