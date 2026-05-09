-- COMMUNITY INTERACTIONS & NOTIFICATIONS

-- 1. Community Members (Join/Leave)
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- 2. Community Comments
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Recipient
    type TEXT CHECK (type IN ('like', 'comment', 'system', 'task_approval')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity_id UUID, -- ID of the post, task, or comment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view members" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON community_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System/Triggers can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- Allow triggers/admin

-- 4. Triggers for Notifications and Counts

-- A. On Join -> Increment members_count
CREATE OR REPLACE FUNCTION handle_join_community()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE communities
    SET members_count = members_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_join_community
AFTER INSERT ON community_members
FOR EACH ROW EXECUTE FUNCTION handle_join_community();

-- B. On Like -> Notify Post Author
-- Note: 'likes' is currently just a count on community_posts. 
-- Real-time notification for likes usually requires a 'likes' table (user_id, post_id).
-- The current implementation uses a simple integer increment on the post, which doesn't track *who* liked it.
-- To support "User X liked your post", we need a `post_likes` table.
-- Refactoring `community_posts` 'likes' column to be derived from a new table would be robust, but for now let's add `post_likes` table and use that instead of the integer column for better features.

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Trigger: Notify owner on Like
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    post_content_snippet TEXT;
BEGIN
    SELECT user_id, substring(content from 1 for 20) INTO post_owner_id, post_content_snippet 
    FROM community_posts WHERE id = NEW.post_id;

    -- Don't notify if liking own post
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, message, related_entity_id)
        VALUES (post_owner_id, 'like', 'Someone liked your post: "' || post_content_snippet || '..."', NEW.post_id);
    END IF;

    -- Also update the count on the post table for fast read
    UPDATE community_posts SET likes = likes + 1 WHERE id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_post
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION handle_new_like();

-- Trigger: Decrement count on unlike
CREATE OR REPLACE FUNCTION handle_unlike()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts SET likes = likes - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_remove_like
AFTER DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION handle_unlike();


-- C. On Comment -> Notify Post Author
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    post_content_snippet TEXT;
BEGIN
    SELECT user_id, substring(content from 1 for 20) INTO post_owner_id, post_content_snippet 
    FROM community_posts WHERE id = NEW.post_id;

    IF post_owner_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, message, related_entity_id)
        VALUES (post_owner_id, 'comment', 'New comment on your post: "' || post_content_snippet || '..."', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_post
AFTER INSERT ON community_comments
FOR EACH ROW EXECUTE FUNCTION handle_new_comment();
