-- Task Dispute Messages Table
CREATE TABLE IF NOT EXISTS public.task_dispute_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispute_id UUID REFERENCES public.task_disputes(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_admin_message BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.task_dispute_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view task dispute messages" ON public.task_dispute_messages;
CREATE POLICY "Public view task dispute messages" ON public.task_dispute_messages FOR SELECT USING (true); -- Limit to participants+admin ideally

DROP POLICY IF EXISTS "Participants post messages" ON public.task_dispute_messages;
CREATE POLICY "Participants post messages" ON public.task_dispute_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- Admin Post Message RPC (for Tasks)
CREATE OR REPLACE FUNCTION public.post_admin_task_message(
    p_dispute_id UUID,
    p_content TEXT,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Verify Admin Credentials
    SELECT id INTO v_admin_id FROM public.admins 
    WHERE username = p_username AND password = p_password;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    -- Insert Message
    INSERT INTO public.task_dispute_messages (dispute_id, sender_id, content, is_admin_message)
    VALUES (p_dispute_id, NULL, p_content, true);
END;
$$;
