-- Add branch column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS branch text;

-- Optional: Add a check constraint if we want to restrict values, 
-- but for flexibility we'll allow any text for now to support future branches easily.
-- We can add an index for performance since we'll be filtering by it.
CREATE INDEX IF NOT EXISTS idx_notes_branch ON notes(branch);
