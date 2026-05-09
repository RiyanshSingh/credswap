-- Fix broken links in existing notifications
BEGIN;

-- 1. Replace incorrect '/listing/' with '/marketplace/'
UPDATE notifications 
SET link = REPLACE(link, '/listing/', '/marketplace/') 
WHERE link LIKE '/listing/%';

-- 2. Append '?action=manage_offers' to offer_received notifications if missing
-- This ensures they open the Manage Offers dialog
UPDATE notifications 
SET link = link || '?action=manage_offers' 
WHERE type = 'offer_received' 
AND link LIKE '/marketplace/%' 
AND link NOT LIKE '%action=manage_offers%';

COMMIT;
