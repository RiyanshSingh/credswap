-- Approve all pending marketplace items
UPDATE marketplace_items
SET status = 'approved'
WHERE status = 'pending';
