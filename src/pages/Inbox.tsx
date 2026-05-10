import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { usePresence } from "@/hooks/usePresence";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inbox() {
    const { session, loading } = useAuth();
    const [searchParams] = useSearchParams();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Mobile check
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Global Online Users State (Track presence while on Inbox page)
    const onlineUsers = usePresence(session?.user?.id);

    const queryClient = useQueryClient();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // When Inbox page mounts, immediately invalidate navbar dot
    useEffect(() => {
        if (session?.user?.id) {
            queryClient.invalidateQueries({ queryKey: ['unread-messages', session.user.id] });
        }
    }, [session?.user?.id, queryClient]);

    useEffect(() => {
        // Auto-select from URL
        const conversationId = searchParams.get('id') || searchParams.get('chat');
        if (conversationId) setSelectedId(conversationId);
    }, [searchParams]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex overflow-hidden pt-0 md:pt-4 max-w-7xl mx-auto w-full px-0 md:px-4 pb-0 md:pb-4">
                    <div className="flex w-full h-full bg-card md:border md:rounded-2xl overflow-hidden">
                        <div className="w-80 lg:w-96 border-r p-4 space-y-4 hidden md:block">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session) return (
        <div className="h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Please sign in to view messages.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 flex overflow-hidden pt-0 md:pt-4 max-w-7xl mx-auto w-full px-0 md:px-4 pb-0 md:pb-4">

                {/* Unified Container */}
                <div className="flex w-full h-full bg-[#0a0a0a] border border-white/10 ring-1 ring-inset ring-white/5 md:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none z-0" />

                    {/* Sidebar */}
                    <div className={`
                        md:w-80 lg:w-96 w-full md:flex flex-col border-r border-white/10 bg-transparent shrink-0 overflow-x-hidden
                        ${isMobile && selectedId ? 'hidden' : 'flex'}
                    `}>
                        <ChatSidebar
                            selectedId={selectedId}
                            onSelect={(id: string) => setSelectedId(id)}
                            userId={session.user.id}
                        />
                    </div>

                    {/* Window */}
                    <div className={`
                        flex-1 flex flex-col bg-background
                        ${isMobile && !selectedId ? 'hidden' : 'flex'}
                    `}>
                        <ChatWindow
                            conversationId={selectedId}
                            userId={session.user.id}
                            onBack={() => setSelectedId(null)}
                            onlineUsers={onlineUsers} // Pass global online state
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
