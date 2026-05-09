import { MapPin, Heart, User, Sparkles, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
    room: any;
    isOwner?: boolean;
}

export function RoomCard({ room }: RoomCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const bgImage = room.images && room.images.length > 0
        ? room.images[0]
        : "https://images.unsplash.com/photo-1522771753033-6a586857f291?q=80&w=2070&auto=format&fit=crop";

    return (
        <Link
            to={`/rooms/${room.id}`}
            className="group block w-full relative outline-none select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative bg-[#0a0a0a] p-3 rounded-[2.5rem] border border-white/5 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col h-full hover:border-white/20 hover:shadow-[0_32px_80px_rgba(0,0,0,0.6)] group-hover:-translate-y-2">
                
                {/* Image Core */}
                <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5">
                    <img
                        src={bgImage}
                        alt={room.title}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-1000 ease-out",
                            isHovered ? "scale-110 blur-[2px] opacity-40" : "scale-100 opacity-80"
                        )}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-80 z-10 pointer-events-none" />

                    {/* Floating Info Overlays */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                            {room.type}
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white p-2.5 rounded-full hover:bg-white hover:text-black transition-all">
                            <Heart className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    {/* Hover Reveal Content */}
                    <div className={cn(
                        "absolute inset-0 z-30 flex flex-col items-center justify-center p-6 transition-all duration-500",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    )}>
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-2">Explore Space</p>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl">
                            <ChevronRight className="w-6 h-6 text-black" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    {room.status === 'taken' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
                            <div className="bg-white text-black text-[10px] px-6 py-2.5 uppercase tracking-[0.3em] font-black rounded-full shadow-2xl">
                                Occupied
                            </div>
                        </div>
                    )}
                </div>

                {/* Typography Layer */}
                <div className="px-4 pt-6 pb-2 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-display font-bold text-xl text-white leading-tight line-clamp-1">
                            {room.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0 mt-1">
                            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/5 rounded-lg">
                                <Star className="w-2.5 h-2.5 fill-white text-white" />
                                <span className="text-[10px] font-black text-white">4.9</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="truncate">{room.location}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {room.amenities?.slice(0, 2).map((am: string, i: number) => (
                            <div key={i} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {am}
                            </div>
                        ))}
                        {room.amenities?.length > 2 && (
                            <div className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                +{room.amenities.length - 2}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-white tracking-tight">₹{room.price}</span>
                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">/ Month</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <User className="w-3 h-3 text-zinc-500" />
                            </div>
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                {room.profiles?.full_name?.split(' ')[0] || "Owner"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
