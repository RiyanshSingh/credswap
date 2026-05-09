import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BedDouble, Filter, MapPin, Sparkles, Home, Building } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RoomCard } from "@/components/rooms/RoomCard";
import { AddRoomDialog } from "@/components/rooms/AddRoomDialog";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const GridBg = () => (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    </div>
);

export default function RoomFinder() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [session, setSession] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    }, []);

    const { data: rooms, isLoading } = useQuery({
        queryKey: ['rooms'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rooms')
                .select('*, profiles!owner_id(full_name)')
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            if (error || (data && data.length > 0 && !data[0].profiles)) {
                if (error) console.error("Error fetching rooms:", error);
                const { data: basicData, error: basicError } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('status', 'available')
                    .order('created_at', { ascending: false });

                if (basicError) throw basicError;
                if (!basicData) return [];

                // Manual profile fetch
                const ownerIds = Array.from(new Set(basicData.map(r => r.owner_id).filter(Boolean)));
                if (ownerIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', ownerIds);
                    const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || []);
                    return basicData.map(r => ({ ...r, profiles: profileMap[r.owner_id] }));
                }
                return basicData;
            }
            return data || [];
        }
    });

    const filteredRooms = rooms?.filter(room => {
        const matchesSearch =
            room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = selectedType ? room.type === selectedType : true;

        return matchesSearch && matchesType;
    });

    const roomTypes = [
        { id: "Single", label: "Single Room", icon: Home },
        { id: "Shared", label: "Shared Room", icon: Sparkles },
        { id: "PG", label: "PG / Hostel", icon: Building },
        { id: "Flat", label: "Full Flat", icon: BedDouble },
    ];

    const handleListClick = () => {
        if (!session) {
            toast({
                title: "Login Required",
                description: "You need to sign in to list a room.",
            });
            navigate("/auth");
            return;
        }
        setIsAddOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] pb-20 font-sans selection:bg-primary/20 transition-colors duration-300">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
                <GridBg />
                
                {/* Background Glows */}
                <div className="absolute -top-24 left-1/3 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none" />

                <div className="container relative z-10 px-8">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-5 max-w-3xl">
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase shadow-sm">
                                    Housing Desk
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white dark:bg-[#111112] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 text-[10px] font-black tracking-widest uppercase">
                                    Verified Listings
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Find a place called <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Home.</span>
                                </h1>
                                <p className="text-base md:text-lg text-slate-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                                    Discover verified rooms, PGs, and shared flats directly from students and owners. No brokerage, zero hassle.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Total Places", value: String(rooms?.length || 0), icon: Home },
                                { label: "Verified Owners", value: String(new Set(rooms?.map(r => r.owner_id)).size), icon: Building },
                                { label: "Live Listings", value: String(rooms?.length || 0), icon: Sparkles }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#0B0B0C] border border-zinc-200 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-sm hover:border-indigo-500/30 transition-colors group">
                                    <stat.icon className="w-4.5 h-4.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="text-xs font-black text-white leading-none">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Filter Section */}
            <section className="container mx-auto px-6 -mt-8 md:-mt-10 relative z-20">
                <div className="bg-white dark:bg-[#0B0B0C] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 lg:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                        {/* Search */}
                        <div className="lg:col-span-4 space-y-2.5">
                            <div className="flex items-center gap-2 ml-1">
                                <Search className="w-3.5 h-3.5 text-indigo-500" />
                                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Search</label>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by area or title..."
                                    className="w-full h-11 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-xl px-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Room Type */}
                        <div className="lg:col-span-5 space-y-2.5">
                            <div className="flex items-center gap-2 ml-1">
                                <Home className="w-3.5 h-3.5 text-indigo-500" />
                                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Living Space</label>
                            </div>
                            <div className="flex bg-transparent sm:bg-zinc-50 dark:sm:bg-white/5 p-1 rounded-xl sm:border border-zinc-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setSelectedType(null)}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-lg text-[11px] font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap min-w-[80px]",
                                        selectedType === null
                                            ? "bg-white dark:bg-indigo-500 shadow-lg shadow-indigo-500/15 text-indigo-600 dark:text-white"
                                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                    )}
                                >
                                    All Places
                                </button>
                                {roomTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-[11px] font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]",
                                            selectedType === type.id
                                                ? "bg-white dark:bg-indigo-500 shadow-lg shadow-indigo-500/15 text-indigo-600 dark:text-white"
                                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                        )}
                                    >
                                        <type.icon className="w-3.5 h-3.5" />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List Property Button */}
                        <div className="lg:col-span-3">
                            <Button
                                onClick={handleListClick}
                                className="w-full h-11 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-xs shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                            >
                                <Plus className="w-4 h-4" /> List Your Property
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Listings Grid */}
            <section className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex items-end justify-between mb-6 md:mb-8">
                    <h2 className="text-lg md:text-2xl font-bold font-display">
                        {selectedType ? `${selectedType} Listings` : "Recommended for you"}
                    </h2>
                    <span className="text-muted-foreground text-[10px] md:text-sm uppercase tracking-wider font-bold">
                        Showing {filteredRooms?.length || 0} results
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                                <div className="space-y-2 px-2">
                                    <Skeleton className="h-6 w-3/4 rounded-full" />
                                    <Skeleton className="h-4 w-1/2 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 animate-fade-in-up">
                        {filteredRooms?.map((room, i) => (
                            <div key={room.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
                                <RoomCard room={room} />
                            </div>
                        ))}

                        {!isLoading && filteredRooms?.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-card/30 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                    <MapPin className="w-12 h-12 text-primary/50" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-foreground mb-3">No places found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                                    We couldn't find any matches for your search. Try changing your filters or check back later.
                                </p>
                                <Button variant="outline" size="lg" onClick={() => { setSearchQuery(""); setSelectedType(null); }} className="rounded-full">
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <AddRoomDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })}
                userId={session?.user?.id}
            />

            <MobileNav />
        </div>
    );
}
