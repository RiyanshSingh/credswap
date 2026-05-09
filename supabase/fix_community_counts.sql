-- Add trigger to decrement members_count when a user leaves a community
CREATE OR REPLACE FUNCTION handle_leave_community()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE communities
    SET members_count = GREATEST(0, members_count - 1)
    WHERE id = OLD.community_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_leave_community ON community_members;
CREATE TRIGGER on_leave_community
AFTER DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION handle_leave_community();

-- Recalculate members_count for all communities to fix any inconsistencies
UPDATE communities c
SET members_count = (
    SELECT count(*)
    FROM community_members cm
    WHERE cm.community_id = c.id
);

-- Note: If you have seed data that should be added to the count, 
-- you might want to adjust this. But usually community_members should be the source of truth.
