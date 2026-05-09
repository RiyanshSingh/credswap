-- 1. FIX PROFILES RLS (Owner Name Visibility)
-- Ensure profiles are public read
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

-- 2. FIX CHAT RPC (Ambiguous Function Signature / Permissions)
-- Drop ALL potential variations to ensure clean slate
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid); 
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid, uuid);

-- Recreate the function cleanly
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  other_user_id uuid,
  related_item_id uuid DEFAULT NULL::uuid,
  related_lost_item_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  -- Validation: Cannot chat with self
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;

  -- Search for existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE 
    ((participant1_id = current_user_id AND participant2_id = other_user_id)
    OR (participant1_id = other_user_id AND participant2_id = current_user_id))
    AND (item_id IS NOT DISTINCT FROM related_item_id)
    AND (lost_item_id IS NOT DISTINCT FROM related_lost_item_id)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new conversation if not found
  INSERT INTO conversations (
    participant1_id, 
    participant2_id, 
    item_id, 
    lost_item_id, 
    last_message, 
    last_message_at
  )
  VALUES (
    current_user_id, 
    other_user_id, 
    related_item_id, 
    related_lost_item_id, 
    'Started a new conversation', 
    NOW()
  )
  RETURNING id INTO conv_id;

  RETURN conv_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid, uuid) TO service_role;

-- 3. ENSURE PROFILE EXISTS (Backfill check)
-- Insert missing profiles for any user in auth.users (if possible via SQL, usually limited access to auth schema)
-- We'll just trust the RLS fix for now, but ensure foreign keys don't block inserts.
