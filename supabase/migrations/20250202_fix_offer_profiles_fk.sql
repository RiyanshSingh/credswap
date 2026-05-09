-- Add Foreign Key constraint to marketplace_offers for profiles join
DO $$
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'marketplace_offers_buyer_id_fkey_profiles'
    ) THEN
        ALTER TABLE marketplace_offers
        ADD CONSTRAINT marketplace_offers_buyer_id_fkey_profiles
        FOREIGN KEY (buyer_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
