-- Fix Messaging Foreign Keys to point to Profiles (for easier Frontend Joins)

-- 1. Alter Conversations Table
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_participant1_id_fkey
FOREIGN KEY (participant1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT conversations_participant2_id_fkey
FOREIGN KEY (participant2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Alter Messages Table
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Run a quick check to ensure 'get_or_create_conversation' still works
-- (It uses auth.uid() which matches profile id, so logic remains valid)
