import { MapPin, Heart, User, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
    room: any;
    isOwner?: boolean;
}

export function RoomCard({ room }: RoomCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Helper to get first image or placeholder
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
            {/* Main Card Container */}
            <div className="relative bg-white dark:bg-zinc-900 p-2 md:p-2.5 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-200/80 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-500 ease-out flex flex-col h-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                
                {/* Image Section */}
                <div className="relative w-full aspect-[16/10] md:aspect-[4/3] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                        src={bgImage}
                        alt={room.title}
                        className={cn(
                            "w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-transform",
                            isHovered ? "scale-105" : "scale-100"
                        )}
                    />
                    
                    {/* Top Layer Gradient (Very Subtle) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent opacity-80 z-10 pointer-events-none" />

                    {/* Top Left Badges */}
                    <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 z-20 flex gap-1.5">
                        <div className="bg-white/95 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-[10px] md:text-[11px] font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm">
                            {room.type}
                        </div>
                        {room.status === 'new' && (
                            <div className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> New
                            </div>
                        )}
                    </div>

                    {/* Bookmark / Heart (Top Right) */}
                    <button 
                        className="absolute top-2.5 right-2.5 md:top-3 md:right-3 z-20 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/95 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-600 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 hover:scale-110 active:scale-95 transition-all shadow-sm"
                        onClick={(e) => { e.preventDefault(); }}
                    >
                        <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>

                    {/* Status Badge if taken */}
                    {room.status === 'taken' && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center">
                            <div className="bg-white text-black text-xs md:text-base px-5 py-1.5 md:px-6 md:py-2 uppercase tracking-widest font-black rounded-full shadow-2xl">
                                Rented Out
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-1.5 pt-3 pb-1 md:px-2 md:pt-4 md:pb-2 flex flex-col flex-1">
                    {/* Title & Rating */}
                    <div className="flex justify-between items-start gap-3 md:gap-4 mb-1 md:mb-1.5">
                        <h3 className="font-display font-bold text-base md:text-[1.15rem] xl:text-xl text-zinc-900 dark:text-zinc-50 leading-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {room.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-amber-400 text-amber-500" />
                            <span className="text-[11px] md:text-[12px] font-bold text-zinc-900 dark:text-zinc-100">4.9</span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 md:gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] md:text-xs mb-2 md:mb-3">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                        <span className="truncate">{room.location}</span>
                    </div>

                    {/* Amenities - Minimal Dot Separated List */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] md:text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mb-3 md:mb-4">
                        {room.amenities?.slice(0, 3).map((am: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <span>{am}</span>
                                {i < Math.min(room.amenities.length, 3) - 1 && (
                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                )}
                            </div>
                        ))}
                        {room.amenities?.length > 3 && (
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <span>+{room.amenities.length - 3}</span>
                            </div>
                        )}
                        {(!room.amenities || room.amenities.length === 0) && (
                            <span>Basic amenities included</span>
                        )}
                    </div>

                    {/* Footer: Price & Poster */}
                    <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">₹{room.price}</span>
                            <span className="text-[10px] md:text-xs text-zinc-500 font-medium">/mo</span>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                                {/* Use generic icon for user */}
                                <User className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
                            </div>
                            <span className="text-[9px] md:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
                                {room.profiles?.full_name?.split(' ')[0] || "Owner"}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </Link>
    );
}
