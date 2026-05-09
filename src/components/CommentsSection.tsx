
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
}

interface CommentsSectionProps {
    noteId: string;
}

export function CommentsSection({ noteId }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [session, setSession] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        fetchComments();
    }, [noteId]);

    const fetchComments = async () => {
        try {
            // First get comments
            const { data: commentsData, error } = await supabase
                .from('comments')
                .select('*')
                .eq('note_id', noteId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Then manually join user profiles (since our schema might not have strict FK relation setup for automatic joining in client-js sometimes, or to be safe)
            // Or ideally use .select('*, profiles(full_name, avatar_url)') if relation exists.
            // Let's assume we need to fetch profiles separately for robustness if generic FKs used.

            if (!commentsData || commentsData.length === 0) {
                setComments([]);
                setIsLoading(false);
                return;
            }

            const userIds = [...new Set(commentsData.map(c => c.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            const commentsWithContent = commentsData.map(comment => ({
                ...comment,
                user: profiles?.find(p => p.id === comment.user_id)
            }));

            setComments(commentsWithContent as Comment[]);
        } catch (error) {
            console.error("Error loading comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        if (!session) {
            toast({ title: "Login Required", description: "Please login to comment.", variant: "destructive" });
            return;
        }

        setIsPosting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    note_id: noteId,
                    user_id: session.user.id,
                    content: newComment.trim()
                });

            if (error) throw error;

            setNewComment("");
            fetchComments(); // Refresh list
            toast({ title: "Comment Posted", description: "Your comment is live." });

        } catch (error) {
            toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-display font-bold">Comments ({comments.length})</h3>

            {/* Input Area */}
            {session ? (
                <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                        <AvatarFallback>{session.user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder="Add to the discussion..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="resize-none"
                        />
                        <Button
                            onClick={handlePostComment}
                            disabled={isPosting || !newComment.trim()}
                            className="float-right"
                            size="sm"
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Post Comment
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-secondary/30 rounded-lg text-center text-sm text-muted-foreground">
                    Please login to join the discussion.
                </div>
            )}

            {/* List */}
            <div className="space-y-6 mt-8">
                {isLoading ? (
                    <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : comments.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group animate-fade-in">
                            <Avatar className="w-10 h-10 border border-border shadow-sm">
                                <AvatarImage src={comment.user?.avatar_url} />
                                <AvatarFallback className="bg-muted text-muted-foreground font-bold">{comment.user?.full_name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/5 dark:bg-white/5 p-4 rounded-2xl border border-border/50 group-hover:border-border transition-colors">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-bold text-sm text-foreground">{comment.user?.full_name || "Unknown User"}</span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed font-medium">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
