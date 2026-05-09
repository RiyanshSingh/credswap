/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Send, Heart, MessageSquare, ArrowLeft, Users, Share2, MapPin, Info, ShieldAlert, MoreHorizontal, Check, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { SEO } from "@/components/SEO";

export default function CommunityFeed() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newPostContent, setNewPostContent] = useState("");
    const [userSession, setUserSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserSession(session);
        });
    }, []);

    // Fetch Community Details
    const { data: community, isLoading: isCommunityLoading } = useQuery({
        queryKey: ['community', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase.from('communities').select('*').eq('id', id).single();
            if (error) throw error;

            // Fetch exact member count
            const { count } = await supabase
                .from('community_members')
                .select('*', { count: 'exact', head: true })
                .eq('community_id', id);

            return { ...data, members_count: count || 0 };
        }
    });

    // Check Membership
    const { data: isMember, refetch: refetchMember } = useQuery({
        queryKey: ['isMember', id, userSession?.user?.id],
        enabled: !!id && !!userSession,
        queryFn: async () => {
            const { data } = await supabase.from('community_members')
                .select('*')
                .eq('community_id', id)
                .eq('user_id', userSession.user.id)
                .single();
            return !!data;
        }
    });

    // Fetch Posts
    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ['community-posts', id],
        enabled: !!id,
        queryFn: async () => {
            // Fetch posts with user details via join if possible, or we rely on user_id
            // Since 'profiles' might not be fully linked in FK relations for auto-detection in this setup:
            // We'll just fetch posts and then we might need to fetch profile names separately or hope 'user_id' is enough for now.
            // Ideally: .select('*, profiles(full_name, avatar_url)') but let's try robust fallback.
            const { data, error } = await supabase
                .from('community_posts')
                .select('*')
                .eq('community_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Manually fetch profiles for these posts if needed, or if join worked.
            // For MVP, if join fails, we show "User". 
            // Let's try to map user_ids to names if we can.
            return data;
        }
    });

    // Join/Leave Mutation
    const joinCommunity = useMutation({
        mutationFn: async () => {
            if (!userSession) throw new Error("Please login to join");

            if (isMember) {
                const { error } = await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', userSession.user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('community_members').insert({ community_id: id, user_id: userSession.user.id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            refetchMember();
            queryClient.invalidateQueries({ queryKey: ['community', id] }); // Update individual count
            queryClient.invalidateQueries({ queryKey: ['communities'] }); // Update list
            queryClient.invalidateQueries({ queryKey: ['featuredCommunities'] }); // Update homepage
            toast({
                title: isMember ? "Left Community" : "Joined Community",
                description: isMember ? "You have left this community." : "Welcome! You are now a member."
            });
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    });

    // Create Post Mutation
    const createPost = useMutation({
        mutationFn: async (content: string) => {
            if (!userSession) throw new Error("Must be logged in");
            if (!isMember) throw new Error("You must join the community to post.");

            const { error } = await supabase.from('community_posts').insert({
                community_id: id,
                user_id: userSession.user.id,
                content: content,
                likes: 0
            });

            if (error) throw error;
        },
        onSuccess: () => {
            setNewPostContent("");
            queryClient.invalidateQueries({ queryKey: ['community-posts', id] });
            toast({ title: "Posted!", description: "Your message is live." });
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    });

    if (isCommunityLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!community) return <div className="h-screen flex items-center justify-center">Community not found</div>;

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar />
            <SEO title={community ? `${community.name} - CredSwap` : "Community Feed"} description={community?.description} />

            {/* 1. Community Banner */}
            <div className="relative h-72 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden border-b border-border/50">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
                {/* Decorative blobs */}
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10 pt-20">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 w-full">
                        <div className="h-20 w-20 md:h-28 md:w-28 rounded-2xl md:rounded-3xl bg-card shadow-xl md:shadow-2xl flex items-center justify-center border border-border/50 text-primary shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {community.type === 'college' ? <MapPin className="w-10 h-10 md:w-12 md:h-12" /> : <Users className="w-10 h-10 md:w-12 md:h-12" />}
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4 md:gap-6 mb-1 md:mb-2">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mb-3 tracking-tight line-clamp-2">{community.name}</h1>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    <Badge variant="secondary" className="bg-background/50 backdrop-blur-md border border-primary/20 px-2.5 py-0.5 md:px-3 md:py-1 text-xs md:text-sm uppercase tracking-wider font-semibold">{community.type}</Badge>
                                    <Badge variant="outline" className="bg-background/50 backdrop-blur-md px-2.5 py-0.5 md:px-3 md:py-1 text-xs md:text-sm"><Users className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" /> {community.members_count} Members</Badge>
                                </div>
                            </div>

                            <div className="flex gap-2 md:gap-3 shrink-0 w-full md:w-auto">
                                <Button variant="outline" className="flex-1 md:flex-none bg-background/50 backdrop-blur-md border-primary/20 hover:bg-background/80" onClick={() => navigate('/community')}>
                                    <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" /> Back
                                </Button>
                                <Button
                                    onClick={() => joinCommunity.mutate()}
                                    disabled={joinCommunity.isPending}
                                    variant={isMember ? "secondary" : "gradient"}
                                    className={`flex-1 md:flex-none shadow-lg transition-all ${isMember ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "shadow-primary/20 md:px-6"}`}
                                >
                                    {joinCommunity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        isMember ? <><Check className="w-4 h-4 mr-1 md:mr-2" /> Joined</> : "Join Community"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Column: Feed */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Create Post */}
                        <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 border border-border">
                                        <AvatarFallback>ME</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <Textarea
                                            placeholder={isMember ? "Share updates, ask questions, or announce events..." : "Join the community to start posting!"}
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            disabled={!isMember}
                                            className="bg-background/50 border-input/50 focus:border-primary/50 min-h-[120px] resize-none text-base disabled:opacity-50"
                                        />
                                        <div className="flex justify-between items-center border-t border-border/50 pt-4">
                                            <p className="text-xs text-muted-foreground italic">Markdown supported</p>
                                            <Button
                                                onClick={() => createPost.mutate(newPostContent)}
                                                disabled={!newPostContent.trim() || createPost.isPending || !userSession || !isMember}
                                                size="sm"
                                                className="px-6"
                                            >
                                                {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                                Post Update
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Posts List */}
                        <div className="space-y-6">
                            {posts?.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No posts yet. Be the first to start the conversation!</p>
                                </div>
                            )}
                            {posts?.map((post: any) => (
                                <PostCard key={post.id} post={post} userSession={userSession} />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-6">
                        {/* About Widget */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                <CardTitle className="text-base flex items-center gap-2 font-display">
                                    <Info className="w-4 h-4 text-primary" /> About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed">
                                {community.description}
                            </CardContent>
                        </Card>

                        {/* Guidelines Widget */}
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b border-border/50 bg-orange-500/5">
                                <CardTitle className="text-base flex items-center gap-2 font-display text-orange-600 dark:text-orange-400">
                                    <ShieldAlert className="w-4 h-4" /> Community Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    <span className="font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">1</span>
                                    <span>Be respectful and kind to fellow students.</span>
                                </div>
                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    <span className="font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">2</span>
                                    <span>No spam, unauthorized ads, or irrelevant links.</span>
                                </div>
                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    <span className="font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">3</span>
                                    <span>Keep discussions constructive and helpful.</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Links (Placeholder) */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                <CardTitle className="text-base flex items-center gap-2 font-display">
                                    <Users className="w-4 h-4 text-primary" /> Top Contributors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-xs text-muted-foreground italic">Coming soon: See who's most active!</p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
            <MobileNav />
        </div >
    );
}

function PostCard({ post, userSession }: { post: any, userSession: any }) {
    const { id: communityId } = useParams<{ id: string }>();
    const [showComments, setShowComments] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Check if liked by current user
    const { data: hasLiked, refetch: refetchLike } = useQuery({
        queryKey: ['hasLiked', post.id, userSession?.user?.id],
        enabled: !!userSession,
        queryFn: async () => {
            const { data } = await supabase.from('post_likes')
                .select('*')
                .eq('post_id', post.id)
                .eq('user_id', userSession.user.id)
                .single();
            return !!data;
        }
    });

    const toggleLike = useMutation({
        mutationFn: async () => {
            if (!userSession) return;
            if (hasLiked) {
                await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userSession.user.id);
            } else {
                await supabase.from('post_likes').insert({ post_id: post.id, user_id: userSession.user.id });
            }
        },
        onSuccess: () => {
            refetchLike();
            queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
        }
    });

    const deletePost = useMutation({
        mutationFn: async (postId: string) => {
            const { error } = await supabase.from('community_posts').delete().eq('id', postId);
            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate the specific community's post list
            queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
            toast({ title: "Post Deleted", description: "Your post has been removed." });
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    });

    // Fetch User Profile
    const { data: profile } = useQuery({
        queryKey: ['profile', post.user_id],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', post.user_id).single();
            return data;
        },
        enabled: !!post.user_id
    });

    return (
        <Card className="hover:border-primary/30 transition-colors shadow-sm bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-4 pb-0">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.full_name?.[0] || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{profile?.full_name || "Student User"}</h4>
                    <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {userSession?.user?.id === post.user_id && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => deletePost.mutate(post.id)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                disabled={deletePost.isPending}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletePost.isPending ? "Deleting..." : "Delete Post"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="pt-4 pb-2 text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {post.content}
            </CardContent>

            <div className="flex items-center gap-6 px-6 py-4 mt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`text-muted-foreground transition-colors ${hasLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "hover:text-red-500 hover:bg-red-500/10"}`}
                    onClick={() => toggleLike.mutate()}
                >
                    <Heart className={`w-4 h-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                    {post.likes > 0 ? post.likes : "Like"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageSquare className="w-4 h-4 mr-2" /> Comment
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
            </div>

            {/* Comments Section */}
            {showComments && <CommentsSection postId={post.id} userSession={userSession} />}
        </Card>
    );
}

function CommentsSection({ postId, userSession }: { postId: string, userSession: any }) {
    const [commentText, setCommentText] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', postId],
        queryFn: async () => {
            // 1. Fetch Comments
            const { data: commentsData, error } = await supabase
                .from('community_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching comments:", error);
                return [];
            }
            if (!commentsData || commentsData.length === 0) return [];

            // 2. Fetch Profiles manually (since join might fail without loose-fk support)
            const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

            // 3. Merge data
            return commentsData.map((c: any) => ({
                ...c,
                profiles: profilesMap.get(c.user_id) || null
            }));
        }
    });

    const addComment = useMutation({
        mutationFn: async (text: string) => {
            if (!userSession) return;
            const { error } = await supabase.from('community_comments').insert({
                post_id: postId,
                user_id: userSession.user.id,
                content: text
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setCommentText("");
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
    });

    const deleteComment = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            toast({ title: "Comment Deleted", description: "Your comment has been removed." });
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete comment." });
        }
    });

    return (
        <div className="bg-muted/30 p-4 border-t border-border/50">
            <div className="space-y-4 mb-4">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mx-auto opacity-50" />}
                {comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3 text-sm group/comment">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary uppercase">
                                {(comment.profiles?.full_name?.[0] || "U")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-background rounded-lg p-2 px-3 shadow-sm border border-border/50 max-w-[85%] relative">
                            <div className="flex justify-between items-start gap-4">
                                <span className="font-semibold text-xs block mb-1 text-primary">
                                    {comment.profiles?.full_name || "Unknown User"}
                                </span>
                                {userSession?.user?.id === comment.user_id && (
                                    <button
                                        onClick={() => deleteComment.mutate(comment.id)}
                                        disabled={deleteComment.isPending}
                                        className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                                        title="Delete comment"
                                    >
                                        {deleteComment.isPending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="text-muted-foreground break-words">{comment.content}</p>
                        </div>
                    </div>
                ))}
                {comments?.length === 0 && <div className="text-xs text-muted-foreground text-center italic py-2">No comments yet. Be the first!</div>}
            </div>

            <div className="flex gap-2">
                <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[40px] h-[40px] py-2 resize-none text-sm bg-background"
                />
                <Button size="icon" onClick={() => addComment.mutate(commentText)} disabled={!commentText.trim() || addComment.isPending}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
