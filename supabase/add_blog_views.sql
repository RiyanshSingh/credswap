-- Add views column to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Function to safely increment views
CREATE OR REPLACE FUNCTION public.increment_blog_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_views(UUID) TO anon, authenticated;
