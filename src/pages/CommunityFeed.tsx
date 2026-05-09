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
        <div className="min-h-screen bg-black pb-24 selection:bg-white selection:text-black text-white">
            <Navbar />
            <SEO title={community ? `${community.name} - CredSwap` : "Community Feed"} description={community?.description} />

            {/* 1. Community Banner */}
            <div className="relative h-72 w-full bg-[#0a0a0a] overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                {/* Decorative blobs */}
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />

                <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10 pt-20">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 w-full">
                        <div className="h-20 w-20 md:h-28 md:w-28 rounded-2xl md:rounded-3xl bg-black shadow-2xl flex items-center justify-center border border-white/10 text-white shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {community.type === 'college' ? <MapPin className="w-10 h-10 md:w-12 md:h-12" /> : <Users className="w-10 h-10 md:w-12 md:h-12" />}
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4 md:gap-6 mb-1 md:mb-2">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white mb-3 tracking-tight line-clamp-2">{community.name}</h1>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    <Badge variant="secondary" className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] text-zinc-300 uppercase tracking-widest font-black">{community.type}</Badge>
                                    <Badge variant="outline" className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] text-zinc-300 uppercase tracking-widest font-black"><Users className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5" /> {community.members_count} Members</Badge>
                                </div>
                            </div>

                            <div className="flex gap-2 md:gap-3 shrink-0 w-full md:w-auto">
                                <Button variant="outline" className="flex-1 md:flex-none bg-[#111] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[11px]" onClick={() => navigate('/community')}>
                                    <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" /> Back
                                </Button>
                                <Button
                                    onClick={() => joinCommunity.mutate()}
                                    disabled={joinCommunity.isPending}
                                    className={`flex-1 md:flex-none h-12 px-8 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl active:scale-[0.98] ${isMember ? "bg-[#111] text-zinc-500 border border-white/10 hover:bg-white/5 hover:text-white" : "bg-white text-black hover:bg-zinc-200"}`}
                                >
                                    {joinCommunity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        isMember ? <><Check className="w-4 h-4 mr-2" /> Joined</> : "Join Community"}
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
                        <Card className="border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a]">
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 border border-white/10 bg-[#111]">
                                        <AvatarFallback className="bg-transparent text-white font-bold text-xs">ME</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <Textarea
                                            placeholder={isMember ? "Share updates, ask questions, or announce events..." : "Join the community to start posting!"}
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            disabled={!isMember}
                                            className="bg-[#111] border-white/10 focus:border-white/30 min-h-[120px] resize-none text-white placeholder:text-zinc-600 disabled:opacity-50 rounded-xl px-4 py-3"
                                        />
                                        <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Markdown supported</p>
                                            <Button
                                                onClick={() => createPost.mutate(newPostContent)}
                                                disabled={!newPostContent.trim() || createPost.isPending || !userSession || !isMember}
                                                className="h-10 px-6 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[10px] transition-all"
                                            >
                                                {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
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
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-[#0a0a0a]">
                                    <MessageSquare className="w-8 h-8 mb-4 opacity-50" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No posts yet. Be the first to start the conversation!</p>
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
                        <Card className="border-white/10 shadow-xl bg-[#0a0a0a]">
                            <CardHeader className="pb-3 border-b border-white/10 bg-[#111]">
                                <CardTitle className="text-sm flex items-center gap-2 font-display text-white uppercase tracking-widest font-black">
                                    <Info className="w-4 h-4 text-zinc-400" /> About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm text-zinc-400 leading-relaxed font-medium">
                                {community.description}
                            </CardContent>
                        </Card>

                        {/* Guidelines Widget */}
                        <Card className="border-white/10 shadow-xl overflow-hidden bg-[#0a0a0a]">
                            <CardHeader className="pb-3 border-b border-white/10 bg-[#111]">
                                <CardTitle className="text-sm flex items-center gap-2 font-display text-white uppercase tracking-widest font-black">
                                    <ShieldAlert className="w-4 h-4 text-zinc-400" /> Community Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex gap-3 text-sm text-zinc-400">
                                    <span className="font-black text-black bg-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
                                    <span className="font-medium mt-0.5">Be respectful and kind to fellow students.</span>
                                </div>
                                <div className="flex gap-3 text-sm text-zinc-400">
                                    <span className="font-black text-black bg-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
                                    <span className="font-medium mt-0.5">No spam, unauthorized ads, or irrelevant links.</span>
                                </div>
                                <div className="flex gap-3 text-sm text-zinc-400">
                                    <span className="font-black text-black bg-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
                                    <span className="font-medium mt-0.5">Keep discussions constructive and helpful.</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Links (Placeholder) */}
                        <Card className="border-white/10 shadow-xl bg-[#0a0a0a]">
                            <CardHeader className="pb-3 border-b border-white/10 bg-[#111]">
                                <CardTitle className="text-sm flex items-center gap-2 font-display text-white uppercase tracking-widest font-black">
                                    <Users className="w-4 h-4 text-zinc-400" /> Top Contributors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Coming soon: See who's most active!</p>
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
        <Card className="border-white/10 bg-[#0a0a0a] hover:border-white/30 transition-colors shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-0">
                <Avatar className="h-10 w-10 border border-white/10 bg-[#111]">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-transparent text-white font-bold text-xs">{profile?.full_name?.[0] || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-white">{profile?.full_name || "Student User"}</h4>
                    <p className="text-xs text-zinc-500 font-medium">
                        {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {userSession?.user?.id === post.user_id && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
                            <DropdownMenuItem
                                onClick={() => deletePost.mutate(post.id)}
                                className="text-red-500 focus:text-white focus:bg-red-500/20 cursor-pointer"
                                disabled={deletePost.isPending}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletePost.isPending ? "Deleting..." : "Delete Post"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="pt-4 pb-2 text-sm md:text-base leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {post.content}
            </CardContent>

            <div className="flex items-center gap-2 md:gap-4 px-4 py-3 mt-2 border-t border-white/5">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors rounded-xl ${hasLiked ? "text-red-500 hover:text-red-400 hover:bg-red-500/10" : "text-zinc-500 hover:text-white hover:bg-white/10"}`}
                    onClick={() => toggleLike.mutate()}
                >
                    <Heart className={`w-3.5 h-3.5 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                    {post.likes > 0 ? post.likes : "Like"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-colors rounded-xl"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageSquare className="w-3.5 h-3.5 mr-2" /> Comment
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-colors rounded-xl">
                    <Share2 className="w-3.5 h-3.5 mr-2" /> Share
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
        <div className="bg-[#111] p-4 border-t border-white/10">
            <div className="space-y-4 mb-4">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />}
                {comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3 text-sm group/comment">
                        <Avatar className="w-7 h-7 border border-white/10 bg-[#1a1a1a]">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className="text-[10px] bg-transparent text-white uppercase font-bold">
                                {(comment.profiles?.full_name?.[0] || "U")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-[#1a1a1a] rounded-2xl rounded-tl-sm p-3 px-4 shadow-sm border border-white/5 max-w-[85%] relative">
                            <div className="flex justify-between items-start gap-4 mb-1">
                                <span className="font-bold text-[11px] uppercase tracking-widest text-white">
                                    {comment.profiles?.full_name || "Unknown User"}
                                </span>
                                {userSession?.user?.id === comment.user_id && (
                                    <button
                                        onClick={() => deleteComment.mutate(comment.id)}
                                        disabled={deleteComment.isPending}
                                        className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
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
                            <p className="text-zinc-400 break-words text-sm font-medium">{comment.content}</p>
                        </div>
                    </div>
                ))}
                {comments?.length === 0 && <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 text-center py-2">No comments yet. Be the first!</div>}
            </div>

            <div className="flex gap-2">
                <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[44px] h-[44px] py-3 rounded-xl resize-none text-sm bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30"
                />
                <Button size="icon" className="h-[44px] w-[44px] rounded-xl bg-white text-black hover:bg-zinc-200 shrink-0" onClick={() => addComment.mutate(commentText)} disabled={!commentText.trim() || addComment.isPending}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
