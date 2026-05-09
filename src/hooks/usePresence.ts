import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence(userId: string | undefined) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        // 1. Join the presence channel
        const channel = supabase.channel('online-users');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const userIds = new Set<string>();

                // Extract all user IDs from the presence state
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_id) userIds.add(p.user_id);
                    });
                });

                setOnlineUsers(userIds);
            })
            .on('presence', { event: 'join' }, ({ newPresences }: any) => {
                setOnlineUsers((prev) => {
                    const next = new Set(prev);
                    newPresences.forEach((p: any) => next.add(p.user_id));
                    return next;
                });
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
                setOnlineUsers((prev) => {
                    const next = new Set(prev);
                    leftPresences.forEach((p: any) => next.delete(p.user_id));
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track our own presence
                    await channel.track({ user_id: userId, online_at: new Date().toISOString() });
                }
            });

        // 2. Periodically update DB last_seen (every 2 minutes) matches typical "Active" windows
        const interval = setInterval(async () => {
            await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', userId);
        }, 60 * 1000); // 1 minute

        // Initial update
        supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [userId]);

    return onlineUsers;
}
