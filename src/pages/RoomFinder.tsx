import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Search, Plus, BedDouble, MapPin, Sparkles, Home, Building } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RoomCard } from "@/components/rooms/RoomCard";
import { AddRoomDialog } from "@/components/rooms/AddRoomDialog";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { cn } from "@/lib/utils";

export default function RoomFinder() {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(searchParams.get("add") === "true");
    const [session, setSession] = useState<any>(null);
    const [isVerified, setIsVerified] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                supabase.from('profiles').select('is_verified').eq('id', session.user.id).single()
                    .then(({ data }) => setIsVerified(data?.is_verified || false));
            }
        });
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

        if (!isVerified) {
            toast({
                title: "Not Verified",
                description: "You must be a verified student to list properties.",
                variant: "destructive"
            });
            return;
        }

        setIsAddOpen(true);
    };

    return (
        <div className="min-h-screen bg-transparent font-sans text-white transition-colors duration-300 pb-20">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-16 pb-10 md:pt-24 md:pb-14 overflow-hidden">
                {/* Background Glows to match the subtle Bit Lura lighting */}
                <div className="absolute top-0 right-[20%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-[10%] w-[40%] h-[40%] bg-white/[0.01] blur-[120px] rounded-full pointer-events-none" />

                <div className="container relative z-10 px-6 lg:px-8 mx-auto flex flex-col gap-8 items-center text-center">
                    <div className="space-y-6 max-w-3xl flex flex-col items-center">

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.1]">
                                Find a place called Home.
                            </h1>
                            <p className="text-[15px] md:text-[17px] text-zinc-400 font-medium leading-[1.6] max-w-2xl mx-auto">
                                Discover verified rooms, PGs, and shared flats directly from students and owners. No brokerage, zero hassle.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {[
                            { label: "Total Places", value: String(rooms?.length || 0) },
                            { label: "Owners", value: String(new Set(rooms?.map(r => r.owner_id)).size) },
                            { label: "Live", value: String(rooms?.length || 0) }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center bg-white/[0.02] border border-white/10 px-6 py-4 rounded-[24px] shadow-2xl backdrop-blur-md min-w-[100px] group hover:bg-white/[0.04] transition-all duration-500">
                                <div className="text-xl font-bold text-white tracking-tighter mb-0.5 group-hover:scale-110 transition-transform">{stat.value}</div>
                                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.15em]">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Filter Section */}
            <section className="container mx-auto px-4 lg:px-8 relative z-20 -mt-8">
                <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-5 md:p-8 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Search */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10 group-focus-within:text-white transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by area or title..."
                                    className="w-full h-14 bg-white/5 border-white/5 rounded-2xl pl-14 pr-6 text-sm font-bold text-white focus:bg-white/10 transition-all outline-none placeholder:text-zinc-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Room Type */}
                        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setSelectedType(null)}
                                    className={cn(
                                        "flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]",
                                        selectedType === null
                                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    All Rooms
                                </button>
                                {roomTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={cn(
                                            "flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px]",
                                            selectedType === type.id
                                                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                : "text-zinc-500 hover:text-zinc-300"
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
                                className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                            >
                                List Property
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Listings Grid */}
            <section className="container mx-auto px-6 lg:px-8 py-12">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="text-xl md:text-2xl font-bold font-display text-white">
                        {selectedType ? `${selectedType} Listings` : "Recommended for you"}
                    </h2>
                    <span className="text-zinc-500 text-[11px] md:text-xs font-bold uppercase tracking-widest">
                        {filteredRooms?.length || 0} results
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-zinc-900" />
                                <div className="space-y-2 px-1">
                                    <Skeleton className="h-5 w-3/4 bg-zinc-900" />
                                    <Skeleton className="h-4 w-1/2 bg-zinc-900" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                        {filteredRooms?.map((room, i) => (
                            <div key={room.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-in">
                                <RoomCard room={room} />
                            </div>
                        ))}

                        {!isLoading && filteredRooms?.length === 0 && (
                            <div className="col-span-full py-24 text-center bg-[#0a0a0a] rounded-[24px] border border-zinc-900 flex flex-col items-center justify-center mt-4">
                                <div className="w-16 h-16 bg-[#111] border border-zinc-800 rounded-full flex items-center justify-center mb-6">
                                    <MapPin className="w-6 h-6 text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No places found</h3>
                                <p className="text-zinc-500 max-w-md mx-auto mb-6 text-sm">
                                    We couldn't find any matches for your search. Try changing your filters or check back later.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedType(null); }} className="rounded-full border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#111]">
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
            <Footer />
        </div>
    );
}
