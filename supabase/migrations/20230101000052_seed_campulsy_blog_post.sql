-- Seed a detailed Campulsy blog post
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
    status,
    is_featured,
    published_at,
    seo_title,
    seo_description,
    canonical_url,
    reading_time,
    gallery_urls,
    source_links
)
VALUES (
    'Campulsy: The Campus Superapp Built With Students',
    'campulsy-campus-superapp',
    'A detailed look at how Campulsy unifies notes, events, opportunities, and campus services into one trusted student platform.',
    '## Why Campulsy Exists


We started with a simple belief: students should not waste time hunting for essentials when they could be learning, building, and connecting. Campulsy is designed to remove friction and replace it with clarity.

## The Core Problems We Solve

- Scattered information: Important updates live in too many places.
- Low trust: Notes, listings, and announcements often lack verification.
- Missed opportunities: Internships, ambassador roles, and campus programs get lost in noisy channels.
- Weak community signals: Students cannot easily see what is trending or valuable on campus.

## What Makes Campulsy Different

Campulsy is not just a listing site. It is a campus operating system designed around student habits and campus reality:

- A single destination for learning resources, campus events, and career growth.
- Quality and trust signals to help students choose with confidence.
- Intelligent discovery so the right update finds the right student.

## Key Experiences Inside Campulsy

### 1) Notes and Study Resources
Students can upload, discover, and save notes with clear metadata, ratings, and downloads. This creates a reliable layer of peer-reviewed knowledge for each semester and subject.

### 2) Events and Campus Life
From tech talks to cultural fests, Campulsy highlights what is happening right now and what is coming next. Event detail pages help students decide quickly, while organizers get a clean way to publish structured information.

### 3) Opportunities Hub
Internships, ambassador roles, and campus programs are curated into a single dashboard so students never miss deadlines or openings.

### 4) Marketplace and Essentials
Students can buy and sell campus essentials safely within a trusted campus-first environment.

### 5) Attendance and Academic Tools
Campulsy includes tools that help students track academic commitments without bouncing across multiple portals.

## Trust, Moderation, and Safety

For a campus platform to work, it must be safe:

- Content and listings can be reviewed by admins.
- Profiles and activity history build accountability.
- Clear reporting and moderation pathways help keep the space reliable.

## How We Think About Product Design

Our product philosophy is simple:

- Build for the student journey, not the admin workflow.
- Keep interfaces fast, clear, and mobile-first.
- Prioritize clarity and trust over unnecessary complexity.

## What Is Next for Campulsy

We are focused on:

- Smarter recommendations based on interest and context.
- Verified campus partners and clubs with richer profiles.
- Better collaboration tools for projects and peer learning.
- More campus services in a single place.

## Join the Campulsy Community

Campulsy is built with students and for students. If you have ideas, want to partner, or want to bring Campulsy to your campus, we would love to hear from you. Together, we can make campus life easier, more connected, and more ambitious.',
    NULL,
    NULL,
    'Product Update',
    'blog',
    ARRAY['campus', 'students', 'product', 'community', 'notes', 'events', 'opportunities'],
    'Campulsy Team',
    'Editorial',
    'published',
    TRUE,
    NOW(),
    'Campulsy Campus Superapp: Notes, Events, Opportunities',
    'Explore how Campulsy brings campus essentials into one trusted platform for students.',
    'https://campulsy.app/blog/campulsy-campus-superapp',
    6,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    og_image_url = EXCLUDED.og_image_url,
    category = EXCLUDED.category,
    type = EXCLUDED.type,
    tags = EXCLUDED.tags,
    author_name = EXCLUDED.author_name,
    author_title = EXCLUDED.author_title,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    published_at = EXCLUDED.published_at,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    canonical_url = EXCLUDED.canonical_url,
    reading_time = EXCLUDED.reading_time,
    gallery_urls = EXCLUDED.gallery_urls,
    source_links = EXCLUDED.source_links,
    updated_at = NOW();
