-- Add last_seen to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Allow users to update their own last_seen
CREATE POLICY "Users can update their own last_seen"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- (If generic update policy already exists, this might be redundant but safe)

-- Ensure messages has is_read (it should, but just in case)
-- ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
