import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin, Wifi, Wind, Utensils, Tv, Check, ArrowLeft, MessageCircle, Share2, ShieldCheck, Home,
    Maximize2, Heart, Star, Sparkles, Building2, Calendar, User, PlayCircle, ExternalLink, Fan, Lightbulb, Bed
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

    const { data: room, isLoading } = useQuery({
        queryKey: ['room', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rooms')
                .select('*, profiles(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
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
        return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 px-4 md:px-6"><Skeleton className="h-[60vh] w-full rounded-3xl" /></div></div>;
    }

    if (!room) {
        return <div className="min-h-screen flex items-center justify-center">Room not found</div>;
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
        <div className="min-h-screen bg-background pb-20 font-sans selection:bg-primary/20">
            <Navbar />

            {/* Main Container - Split Layout */}
            <div className="container mx-auto px-4 py-8 pt-24 md:pt-28">

                {/* Back Nav */}
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/rooms">
                        <Button variant="ghost" size="sm" className="hover:bg-secondary/50 text-muted-foreground hover:text-foreground gap-2 transition-all group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full hover:bg-secondary">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full hover:bg-secondary">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* LEFT COLUMN: Image Gallery */}
                    <div className="space-y-4">
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 border border-border/50 group">
                            <img
                                src={displayImage}
                                alt={room.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Badges */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge className="backdrop-blur-md bg-white/90 text-black border-0 shadow-sm px-3 py-1 text-sm">
                                    {room.type}
                                </Badge>
                                <Badge variant={room.status === 'available' ? 'default' : 'destructive'}>
                                    {room.status === 'available' ? 'Available' : 'Reserved'}
                                </Badge>
                            </div>
                        </div>
                        {/* Thumbnail Images */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {images.map((img: string, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${displayImage === img ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background scale-95' : 'border-transparent opacity-70 hover:opacity-100 hover:border-primary/50'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details & Actions */}
                    <div className="flex flex-col h-full space-y-8">

                        {/* Header Info */}
                        <div className="space-y-4 border-b border-border/50 pb-8">
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
                                {room.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-lg">
                                <div className="flex items-center gap-1.5 focus:text-primary transition-colors cursor-pointer hover:text-primary">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <span className="underline decoration-dashed decoration-border hover:decoration-primary cursor-pointer">{room.location}</span>
                                </div>
                                <span className="hidden md:inline text-border">•</span>
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-5 h-5" />
                                    Campus Housing
                                </div>
                            </div>
                        </div>

                        {/* Price & Action Block */}
                        <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Monthly Rent</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-display font-bold text-foreground">₹{room.price}</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Zero Brokerage
                                </p>
                            </div>
                            <Button size="lg" className="w-full md:w-auto px-8 h-12 shadow-lg shadow-primary/20 text-lg" onClick={handleContactOwner}>
                                <MessageCircle className="w-5 h-5 mr-2" /> Chat with Owner
                            </Button>
                        </div>

                        {/* Owner Info */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/30 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                            <div className="relative">
                                <img
                                    src={room.profiles?.avatar_url || "https://github.com/shadcn.png"}
                                    alt={room.profiles?.full_name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-background shadow-md"
                                />
                                {room.profiles?.verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border-2 border-background">
                                        <ShieldCheck className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Listed by</p>
                                <h3 className="text-lg font-bold text-foreground">{room.profiles?.full_name || "Campus Student"}</h3>
                            </div>
                            <div className="ml-auto">
                                <Button variant="outline" size="sm">View Profile</Button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-display font-semibold">About this details</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {room.description || "The owner has not provided a full description. Please contact them for more details."}
                            </p>
                        </div>

                        {/* Video Tour Link */}
                        {room.video_link && (
                            <div className="space-y-4 pt-4">
                                <h3 className="text-xl font-display font-semibold flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-primary" />
                                    Video Tour
                                </h3>
                                <a
                                    href={room.video_link.startsWith('http') ? room.video_link : `https://${room.video_link}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <PlayCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Watch Property Video</p>
                                            <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">Link provided by owner</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                            </div>
                        )}

                        {/* Amenities Grid */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-display font-semibold">Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {room.amenities?.map((am: string) => (
                                    <div key={am} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            {getAmenityIcon(am)}
                                        </div>
                                        <span className="font-medium text-sm">{am}</span>
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
