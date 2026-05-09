-- Update rooms status check constraint to allow pending and approved states
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

ALTER TABLE rooms ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('pending', 'available', 'approved', 'rejected', 'taken', 'new'));

-- Ensure existing rooms have a valid status if any were orphaned
UPDATE rooms SET status = 'available' WHERE status IS NULL;
