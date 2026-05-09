-- Fix 1: Ensure reference_id is TEXT (it seems it might be UUID in your DB)
ALTER TABLE payment_transactions 
ALTER COLUMN reference_id TYPE TEXT;

-- Fix 2: Ensure transaction_ref in orders is also TEXT (to store UUID string or other refs)
ALTER TABLE marketplace_orders 
ALTER COLUMN transaction_ref TYPE TEXT;
