-- Add is_deletion_requested column to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS is_deletion_requested BOOLEAN DEFAULT FALSE;

-- Update status check constraint if not already updated (ensuring it covers our needs)
-- Already handled in previous migration, but good to double check status values are 'pending', 'approved', 'rejected'
