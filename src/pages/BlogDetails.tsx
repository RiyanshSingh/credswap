import { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft, Share2, User, Eye } from "lucide-react";
import { BlogPost } from "@/types/database";
import "react-quill/dist/quill.snow.css";

const BlogDetailsSkeleton = () => (
    <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-40 mb-8" />
            <Skeleton className="h-[320px] w-full rounded-2xl mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </main>
        <Footer />
    </div>
);

export default function BlogDetails() {
    const { slug } = useParams<{ slug: string }>();

    const { data: post, isLoading } = useQuery<BlogPost | null>({
        queryKey: ["blog-post", slug],
        enabled: !!slug,
        queryFn: async () => {
            if (!slug) return null;
            const { data, error } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("slug", slug)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        }
    });

    useEffect(() => {
        if (post?.id) {
            // Increment views on mount
            supabase.rpc('increment_blog_views', { post_id: post.id })
                .then(({ error }) => {
                    if (error) console.error("Error incrementing views:", error);
                });
        }
    }, [post?.id]);

    const readingTime = useMemo(() => {
        if (!post?.content) return 1;
        if (post.reading_time) return post.reading_time;
        const words = post.content.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }, [post]);

    if (isLoading) {
        return <BlogDetailsSkeleton />;
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl text-center">
                    <h1 className="text-2xl font-display font-bold mb-3">Post not found</h1>
                    <p className="text-muted-foreground mb-6">This blog post may have been removed or is not published.</p>
                    <Link to="/blog">
                        <Button variant="outline">Back to Blog</Button>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString();
    const ogImage = post.og_image_url || post.cover_image_url || "https://credswap.app/og-image.png";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title={post.seo_title || post.title}
                description={post.seo_description || post.excerpt || ""}
                image={ogImage}
                url={`https://credswap.app/blog/${post.slug}`}
                type="article"
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                        }}
                        className="gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Copy Link
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {post.type && (
                        <Badge variant="secondary" className="uppercase text-[11px] tracking-widest">
                            {post.type}
                        </Badge>
                    )}
                    {post.category && (
                        <Badge variant="outline" className="uppercase text-[11px] tracking-widest">
                            {post.category}
                        </Badge>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 leading-tight">
                    {post.title}
                </h1>
                {post.excerpt && (
                    <p className="text-lg text-muted-foreground mb-6">
                        {post.excerpt}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-8">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {publishedDate}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {readingTime} min read
                    </span>
                    <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {post.author_name || "CredSwap"}
                    </span>
                    <span className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full text-primary font-bold">
                        <Eye className="w-3 h-3" /> {post.views || 0} views
                    </span>
                </div>

                {post.cover_image_url && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 border border-border">
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <article className="max-w-none">
                    {post.content && post.content.trim().startsWith('<') ? (
                        <div className="ql-snow">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} className="ql-editor p-0" />
                        </div>
                    ) : (
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    a: ({ node, ...props }) => (
                                        <a {...props} target="_blank" rel="noreferrer" />
                                    ),
                                    img: ({ node, ...props }) => (
                                        <img {...props} className="rounded-xl border border-border" />
                                    )
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </article>

                {post.gallery_urls && post.gallery_urls.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {post.gallery_urls.map((url, idx) => (
                            <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-border">
                                <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="mt-10 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">#{tag}</Badge>
                        ))}
                    </div>
                )}

                {post.source_links && post.source_links.length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-lg font-semibold mb-2">Sources</h3>
                        <ul className="space-y-2 text-sm">
                            {post.source_links.map((link, idx) => (
                                <li key={idx}>
                                    <a href={link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
