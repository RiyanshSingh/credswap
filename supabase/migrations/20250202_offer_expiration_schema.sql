-- Add accepted_at column to marketplace_offers
ALTER TABLE marketplace_offers 
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Function to set accepted_at timestamp
CREATE OR REPLACE FUNCTION set_offer_accepted_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- If status is changing TO 'accepted' (from anything else)
    IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
        NEW.accepted_at = NOW();
    END IF;
    
    -- If status changes FROM 'accepted' to something else (e.g. rejected?), clear it? 
    -- Optional: technically if it goes back to pending, we might want to reset.
    IF NEW.status != 'accepted' THEN
        NEW.accepted_at = NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS on_offer_accepted_timestamp ON marketplace_offers;

CREATE TRIGGER on_offer_accepted_timestamp
BEFORE UPDATE ON marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION set_offer_accepted_timestamp();
