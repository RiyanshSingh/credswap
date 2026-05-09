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
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    unread_count,
                    participant1:participant1_id(full_name, avatar_url),
                    participant2:participant2_id(full_name, avatar_url),
                    item:item_id(title),
                    lost_item:lost_item_id(title)
                `)
                .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
                .not('deleted_by', 'cs', `{"${userId}"}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    useEffect(() => {
        const channel = supabase
            .channel('conversations-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant1_id=eq.${userId}` }, () => queryClient.invalidateQueries({ queryKey: ['conversations', userId] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant2_id=eq.${userId}` }, () => queryClient.invalidateQueries({ queryKey: ['conversations', userId] }))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId, queryClient]);

    const filtered = conversations?.filter((c: any) => {
        const otherUser = c.participant1_id === userId ? c.participant2 : c.participant1;
        return otherUser?.full_name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r w-full max-w-full overflow-hidden">
            {/* Header Area */}
            <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-display tracking-tight">Messages</h2>
                    <Avatar className="w-9 h-9 border-2 border-primary/20 p-0.5">
                        <AvatarImage src={myProfile?.avatar_url} className="rounded-full" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{myProfile?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-colors" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search people or messages..."
                            className="h-12 pl-11 bg-muted/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
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
                                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))
                    ) : filtered?.map((c: any) => {
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
                                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-1 ring-primary/50"
                                        : "hover:bg-muted/60 text-foreground"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className={cn(
                                        "w-11 h-11 border-2 transition-transform duration-300 group-hover:scale-105",
                                        isSelected ? "border-white/20" : "border-border/50"
                                    )}>
                                        <AvatarImage src={otherUser?.avatar_url} />
                                        <AvatarFallback className={isSelected ? "bg-white/20" : ""}>
                                            {otherUser?.full_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    <div className="flex items-center justify-between gap-2 w-full min-w-0 pr-4">
                                        <span className={cn(
                                            "font-bold text-sm truncate tracking-tight flex-1 min-w-0",
                                            isSelected ? "text-white" : "text-foreground"
                                        )}>
                                            {otherUser?.full_name}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-medium opacity-80 whitespace-nowrap shrink-0 ml-auto text-right",
                                            isSelected ? "text-white/90" : "text-muted-foreground"
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
                                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md truncate max-w-full mb-0.5",
                                                    isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                                )}>
                                                    📦 {c.item.title}
                                                </div>
                                            )}
                                            {c.lost_item && (
                                                <div className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md truncate max-w-full mb-0.5",
                                                    isSelected ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    🔍 {c.lost_item.title}
                                                </div>
                                            )}
                                            <p className={cn(
                                                "text-xs truncate w-full text-left",
                                                isSelected ? "text-white/80" : hasUnread ? "text-foreground font-bold" : "text-muted-foreground"
                                            )}>
                                                {c.last_message}
                                            </p>
                                        </div>

                                        {hasUnread && !isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 ml-auto">
                                                {c.unread_count}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-auto" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {filtered?.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground text-sm">No results match your search</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div >
    );
}
