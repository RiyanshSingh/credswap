-- Migration for creating community post likes trigger to keep stats in sync natively

-- 1. Function to update post likes natively on insert/delete of post_likes
DROP FUNCTION IF EXISTS update_community_post_likes;
CREATE OR REPLACE FUNCTION update_community_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET likes = likes + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET likes = GREATEST(0, likes - 1)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing if any, then create trigger

DROP TRIGGER IF EXISTS "community_post_likes_trigger" ON post_likes;
CREATE TRIGGER "community_post_likes_trigger" AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_community_post_likes();
