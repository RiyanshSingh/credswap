-- Ensure conversations table is completely clean of legacy features and has strict foreign keys
-- This guarantees profile pictures and names load correctly in the chat sidebar

-- 1. Remove legacy lost_and_found reference
ALTER TABLE public.conversations DROP COLUMN IF EXISTS lost_item_id;

-- 2. Enforce explicit foreign keys for profile joins
ALTER TABLE public.conversations
    DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
    DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey,
    DROP CONSTRAINT IF EXISTS conversations_item_id_fkey;

ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_participant1_id_fkey FOREIGN KEY (participant1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT conversations_participant2_id_fkey FOREIGN KEY (participant2_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT conversations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) ON DELETE SET NULL;

-- 3. Create indexes for performance if missing
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
