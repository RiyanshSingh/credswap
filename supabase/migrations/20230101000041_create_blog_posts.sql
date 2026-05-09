-- Create blog_posts table for Blog & News
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL DEFAULT '',
    cover_image_url TEXT,
    og_image_url TEXT,
    category TEXT,
    type TEXT DEFAULT 'blog',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    author_name TEXT,
    author_title TEXT,
    author_avatar_url TEXT,
    status TEXT DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    reading_time INTEGER,
    gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    source_links TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_key ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts (status);
CREATE INDEX IF NOT EXISTS blog_posts_type_idx ON public.blog_posts (type);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts (published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can view only published posts
DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts" ON public.blog_posts
FOR SELECT
USING (
    status = 'published'
    AND (published_at IS NULL OR published_at <= NOW())
);

-- Admin RPCs for Blog Posts (client-only admin auth)
DROP FUNCTION IF EXISTS public.admin_get_blog_posts;
CREATE OR REPLACE FUNCTION public.admin_get_blog_posts(p_username TEXT, p_password TEXT)
RETURNS SETOF public.blog_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials ac
        WHERE ac.username = p_username AND ac.password = p_password
    ) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.blog_posts
    ORDER BY created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_upsert_blog_post;
CREATE OR REPLACE FUNCTION public.admin_upsert_blog_post(
    p_username TEXT,
    p_password TEXT,
    p_data JSONB
)
RETURNS public.blog_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_status TEXT;
    v_published_at TIMESTAMPTZ;
    v_result public.blog_posts;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials ac
        WHERE ac.username = p_username AND ac.password = p_password
    ) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    v_id := NULLIF(p_data->>'id', '')::UUID;
    v_status := COALESCE(p_data->>'status', 'draft');
    v_published_at := NULLIF(p_data->>'published_at', '')::TIMESTAMPTZ;

    IF v_status = 'published' AND v_published_at IS NULL THEN
        v_published_at := NOW();
    END IF;

    IF v_id IS NULL THEN
        INSERT INTO public.blog_posts (
            title,
            slug,
            excerpt,
            content,
            cover_image_url,
            og_image_url,
            category,
            type,
            tags,
            author_name,
            author_title,
            author_avatar_url,
            status,
            is_featured,
            published_at,
            created_at,
            updated_at,
            seo_title,
            seo_description,
            canonical_url,
            reading_time,
            gallery_urls,
            source_links
        ) VALUES (
            p_data->>'title',
            p_data->>'slug',
            p_data->>'excerpt',
            COALESCE(p_data->>'content', ''),
            NULLIF(p_data->>'cover_image_url', ''),
            NULLIF(p_data->>'og_image_url', ''),
            NULLIF(p_data->>'category', ''),
            COALESCE(NULLIF(p_data->>'type', ''), 'blog'),
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'tags', '[]'::jsonb))), ARRAY[]::TEXT[]),
            NULLIF(p_data->>'author_name', ''),
            NULLIF(p_data->>'author_title', ''),
            NULLIF(p_data->>'author_avatar_url', ''),
            v_status,
            COALESCE((p_data->>'is_featured')::BOOLEAN, FALSE),
            v_published_at,
            NOW(),
            NOW(),
            NULLIF(p_data->>'seo_title', ''),
            NULLIF(p_data->>'seo_description', ''),
            NULLIF(p_data->>'canonical_url', ''),
            NULLIF(p_data->>'reading_time', '')::INTEGER,
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'gallery_urls', '[]'::jsonb))), ARRAY[]::TEXT[]),
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'source_links', '[]'::jsonb))), ARRAY[]::TEXT[])
        )
        RETURNING * INTO v_result;
    ELSE
        UPDATE public.blog_posts
        SET
            title = p_data->>'title',
            slug = p_data->>'slug',
            excerpt = p_data->>'excerpt',
            content = COALESCE(p_data->>'content', ''),
            cover_image_url = NULLIF(p_data->>'cover_image_url', ''),
            og_image_url = NULLIF(p_data->>'og_image_url', ''),
            category = NULLIF(p_data->>'category', ''),
            type = COALESCE(NULLIF(p_data->>'type', ''), 'blog'),
            tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'tags', '[]'::jsonb))), ARRAY[]::TEXT[]),
            author_name = NULLIF(p_data->>'author_name', ''),
            author_title = NULLIF(p_data->>'author_title', ''),
            author_avatar_url = NULLIF(p_data->>'author_avatar_url', ''),
            status = v_status,
            is_featured = COALESCE((p_data->>'is_featured')::BOOLEAN, FALSE),
            published_at = v_published_at,
            updated_at = NOW(),
            seo_title = NULLIF(p_data->>'seo_title', ''),
            seo_description = NULLIF(p_data->>'seo_description', ''),
            canonical_url = NULLIF(p_data->>'canonical_url', ''),
            reading_time = NULLIF(p_data->>'reading_time', '')::INTEGER,
            gallery_urls = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'gallery_urls', '[]'::jsonb))), ARRAY[]::TEXT[]),
            source_links = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'source_links', '[]'::jsonb))), ARRAY[]::TEXT[])
        WHERE id = v_id
        RETURNING * INTO v_result;
    END IF;

    RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_delete_blog_post;
CREATE OR REPLACE FUNCTION public.admin_delete_blog_post(
    p_blog_id UUID,
    p_username TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_credentials ac
        WHERE ac.username = p_username AND ac.password = p_password
    ) THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    DELETE FROM public.blog_posts WHERE id = p_blog_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_blog_posts(TEXT, TEXT) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_blog_post(TEXT, TEXT, JSONB) TO anon, authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_blog_post(UUID, TEXT, TEXT) TO anon, authenticated, postgres, service_role;
