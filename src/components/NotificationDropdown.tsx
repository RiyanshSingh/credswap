import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationDropdownProps {
    adminMode?: boolean;
}

export function NotificationDropdown({ adminMode = false }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const location = useLocation();

    // Fetch Notifications
    const { data: notifications = [] } = useQuery({
        queryKey: [adminMode ? 'admin-notifications' : 'notifications'],
        queryFn: async () => {
            if (adminMode) {
                const { data, error } = await supabase.rpc('get_admin_notifications');

                if (error) {
                    console.error("Admin Notification Fetch Error", error);
                    return [];
                }
                return data as Notification[];
            } else {
                // User Mode: Standard Fetch
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return [];

                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                return data as Notification[];
            }
        },
        refetchInterval: 15000, // Poll every 15s (Crucial for Admin Mode as realtime is tricky with RPC auth)
    });

    // Calculate Unread
    useEffect(() => {
        const unread = notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
    }, [notifications]);

    // Realtime Subscription (User Mode Only)
    useEffect(() => {
        if (adminMode) return; // Skip for admin mode (rely on polling)

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        queryClient.invalidateQueries({ queryKey: [adminMode ? 'admin-notifications' : 'notifications'] });

                        // Show toast for new notification (Skip if user is on Inbox page)
                        const newNotif = payload.new as Notification;
                        if (newNotif && location.pathname !== "/inbox") {
                            toast({
                                title: newNotif.title,
                                description: newNotif.message,
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupSubscription();
    }, [queryClient, adminMode, location.pathname]);

    const markAsRead = async (id: string) => {
        if (adminMode) {
            await supabase.rpc('mark_admin_notification_read', {
                p_id: id
            });
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        } else {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    };

    const markAllRead = async () => {
        if (adminMode) {
            // For now, iterate or add 'mark_all_admin_read' RPC. 
            // To save time, we will just rely on individual read or implement cleared.
            // Let's implement individual loop for now to be safe without new SQL, or just skip.
            // Actually, let's just clear all for admin since 'mark all read' RPC wasn't explicitly made.
            // Or better, let's just skip this button for admin or map through them.
            notifications.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    };

    const clearAll = async () => {
        if (adminMode) {
            await supabase.rpc('clear_admin_notifications');
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('notifications').delete().eq('user_id', user.id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
                    <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center shadow-sm animate-in zoom-in-50">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">{adminMode ? 'System Admin Notifications' : 'Notifications'}</h4>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-6 text-xs text-primary px-2">
                                Mark all read
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearAll} title="Clear All" aria-label="Clear all notifications">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 flex gap-3 hover:bg-muted/50 transition-colors relative group",
                                        !n.is_read ? "bg-primary/5" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-2 shrink-0",
                                        !n.is_read ? "bg-primary" : "bg-transparent",
                                        n.type === 'error' && !n.is_read && "bg-destructive",
                                        n.type === 'success' && !n.is_read && "bg-success",
                                        n.type === 'warning' && !n.is_read && "bg-warning",
                                    )} />

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-sm font-medium leading-none", !n.is_read && "text-foreground")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {n.message}
                                        </p>

                                        <div className="flex items-center gap-2 mt-2">
                                            {n.link && (
                                                <Link to={n.link} onClick={() => {
                                                    setIsOpen(false);
                                                    markAsRead(n.id);
                                                }}>
                                                    <Button variant="link" className="h-auto p-0 text-xs gap-1">
                                                        View Details <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            )}
                                            {!n.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => markAsRead(n.id)}
                                                >
                                                    Mark read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
