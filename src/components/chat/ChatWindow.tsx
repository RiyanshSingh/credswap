import { useState, useEffect, useRef } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Phone, Video, MoreVertical, Send, Loader2, ArrowLeft, Smile, Image as ImageIcon, Paperclip, Check, CheckCheck, Reply, X } from "lucide-react";
import { ChatProfileDialog } from "./ChatProfileDialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ChatBackground } from "./ChatBackground";
import { motion } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export function ChatWindow({ conversationId, userId, onBack, onlineUsers }: any) {
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef<any>(null);
    const channelRef = useRef<any>(null);
    const lastTypingSentRef = useRef<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    // Fetch Conversation Details
    const { data: conversation } = useQuery({
        queryKey: ['conversation', conversationId],
        enabled: !!conversationId,
        queryFn: async () => {
            const { data } = await supabase
                .from('conversations')
                .select(`*, participant1:profiles!conversations_participant1_id_fkey(id, full_name, avatar_url), participant2:profiles!conversations_participant2_id_fkey(id, full_name, avatar_url)`)
                .eq('id', conversationId)
                .single();
            return data;
        }
    });

    const otherUser = conversation?.participant1_id === userId ? conversation.participant2 : conversation?.participant1;
    const isOnline = otherUser && onlineUsers.has(otherUser.id);

    // Fetch Messages
    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['messages', conversationId],
        enabled: !!conversationId,
        queryFn: async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, reply_to:reply_to_id(content, sender_id)')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            return data || [];
        },
    });

    // Real-time Subscription (Messages + Typing)
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    setOtherUserTyping(false); // Stop typing if message received
                })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId !== userId) {
                    setOtherUserTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setOtherUserTyping(false);
                    }, 2000);
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [conversationId, queryClient, userId]);

    const handleTyping = async () => {
        const now = Date.now();
        if (channelRef.current && now - lastTypingSentRef.current > 1000) {
            lastTypingSentRef.current = now;
            await channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId }
            });
        }
    };

    // Mark Messages as Read
    useEffect(() => {
        if (!conversationId || !messages.length) return;
        const unreadMessages = messages.filter((m: any) => m.sender_id !== userId && !m.is_read);
        if (unreadMessages.length > 0) {
            const markRead = async () => {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadMessages.map((m: any) => m.id));
            };
            markRead();
        }
    }, [conversationId, messages, userId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Send Message
    const sendMessage = useMutation({
        mutationFn: async ({ content, replyId }: { content: string; replyId?: string | null }) => {
            if (!conversationId) return;
            const { error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: userId,
                content: content,
                is_read: false,
                reply_to_id: replyId || null
            });
            if (error) throw error;
            await supabase.from('conversations').update({
                last_message: content,
                last_message_at: new Date().toISOString()
            }).eq('id', conversationId);
        },
        onMutate: async ({ content, replyId }) => {
            await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
            const previousMessages = queryClient.getQueryData(['messages', conversationId]);
            const tempId = Math.random().toString();
            const optimisticMessage = {
                id: tempId,
                conversation_id: conversationId,
                sender_id: userId,
                content: content,
                is_read: false,
                created_at: new Date().toISOString(),
                reply_to: replyId ? messages.find((m: any) => m.id === replyId) : null,
                reply_to_id: replyId || null
            };
            queryClient.setQueryData(['messages', conversationId], (old: any) => [...(old || []), optimisticMessage]);
            setNewMessage("");
            setReplyTo(null);
            return { previousMessages };
        },
        onError: (err, newTodo, context: any) => {
            queryClient.setQueryData(['messages', conversationId], context.previousMessages);
            toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });

    // Delete Conversation
    const deleteConversation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc('delete_conversation', { conversation_id: conversationId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Conversation deleted" });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (onBack) onBack();
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    // Scroll to Message Utility
    const scrollToMessage = (msgId: string) => {
        const element = document.getElementById(`msg-${msgId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedId(msgId);
            setTimeout(() => setHighlightedId(null), 2000);
        }
    };

    // Auto-focus input when replying
    useEffect(() => {
        if (replyTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyTo]);

    if (!conversationId) {
        return (
            <div className="h-full flex items-center justify-center bg-muted/20 text-muted-foreground flex-col gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Send className="w-8 h-8" />
                </div>
                <p>Select a conversation to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background/50 backdrop-blur-md animate-in fade-in duration-500">
            {/* Header */}
            <div className="h-20 border-b flex items-center justify-between px-3 sm:px-6 bg-background/80 backdrop-blur-xl z-20 shrink-0 shadow-sm overflow-hidden flex-nowrap w-full">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 overflow-hidden">
                    {onBack && (
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2 rounded-full shrink-0" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-muted/50 p-1 sm:pr-4 rounded-full transition-all duration-300 min-w-0 flex-1 overflow-hidden pr-2" onClick={() => setIsProfileOpen(true)}>
                        <div className="relative shrink-0">
                            <Avatar className="w-12 h-12 border-2 border-primary/10 shadow-sm">
                                <AvatarImage src={otherUser?.avatar_url} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                    {otherUser?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col min-w-0 overflow-hidden w-full">
                            <h3 className="font-bold text-sm sm:text-base leading-none tracking-tight truncate w-full">{otherUser?.full_name}</h3>
                            <div className="flex items-center gap-1.5 mt-1 min-w-0 flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
                                {otherUserTyping ? (
                                    <span className="text-xs text-primary font-bold animate-pulse flex items-center gap-1 whitespace-nowrap">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                        Typing...
                                    </span>
                                ) : (
                                    <div className="flex w-fit min-w-full items-center gap-1.5">
                                        {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                        <span className={cn(
                                            "text-xs font-medium whitespace-nowrap animate-marquee-scroll md:animate-none",
                                            isOnline ? "text-green-500" : "text-muted-foreground"
                                        )}>
                                            {isOnline ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <ChatProfileDialog userId={otherUser?.id} open={isProfileOpen} onOpenChange={setIsProfileOpen} />

                <div className="flex items-center shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                        <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                        <Video className="w-5 h-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-border/50">
                            <DropdownMenuItem className="text-destructive focus:text-destructive rounded-xl p-3 cursor-pointer" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-3" />
                                <span className="font-semibold text-sm">Delete Conversation</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Custom Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-2xl border-border/50 shadow-large">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Conversation?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete your conversation history with {otherUser?.full_name}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/50 hover:bg-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6"
                            onClick={() => deleteConversation.mutate()}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden">
                <ChatBackground />
                <ScrollArea className="h-full relative z-10 px-4 py-4">
                    <div className="space-y-1.5 max-w-4xl mx-auto pb-8">
                        {!isLoading && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center pt-20 text-center">
                                <Send className="w-12 h-12 text-primary/20 mb-4" />
                                <h4 className="text-lg font-bold">Start a Conversation</h4>
                            </div>
                        )}

                        {messages.map((msg: any, idx: number) => {
                            const isMe = msg.sender_id === userId;
                            const prevMessage = messages[idx - 1];
                            const nextMessage = messages[idx + 1];
                            const isSameSenderAsPrev = prevMessage?.sender_id === msg.sender_id;
                            const isSameSenderAsNext = nextMessage?.sender_id === msg.sender_id;
                            const isFirstInGroup = !isSameSenderAsPrev;
                            const isLastInGroup = !isSameSenderAsNext;

                            return (
                                <div key={msg.id} id={`msg-${msg.id}`} className={cn(
                                    "flex flex-col transition-all duration-300",
                                    isSameSenderAsPrev ? "mt-0.5" : "mt-3"
                                )}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.35, ease: "easeOut", delay: idx * 0.01 }}
                                        className={cn("flex group/message px-2 sm:px-4", isMe ? "justify-end" : "justify-start")}
                                    >
                                        <div className={cn("flex items-end gap-2 max-w-[85%] sm:max-w-[70%]", isMe && "flex-row-reverse")}>
                                            {!isMe && (
                                                <div className="w-8 shrink-0">
                                                    {!isSameSenderAsNext && (
                                                        <Avatar className="w-8 h-8 rounded-full border border-border/40 shrink-0 mb-1 ring-2 ring-background/10">
                                                            <AvatarImage src={otherUser?.avatar_url} />
                                                            <AvatarFallback className="text-[10px] bg-muted">{otherUser?.full_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            )}
                                            <div className={cn(
                                                "relative px-4 pt-2.5 pb-1.5 rounded-[1.25rem] text-[15px] break-words transition-all group duration-300 min-w-[80px]",
                                                isMe ? "bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/10" : "bg-background/80 backdrop-blur-md border border-border/30",
                                                isMe && isFirstInGroup && "rounded-tr-sm",
                                                !isMe && isFirstInGroup && "rounded-tl-sm",
                                                highlightedId === msg.id && "ring-4 ring-primary/40 animate-pulse scale-[1.02]"
                                            )}>
                                                {msg.reply_to && (
                                                    <div onClick={() => scrollToMessage(msg.reply_to_id)} className={cn("mb-2 p-2.5 rounded-2xl text-[11px] border-l-4 cursor-pointer hover:opacity-80 transition-opacity", isMe ? "bg-white/10 border-white/40" : "bg-muted/40 border-primary/30")}>
                                                        <p className="font-bold opacity-80 mb-1 flex items-center gap-1.5 uppercase tracking-tighter">
                                                            <Reply className="w-3 h-3" />
                                                            {msg.reply_to.sender_id === userId ? "You" : otherUser?.full_name}
                                                        </p>
                                                        <p className="opacity-70 line-clamp-1">{msg.reply_to.content}</p>
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <p className="leading-[1.4] font-medium tracking-tight whitespace-pre-wrap inline">
                                                        {msg.content}
                                                        <span className="inline-block w-[65px] h-2" />
                                                    </p>
                                                    <div className="absolute -bottom-0.5 -right-1 flex items-center gap-1 opacity-70 text-[10px] font-bold">
                                                        <span className="text-[10px]">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                                        {isMe && (
                                                            msg.is_read ? (
                                                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                                            ) : (
                                                                <CheckCheck className="w-3.5 h-3.5 text-white/60" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn("absolute top-0 opacity-0 group-hover/message:opacity-100 transition-all duration-300 flex scale-90 group-hover/message:scale-100 items-center h-full", isMe ? "-left-12 pr-4" : "-right-12 pl-4")}>
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-md border border-border/40 hover:bg-primary/10 shadow-xl" onClick={() => setReplyTo(msg)}>
                                                        <Reply className="w-4 h-4 text-primary" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} className="h-4" />
                    </div>
                </ScrollArea>
            </div>

            {/* Input Footer */}
            <div className="p-4 sm:p-6 bg-background/95 backdrop-blur-xl border-t z-20">
                <div className="max-w-4xl mx-auto">
                    {replyTo && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between bg-primary/5 p-4 rounded-3xl mb-3 border border-primary/10">
                            <div className="flex items-center gap-3">
                                <Reply className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary text-xs">Replying to {replyTo.sender_id === userId ? "yourself" : otherUser?.full_name}</span>
                                    <span className="text-muted-foreground text-xs line-clamp-1 italic">{replyTo.content}</span>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setReplyTo(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 bg-muted/50 rounded-[2rem] border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all duration-300 ring-4 ring-transparent focus-within:ring-primary/5 px-6 py-2 flex items-start gap-3 min-h-[56px] shadow-sm">
                            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0 rounded-full">
                                        <Smile className="w-5 h-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start" side="top" sideOffset={15}>
                                    <EmojiPicker theme={Theme.AUTO} onEmojiClick={(emojiObject) => setNewMessage(prev => prev + emojiObject.emoji)} />
                                </PopoverContent>
                            </Popover>
                            <Input
                                ref={inputRef}
                                placeholder="Write your message..."
                                value={newMessage}
                                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (newMessage.trim()) sendMessage.mutate({ content: newMessage, replyId: replyTo?.id });
                                    }
                                }}
                                className="bg-transparent border-0 focus-visible:ring-0 px-0 mt-0.5 py-0 min-h-[40px] text-base"
                            />
                        </div>
                        <Button
                            onClick={() => sendMessage.mutate({ content: newMessage, replyId: replyTo?.id })}
                            disabled={!newMessage.trim() || sendMessage.isPending}
                            className="rounded-full w-[56px] h-[56px] shadow-lg shadow-primary/30 shrink-0"
                        >
                            {sendMessage.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
