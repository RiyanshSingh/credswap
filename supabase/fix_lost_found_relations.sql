-- Add FK to profiles to allow joining in queries
ALTER TABLE lost_found_items
ADD CONSTRAINT lost_found_items_user_id_fkey_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles (id)
ON DELETE CASCADE;
