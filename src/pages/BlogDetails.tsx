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
    <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-white flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 lg:py-20 max-w-4xl relative z-10">
            <div className="absolute top-0 left-[20%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none -z-10" />
            <Skeleton className="h-10 md:h-14 w-3/4 mb-4 bg-[#111]" />
            <Skeleton className="h-6 w-1/2 mb-8 bg-[#111]" />
            <Skeleton className="h-[320px] md:h-[450px] w-full rounded-[24px] mb-10 bg-[#111]" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-[#111]" />
                <Skeleton className="h-4 w-full bg-[#111]" />
                <Skeleton className="h-4 w-3/4 bg-[#111]" />
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
            <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-white flex flex-col">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Eye className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-3 text-white">Post not found</h1>
                    <p className="text-zinc-500 mb-8 max-w-md mx-auto">This blog post may have been removed or is not published.</p>
                    <Link to="/blog">
                        <button className="h-12 px-8 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 group/btn">
                            <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                            Back to Blog
                        </button>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString();
    const ogImage = post.og_image_url || post.cover_image_url || "https://credswap.app/og-image.png";

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-white flex flex-col relative overflow-x-hidden">
            <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none z-0" />
            <SEO
                title={post.seo_title || post.title}
                description={post.seo_description || post.excerpt || ""}
                image={ogImage}
                url={`https://credswap.app/blog/${post.slug}`}
                type="article"
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-10 lg:py-16 max-w-4xl relative z-10">
                <div className="flex items-center justify-between gap-3 mb-8">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {post.type && (
                        <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-300">
                            {post.type}
                        </div>
                    )}
                    {post.category && (
                        <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            {post.category}
                        </div>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6 text-white leading-[1.1] tracking-tight">
                    {post.title}
                </h1>
                
                {post.excerpt && (
                    <p className="text-lg md:text-xl text-zinc-400 mb-8 leading-relaxed max-w-3xl">
                        {post.excerpt}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-10 pb-10 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-300">{post.author_name || "CredSwap"}</span>
                            <span className="text-[9px] text-zinc-600">Author</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                        <span className="flex items-center gap-1.5" title="Published Date">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {publishedDate}
                        </span>
                        <span className="flex items-center gap-1.5" title="Reading Time">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" /> {readingTime} min read
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-white" title="Views">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /> {post.views || 0} views
                        </span>
                    </div>
                </div>

                {post.cover_image_url && (
                    <div className="aspect-video md:aspect-[21/9] w-full rounded-[24px] overflow-hidden mb-12 border border-white/5 bg-zinc-900 shadow-2xl relative">
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                )}

                <article className="max-w-none">
                    {post.content && post.content.trim().startsWith('<') ? (
                        <div className="ql-snow">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} className="ql-editor p-0 text-zinc-300 text-lg leading-relaxed font-sans" />
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none prose-lg prose-p:text-zinc-300 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-display prose-headings:font-bold prose-a:text-white prose-a:underline-offset-4 hover:prose-a:text-zinc-300 prose-img:rounded-[20px] prose-img:border-white/10 prose-hr:border-white/10">
                            <ReactMarkdown
                                components={{
                                    a: ({ node, ...props }) => (
                                        <a {...props} target="_blank" rel="noreferrer" />
                                    ),
                                    img: ({ node, ...props }) => (
                                        <img {...props} className="rounded-[20px] border border-white/10 shadow-2xl my-8" />
                                    )
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </article>

                {post.gallery_urls && post.gallery_urls.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-white/10">
                        <h3 className="text-xl font-display font-bold mb-6 text-white">Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {post.gallery_urls.map((url, idx) => (
                                <div key={idx} className="aspect-square md:aspect-video rounded-[20px] overflow-hidden border border-white/5 bg-zinc-900 hover:border-white/20 transition-colors group cursor-pointer">
                                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <div key={tag} className="px-4 py-1.5 bg-[#111] border border-white/5 rounded-full text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 cursor-pointer transition-all">
                                #{tag}
                            </div>
                        ))}
                    </div>
                )}

                {post.source_links && post.source_links.length > 0 && (
                    <div className="mt-12 p-6 bg-[#0a0a0a] border border-white/5 rounded-[24px]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Sources & References</h3>
                        <ul className="space-y-3 text-sm">
                            {post.source_links.map((link, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                    <a href={link} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white hover:underline underline-offset-4 break-all">
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
