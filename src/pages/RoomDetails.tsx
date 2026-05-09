import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin, Wifi, Wind, Utensils, Tv, Check, ArrowLeft, MessageCircle, Share2, ShieldCheck, Home,
    Maximize2, Heart, Star, Sparkles, Building2, Calendar, User, PlayCircle, ExternalLink, Fan, Lightbulb, Bed, Box
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function RoomDetails() {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { data: room, isLoading, error: roomError } = useQuery({
        queryKey: ['room', id],
        queryFn: async () => {
            // Try with profiles join first
            const { data, error } = await supabase
                .from('rooms')
                .select('*, profiles(*)')
                .eq('id', id)
                .single();

            if (!error && data) return data;

            // Fallback: fetch room without profiles join (RLS on profiles may block)
            const { data: basicData, error: basicError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', id)
                .single();

            if (basicError) throw basicError;

            // Manually fetch owner profile if room found
            if (basicData?.owner_id) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .eq('id', basicData.owner_id)
                    .single();
                return { ...basicData, profiles: profile || null };
            }

            return basicData;
        }
    });

    const handleContactOwner = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ title: "Login Required", description: "Please login to contact the owner." });
            navigate("/auth");
            return;
        }

        if (session.user.id === room.owner_id) {
            toast({ title: "It's your listing!", description: "You cannot chat with yourself." });
            return;
        }

        try {
            toast({ title: "Improving your experience...", description: "Connecting you with the owner..." });

            // Atomic RPC: Creates Chat + Sends Message + Notifies Owner
            // This ensures everything happens successfully or not at all
            const { data: chatId, error } = await supabase.rpc('create_room_inquiry', {
                p_room_id: room.id,
                p_owner_id: room.owner_id
            });

            if (error) throw error;
            navigate(`/inbox?id=${chatId}`);
        } catch (err) {
            console.error("Chat error", err);
            // Fallback just in case
            navigate('/inbox');
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#030303]"><Navbar /><div className="container py-20 px-4 md:px-6"><Skeleton className="h-[60vh] w-full rounded-[40px] bg-white/5" /></div></div>;
    }

    if (!room || roomError) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center gap-6">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                        <Home className="w-10 h-10 text-zinc-500" />
                    </div>
                    <h2 className="text-3xl font-bold font-display tracking-tight text-white">Room not found</h2>
                    <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">This listing may have been removed, or you may not have access to view it.</p>
                    <Button onClick={() => navigate('/rooms')} className="mt-8 gap-3 h-14 px-8 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold tracking-tight shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all">
                        <ArrowLeft className="w-5 h-5" />
                        Browse Rooms
                    </Button>
                </div>
            </div>
        );
    }

    const images = room.images && room.images.length > 0 ? room.images : ["https://images.unsplash.com/photo-1522771753033-6a586857f291?q=80&w=2070&auto=format&fit=crop"];
    const displayImage = selectedImage || images[0];

    // Amenity Icon Mapper
    const getAmenityIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('wifi')) return <Wifi className="w-5 h-5" />;
        if (lower.includes('ac') || lower.includes('condition')) return <Wind className="w-5 h-5" />;
        if (lower.includes('fan')) return <Fan className="w-5 h-5" />;
        if (lower.includes('light')) return <Lightbulb className="w-5 h-5" />;
        if (lower.includes('bed')) return <Bed className="w-5 h-5" />;
        if (lower.includes('food') || lower.includes('mess')) return <Utensils className="w-5 h-5" />;
        if (lower.includes('tv')) return <Tv className="w-5 h-5" />;
        if (lower.includes('parking')) return <Building2 className="w-5 h-5" />;
        return <Sparkles className="w-5 h-5" />;
    };

    return (
        <div className="min-h-screen bg-[#030303] pb-20 font-sans text-white selection:bg-white/20">
            <Navbar />

            {/* Main Container - Split Layout */}
            <div className="container mx-auto px-6 lg:px-8 py-8 pt-28 md:pt-36">

                {/* Back Nav */}
                <div className="mb-8 flex items-center justify-between">
                    <Link to="/rooms">
                        <Button variant="ghost" size="sm" className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 gap-3 transition-all group font-bold tracking-tight">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to listings
                        </Button>
                    </Link>
                    <div className="flex gap-3">
                        <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400 hover:text-white transition-all">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400 hover:text-white transition-all">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

                    {/* LEFT COLUMN: Image Gallery */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group bg-zinc-900">
                            <img
                                src={displayImage}
                                alt={room.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
                            {/* Overlay Badges */}
                            <div className="absolute top-6 left-6 flex gap-3 z-10">
                                <div className="bg-black/40 backdrop-blur-xl text-white border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                    {room.type}
                                </div>
                                <div className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl backdrop-blur-xl border border-white/10 shadow-xl",
                                    room.status === 'available' ? "bg-white text-black" : "bg-red-500/80 text-white"
                                )}>
                                    {room.status === 'available' ? 'Available' : 'Occupied'}
                                </div>
                            </div>
                        </div>
                        {/* Thumbnail Images */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-4">
                                {images.map((img: string, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`aspect-square rounded-[20px] overflow-hidden border-2 cursor-pointer transition-all duration-300 ${displayImage === img ? 'border-white scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details & Actions */}
                    <div className="flex flex-col h-full space-y-10">

                        {/* Header Info */}
                        <div className="space-y-6 border-b border-white/10 pb-10">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight">
                                {room.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-5 text-zinc-400 text-[11px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group">
                                    <MapPin className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                    <span>{room.location}</span>
                                </div>
                                <span className="hidden md:inline text-white/20">•</span>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-zinc-500" />
                                    Campus Housing
                                </div>
                            </div>
                        </div>

                        {/* Price & Action Block */}
                        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 flex flex-col xl:flex-row items-center justify-between gap-8 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-white/[0.05] transition-all" />
                            <div className="relative z-10 w-full xl:w-auto">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">Monthly Rent</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-5xl font-display font-bold text-white tracking-tighter">₹{room.price}</span>
                                    <span className="text-zinc-500 font-bold">/mo</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 mt-4">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Verified Listing</span>
                                </div>
                            </div>
                            <Button size="lg" className="w-full xl:w-auto px-10 h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] z-10 shrink-0" onClick={handleContactOwner}>
                                <MessageCircle className="w-5 h-5 mr-3" /> Chat with Owner
                            </Button>
                        </div>

                        {/* Owner Info */}
                        <div className="flex items-center gap-5 p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10">
                                    <img
                                        src={room.profiles?.avatar_url || "https://github.com/shadcn.png"}
                                        alt={room.profiles?.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {room.profiles?.verified && (
                                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-xl border-2 border-[#0a0a0a] shadow-lg">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Listed By</p>
                                <h3 className="text-xl font-bold text-white tracking-tight">{room.profiles?.full_name || "Campus Student"}</h3>
                            </div>
                            <div className="ml-auto">
                                <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-bold border-none shadow-none">View Profile</Button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" /> About this property
                            </h3>
                            <p className="text-zinc-300 leading-relaxed font-medium">
                                {room.description || "No supplemental data provided. Please contact the owner for more details."}
                            </p>
                        </div>

                        {/* Video Tour Link */}
                        {room.video_link && (
                            <div className="space-y-4 pt-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <PlayCircle className="w-3.5 h-3.5" /> Video Tour
                                </h3>
                                <a
                                    href={room.video_link.startsWith('http') ? room.video_link : `https://${room.video_link}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between p-5 rounded-[24px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all group-hover:scale-110 shadow-lg">
                                            <PlayCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white tracking-tight">Watch Property Video</p>
                                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">External Link</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                                </a>
                            </div>
                        )}

                        {/* Amenities Grid */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <Box className="w-3.5 h-3.5" /> Amenities
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {room.amenities?.map((am: string) => (
                                    <div key={am} className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-[20px] border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0">
                                            {getAmenityIcon(am)}
                                        </div>
                                        <span className="font-bold text-sm text-zinc-300 tracking-tight">{am}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}
