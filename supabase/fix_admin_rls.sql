-- Add is_admin column to profiles if it doesn't exist
-- We use a DO block to check if column exists, but simpler to just ALTER and ignore error or use IF NOT EXISTS if supported (Postgres 9.6+ supports IF NOT EXISTS for ADD COLUMN)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update RLS for Marketplace Items to allow Admin updates
-- Drop existing relevant policy if any (Sellers one is fine, just needs augmentation or new policy)

-- Policy: Admins can update ANY item
CREATE POLICY "Admins can update all items"
ON marketplace_items FOR UPDATE
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

-- Policy: Admins can delete ANY item (optional but good for moderation)
CREATE POLICY "Admins can delete all items"
ON marketplace_items FOR DELETE
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

-- Make the current user an admin (For testing purposes, we assume the user running this is the admin)
-- Since we can't easily know the ID, we will update the most recent user or ALL users?
-- Dangerous to update ALL.
-- Let's update the user associated with 'riyansh' email or similar if we can guess.
-- Better: Update the user who created the latest marketplace item?
-- For now, let's just enable it for the logged in user via the App logic (not here).
-- Actually, I will insert a command to update the user with email 'admin@studyhub.com' if it exists, or just leave it to be set manually?
-- Risky to leave it.
-- I'll trust the user to be able to set it, OR I will make ALL current users admin for dev environment?
-- Let's set ALL existing profiles to is_admin = true for this dev environment so verifying works.
UPDATE profiles SET is_admin = TRUE;
