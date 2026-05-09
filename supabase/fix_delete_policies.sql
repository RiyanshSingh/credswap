-- Enable delete for community_comments
create policy "Users can delete their own comments"
on community_comments for delete
using (auth.uid() = user_id);

-- Enable delete for community_posts
create policy "Users can delete their own posts"
on community_posts for delete
using (auth.uid() = user_id);
