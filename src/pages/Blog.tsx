import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { Calendar, User, ArrowRight, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { BlogPost } from "@/types/database";
import { cn } from "@/lib/utils";

export default function Blog() {
    const [activeType, setActiveType] = useState<"all" | "blog" | "news">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
        queryKey: ["blog-posts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blog_posts")
                .select("*")
                .order("published_at", { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const categories = useMemo(() => {
        const set = new Set<string>();
        posts.forEach((p) => p.category && set.add(p.category));
        return ["All", ...Array.from(set)];
    }, [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            if (activeType !== "all" && post.type !== activeType) return false;
            if (activeCategory !== "All" && post.category !== activeCategory) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = (
                    post.title?.toLowerCase().includes(q) ||
                    post.excerpt?.toLowerCase().includes(q) ||
                    post.category?.toLowerCase().includes(q) ||
                    post.author_name?.toLowerCase().includes(q)
                );
                if (!match) return false;
            }
            return true;
        });
    }, [posts, activeType, activeCategory, searchQuery]);

    const featuredPost = filteredPosts.find((post) => post.is_featured) || filteredPosts[0];
    const listPosts = featuredPost
        ? filteredPosts.filter((post) => post.id !== featuredPost.id)
        : filteredPosts;

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-300 font-sans text-white flex flex-col">
            <SEO
                title="Blog & News"
                description="College insights, student news, and career tips from CredSwap."
                url="https://credswap.app/blog"
                type="website"
            />
            <Navbar />
            
            {/* Premium Hero Section */}
            <section className="relative pt-16 pb-10 md:pt-24 md:pb-14 overflow-hidden">
                <div className="absolute top-0 left-[20%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />
                
                <div className="container relative z-10 px-6 lg:px-8 mx-auto flex flex-col gap-6 items-center text-center">
                    <div className="space-y-4 max-w-3xl flex flex-col items-center">
                        <div className="space-y-3">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.1]">
                                Blog & News.
                            </h1>
                            <p className="text-[15px] md:text-[17px] text-zinc-400 font-medium leading-[1.6] max-w-2xl mx-auto">
                                Practical insights, campus updates, and career guidance for students. Stay ahead with the latest from our community.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="flex-1 container mx-auto px-4 lg:px-8 pb-20 max-w-6xl relative z-20">
                
                {/* Premium Filter Section */}
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[24px] p-6 shadow-2xl mb-12 -mt-6">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Search Section */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10" />
                                    <input
                                        type="text"
                                        placeholder="Search articles, news, or guides..."
                                        className="w-full h-12 bg-[#111] border border-zinc-800 rounded-xl pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all outline-none placeholder:text-zinc-600"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Type Filter */}
                            <div className="lg:col-span-4 flex items-center justify-end gap-2 overflow-x-auto no-scrollbar">
                                {["all", "blog", "news"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveType(type as any)}
                                        className={cn(
                                            "px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 capitalize",
                                            activeType === type
                                                ? "bg-white text-black"
                                                : "bg-[#111] text-zinc-400 hover:text-white border border-zinc-800"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Section */}
                        <div className="pt-4 border-t border-zinc-900">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 whitespace-nowrap",
                                            activeCategory === cat
                                                ? "bg-zinc-800 text-white border-zinc-700"
                                                : "bg-[#111] text-zinc-500 hover:text-zinc-300 border border-zinc-900"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-[24px] border border-white/5 bg-[#0a0a0a] overflow-hidden p-3">
                                <Skeleton className="aspect-[4/3] w-full rounded-[20px] bg-zinc-900" />
                                <div className="p-4 pt-6 space-y-4">
                                    <Skeleton className="h-4 w-24 bg-zinc-900" />
                                    <Skeleton className="h-6 w-3/4 bg-zinc-900" />
                                    <Skeleton className="h-4 w-full bg-zinc-900" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {featuredPost && (
                            <div className="mb-12 rounded-[32px] border border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden p-3 group">
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <div className="aspect-video md:aspect-[4/3] rounded-[24px] overflow-hidden relative border border-white/5 bg-zinc-900">
                                        {featuredPost.cover_image_url ? (
                                            <img
                                                src={featuredPost.cover_image_url}
                                                alt={featuredPost.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                    </div>
                                    <div className="p-4 md:p-8 flex flex-col justify-center">
                                        <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
                                            {featuredPost.type && (
                                                <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-300">
                                                    {featuredPost.type}
                                                </div>
                                            )}
                                            {featuredPost.category && (
                                                <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    {featuredPost.category}
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 text-white leading-[1.1]">
                                            {featuredPost.title}
                                        </h2>
                                        {featuredPost.excerpt && (
                                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
                                                {featuredPost.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-8">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                                {featuredPost.author_name || "CredSwap"}
                                            </span>
                                        </div>
                                        <Link to={`/blog/${featuredPost.slug}`}>
                                            <button className="h-12 px-8 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 group/btn w-fit">
                                                Read Featured
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {listPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="group rounded-[24px] border border-white/5 bg-[#0a0a0a] overflow-hidden hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 flex flex-col p-2 md:p-3 hover:-translate-y-1"
                                >
                                    <div className="aspect-[4/3] relative rounded-[20px] overflow-hidden border border-white/5 bg-zinc-900">
                                        {post.cover_image_url ? (
                                            <img
                                                src={post.cover_image_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                                        )}
                                        {post.category && (
                                            <div className="absolute top-4 left-4 z-10">
                                                <div className="bg-black/60 backdrop-blur-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                                                    {post.category}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 z-0" />
                                    </div>
                                    
                                    <div className="p-4 pt-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-zinc-400" /> 
                                                {new Date(post.published_at || post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-display font-bold text-white mb-3 leading-tight line-clamp-2 group-hover:text-zinc-200 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                                            {post.excerpt || "Read the full article to learn more about this topic."}
                                        </p>
                                        
                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                                                    <User className="w-3 h-3 text-zinc-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    {post.author_name || "CredSwap"}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                Read <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {filteredPosts.length === 0 && (
                            <div className="text-center py-24 bg-[#0a0a0a] rounded-[32px] border border-white/5 mt-8">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-white mb-2">No posts found</h3>
                                <p className="text-zinc-500 text-sm max-w-md mx-auto">
                                    We couldn't find any articles matching your search or filters. Try adjusting them.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
