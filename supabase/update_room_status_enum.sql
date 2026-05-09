-- Drop existing check constraint
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

-- Add updated check constraint
ALTER TABLE rooms ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('available', 'taken', 'pending', 'rejected'));

-- Set default to 'pending' (optional, but good practice if not specified in insert)
ALTER TABLE rooms ALTER COLUMN status SET DEFAULT 'pending';

-- RLS Update: Ensure admins can view all statuses (already covered by role usually, but explicitly public read policy might need tweaking if we want strict hiding)
-- The existing policy "Public can view available rooms" only shows 'available', so 'pending' is effectively hidden from public view.
-- Admin dashboard will need to query without that filter (or use a separate policy/role).
-- For now, owners need to see their 'pending' items, which "Users can view own rooms" covers.
