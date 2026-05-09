-- Drop the old constraint referencing auth.users
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_owner_id_fkey;

-- Add new constraint referencing public.profiles
ALTER TABLE rooms
ADD CONSTRAINT rooms_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
