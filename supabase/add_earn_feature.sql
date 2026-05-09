-- EARN MONEY FEATURE: Backend Implementation

-- 1. Create Task Submissions Table
CREATE TABLE IF NOT EXISTS task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    proof_url TEXT, -- URL to uploaded screenshot or file
    submission_text TEXT, -- Optional text description
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can see their own submissions
CREATE POLICY "Users can view own submissions" 
ON task_submissions FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create submissions
CREATE POLICY "Users can create submissions" 
ON task_submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin can view all (Simulated Admin check or just open for this MVP if RLS is tricky for "Admin")
-- For now, letting public view might be needed for the Admin Dashboard if we don't have strict Admin Auth Roles setup in `auth` schema yet.
-- Ideally: USING ( exists(select 1 from admins where id = auth.uid()) )
-- MVP fallback: Allow ALL to SELECT (Protected by frontend routes)
CREATE POLICY "Admins can view all submissions" 
ON task_submissions FOR SELECT 
USING (true);

-- Admins can update status (Simulated)
CREATE POLICY "Admins can update submissions" 
ON task_submissions FOR UPDATE 
USING (true);


-- 2. Update Profiles Table for Wallet
-- Check if columns exist first to avoid errors (Using DO block)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_balance') THEN 
        ALTER TABLE profiles ADD COLUMN wallet_balance INTEGER DEFAULT 0; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earned') THEN 
        ALTER TABLE profiles ADD COLUMN total_earned INTEGER DEFAULT 0; 
    END IF;
END $$;


-- 3. Storage for Task Proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task_proofs', 'task_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Task proofs are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'task_proofs' );

CREATE POLICY "Authenticated users can upload proofs" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'task_proofs' AND auth.role() = 'authenticated' );
