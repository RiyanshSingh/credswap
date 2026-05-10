-- Add detailed verification fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_document_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_feedback TEXT;

-- Sync existing is_verified users to 'verified' status
UPDATE public.profiles SET verification_status = 'verified' WHERE is_verified = true;
UPDATE public.profiles SET verification_status = 'unverified' WHERE is_verified = false;

-- Update the admin verify function to handle status
CREATE OR REPLACE FUNCTION admin_verify_user_v2(
    p_username TEXT, 
    p_password TEXT, 
    target_user_id UUID, 
    new_status TEXT, 
    feedback TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate admin credentials
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials
        WHERE username = p_username AND password = p_password
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can verify users.';
    END IF;

    -- Update the verification status
    UPDATE public.profiles
    SET 
        verification_status = new_status,
        is_verified = (new_status = 'verified'),
        verification_feedback = feedback
    WHERE id = target_user_id;
END;
$$;

-- Create storage bucket for verification documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Users can upload their own verification documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view verification documents" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'verification-documents');
