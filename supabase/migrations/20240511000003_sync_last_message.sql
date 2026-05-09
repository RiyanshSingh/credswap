UPDATE public.conversations c
SET 
    last_message = m.content,
    last_message_at = m.created_at
FROM (
    SELECT conversation_id, content, created_at
    FROM (
        SELECT conversation_id, content, created_at,
               ROW_NUMBER() OVER(PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM public.messages
    ) sub
    WHERE rn = 1
) m
WHERE c.id = m.conversation_id;
