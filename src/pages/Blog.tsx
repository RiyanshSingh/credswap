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
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Blog & News"
                description="College insights, student news, and career tips from CredSwap."
                url="https://credswap.app/blog"
                type="website"
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Blog & News</h1>
                    <p className="text-lg text-muted-foreground">
                        Practical insights, campus updates, and career guidance for students.
                    </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeType === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveType("all")}
                        >
                            All
                        </Button>
                        <Button
                            variant={activeType === "blog" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveType("blog")}
                        >
                            Blog
                        </Button>
                        <Button
                            variant={activeType === "news" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveType("news")}
                        >
                            News
                        </Button>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            variant={activeCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-6 space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {featuredPost && (
                            <div className="mb-12 rounded-3xl border border-border bg-card overflow-hidden">
                                <div className="grid md:grid-cols-2">
                                    <div className="aspect-video md:aspect-auto">
                                        {featuredPost.cover_image_url ? (
                                            <img
                                                src={featuredPost.cover_image_url}
                                                alt={featuredPost.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/30" />
                                        )}
                                    </div>
                                    <div className="p-8">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {featuredPost.type && (
                                                <Badge variant="secondary" className="uppercase text-[10px] tracking-widest">
                                                    {featuredPost.type}
                                                </Badge>
                                            )}
                                            {featuredPost.category && (
                                                <Badge variant="outline" className="uppercase text-[10px] tracking-widest">
                                                    {featuredPost.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                                            {featuredPost.title}
                                        </h2>
                                        {featuredPost.excerpt && (
                                            <p className="text-muted-foreground mb-4">
                                                {featuredPost.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {featuredPost.author_name || "CredSwap"}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-primary">
                                                <Eye className="w-3 h-3" />
                                                {featuredPost.views || 0}
                                            </span>
                                        </div>
                                        <Link to={`/blog/${featuredPost.slug}`}>
                                            <Button>
                                                Read Featured
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {listPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        {post.cover_image_url ? (
                                            <img
                                                src={post.cover_image_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/30" />
                                        )}
                                        {post.category && (
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-medium">
                                                    {post.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(post.published_at || post.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {post.author_name || "CredSwap"}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-primary">
                                                <Eye className="w-3 h-3" /> {post.views || 0}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                            {post.excerpt || "Read the full article for details."}
                                        </p>
                                        <div className="text-primary text-sm font-semibold inline-flex items-center gap-1">
                                            Read More <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {filteredPosts.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                No posts found. Try a different filter or search.
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
