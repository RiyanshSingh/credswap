import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatSidebar({ selectedId, onSelect, userId }: any) {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    // Fetch Current User Profile
    const { data: myProfile } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            return data;
        },
        enabled: !!userId
    });

    const { data: conversations, isLoading } = useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            // Fetch conversations
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant1:profiles!conversations_participant1_id_fkey(full_name, avatar_url),
                    participant2:profiles!conversations_participant2_id_fkey(full_name, avatar_url),
                    item:item_id(title)
                `)
                .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
                .not('deleted_by', 'cs', `{"${userId}"}`)
                .order('last_message_at', { ascending: false });

            if (error) {
                console.error("ChatSidebar Query Error:", error);
                throw error;
            }

            if (!data || data.length === 0) return [];

            // Fetch all unread messages for the current user across all conversations
            const conversationIds = data.map((c: any) => c.id);
            const { data: unreadMsgs } = await supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', conversationIds)
                .neq('sender_id', userId)
                .eq('is_read', false);

            // Build a map: conversation_id -> unread count
            const unreadMap: Record<string, number> = {};
            (unreadMsgs || []).forEach((m: any) => {
                unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
            });

            // Attach computed unread_count to each conversation
            return data.map((c: any) => ({
                ...c,
                unread_count: unreadMap[c.id] || 0
            }));
        }
    });

    useEffect(() => {
        const channel = supabase
            .channel('conversations-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId, queryClient]);

    const filtered = conversations?.filter((c: any) => {
        const otherUser = c.participant1_id === userId ? c.participant2 : c.participant1;
        return otherUser?.full_name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-transparent border-r border-white/10 w-full max-w-full overflow-hidden relative z-10">
            {/* Header Area */}
            <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-display tracking-tight text-white">Messages</h2>
                    <Avatar className="w-10 h-10 border border-white/20 p-0.5 bg-white/[0.05]">
                        <AvatarImage src={myProfile?.avatar_url} className="rounded-full" />
                        <AvatarFallback className="bg-white/90 text-black font-bold">{myProfile?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl group-focus-within:bg-white/10 transition-colors" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <Input
                            placeholder="Search people or messages..."
                            className="h-12 pl-11 bg-white/[0.03] border-white/5 rounded-2xl focus-visible:ring-1 focus-visible:ring-white/20 transition-all text-sm text-white placeholder:text-zinc-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 mt-4 w-full overflow-hidden">
                <div className="flex flex-col gap-2 px-3 pb-8 w-full max-w-full overflow-x-hidden">
                    {isLoading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl w-full">
                                <Skeleton className="w-11 h-11 rounded-full shrink-0 bg-white/5" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-1/3 bg-white/5" />
                                        <Skeleton className="h-3 w-10 bg-white/5" />
                                    </div>
                                    <Skeleton className="h-3 w-3/4 bg-white/5" />
                                </div>
                            </div>
                        ))
                    ) : (
                        filtered?.map((c: any) => {
                            const otherUser = c.participant1_id === userId ? c.participant2 : c.participant1;
                            const isSelected = selectedId === c.id;
                            const hasUnread = c.unread_count > 0;

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onSelect(c.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 relative group text-left w-full min-w-0 overflow-hidden",
                                        isSelected
                                            ? "bg-white/80 backdrop-blur-xl text-black shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]"
                                            : "hover:bg-white/[0.03] text-zinc-400"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className={cn(
                                            "w-11 h-11 border transition-transform duration-300 group-hover:scale-105",
                                            isSelected ? "border-black/10" : "border-white/10"
                                        )}>
                                            <AvatarImage src={otherUser?.avatar_url} />
                                            <AvatarFallback className={cn(isSelected ? "bg-black/5 text-black" : "bg-white/5 text-white")}>
                                                {otherUser?.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        {hasUnread && !isSelected && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-black z-10" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
                                        <div className="flex items-center justify-between gap-2 w-full min-w-0 pr-4">
                                            <span className={cn(
                                                "font-bold text-sm truncate tracking-tight flex-1 min-w-0",
                                                isSelected ? "text-black" : hasUnread ? "text-white" : "text-zinc-300"
                                            )}>
                                                {otherUser?.full_name}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-medium opacity-60 whitespace-nowrap shrink-0 ml-auto text-right",
                                                isSelected ? "text-black/60" : "text-zinc-500"
                                            )}>
                                                {isToday(new Date(c.last_message_at))
                                                    ? format(new Date(c.last_message_at), 'h:mm a')
                                                    : isYesterday(new Date(c.last_message_at))
                                                        ? "Yesterday"
                                                        : format(new Date(c.last_message_at), 'd/M/yy')
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                                            <div className="flex-1 min-w-0 flex flex-col items-start overflow-hidden">
                                                 {c.item && (
                                                    <div className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md max-w-full mb-0.5 flex items-center gap-1 overflow-hidden",
                                                        isSelected ? "bg-black/10 text-black" : "bg-white/10 text-white"
                                                    )}>
                                                        <div className={cn("w-1 h-1 rounded-full shrink-0", isSelected ? "bg-black" : "bg-white")} />
                                                        <span className="truncate">{c.item.title}</span>
                                                    </div>
                                                )}
                                                <p className={cn(
                                                    "text-xs truncate w-full text-left",
                                                    isSelected ? "text-black/70" : hasUnread ? "text-white font-medium" : "text-zinc-500"
                                                )}>
                                                    {c.last_message || "Started a conversation"}
                                                </p>
                                            </div>

                                            {hasUnread && !isSelected && (
                                                <div className="px-1.5 py-0.5 rounded-full bg-white text-black text-[9px] font-bold shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.3)] ml-auto">
                                                    {c.unread_count}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}

                    {filtered?.length === 0 && !isLoading && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <Search className="w-6 h-6 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 text-sm">No results match your search</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
