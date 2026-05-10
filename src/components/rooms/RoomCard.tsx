import { MapPin, Heart, User, Sparkles, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
    room: any;
    isOwner?: boolean;
}

export function RoomCard({ room }: RoomCardProps) {

    const bgImage = room.images && room.images.length > 0
        ? room.images[0]
        : "https://images.unsplash.com/photo-1522771753033-6a586857f291?q=80&w=2070&auto=format&fit=crop";

    return (
        <Link
            to={`/rooms/${room.id}`}
            className="group block w-full relative outline-none select-none"
        >
            <div className="relative bg-[#0a0a0a] p-2 md:p-3 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl transition-all duration-500 ease-out flex flex-col h-full hover:border-white/30 hover:shadow-[0_0_50px_rgba(255,255,255,0.08)]">
                
                {/* Image Core */}
                <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5">
                    <img
                        src={bgImage}
                        alt={room.title}
                        className="w-full h-full object-cover transition-all duration-700 ease-out opacity-80 group-hover:opacity-100"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-80 z-10 pointer-events-none" />

                    {/* Floating Info Overlays */}
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex flex-col gap-2">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl">
                            {room.type}
                        </div>
                    </div>

                    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white p-1.5 md:p-2.5 rounded-full hover:bg-white hover:text-black transition-all">
                            <Heart className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    {room.status === 'taken' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
                            <div className="bg-white text-black text-[8px] md:text-[10px] px-4 py-2 md:px-6 md:py-2.5 uppercase tracking-[0.2em] md:tracking-[0.3em] font-black rounded-full shadow-2xl">
                                Occupied
                            </div>
                        </div>
                    )}
                </div>

                {/* Typography Layer */}
                <div className="px-2 md:px-4 pt-4 md:pt-6 pb-2 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 md:gap-4 mb-2 md:mb-3">
                        <h3 className="font-display font-bold text-base md:text-xl text-white leading-tight line-clamp-1">
                            {room.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-md md:rounded-lg">
                                <Star className="w-2 md:w-2.5 h-2 md:h-2.5 fill-white text-white" />
                                <span className="text-[8px] md:text-[10px] font-black text-white">4.9</span>
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
                    <div className="flex items-center justify-between mt-auto pt-4 md:pt-6 border-t border-white/5">
                        <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-1.5">
                            <span className="text-lg md:text-2xl font-bold text-white tracking-tight">₹{room.price}</span>
                            <span className="text-[7px] md:text-[10px] text-zinc-600 font-black uppercase tracking-widest">/ Month</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-500" />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest hidden xs:inline">
                                {room.profiles?.full_name?.split(' ')[0] || "Owner"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
