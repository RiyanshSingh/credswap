import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Tag, CheckCircle, Trash2, User, ExternalLink, ShoppingBag, Edit, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import defaultProductPreview from "@/assets/default-product-preview.png";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ItemCard({ item, isOwner, onStatusChange, onDelete, onEdit, isLoggedIn }: any) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleContact = () => {
        if (!isLoggedIn) {
            toast({
                title: "Login Required",
                description: "You must be logged in to contact the seller.",
                variant: "destructive"
            });
            navigate("/auth");
            return;
        }
        window.location.href = `mailto:${item.profiles?.email || 'student@college.edu'}?subject=Buying: ${item.title}`;
    };

    return (
        <Card
            className="group overflow-hidden bg-[#0a0a0a] border-zinc-900 shadow-lg hover:border-zinc-800 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full w-full rounded-2xl"
            onClick={async () => {
                // Record the view for AI recommendations
                if (isLoggedIn) {
                    supabase
                        .from('profiles')
                        .update({ 
                            last_viewed_item_id: item.id,
                            last_browsed_category: item.category 
                        })
                        .eq('id', (await supabase.auth.getSession()).data.session?.user.id)
                        .then(() => {
                            // Invalidate to refresh suggestions instantly
                            // Note: This happens in background so navigation is still fast
                        });
                }
                navigate(`/marketplace/${item.id}`);
            }}
        >
            {/* Image Area */}
            <div className="aspect-[4/3] bg-[#111] relative overflow-hidden border-b border-zinc-900">
                <img
                    src={item.image_url || defaultProductPreview}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    onError={(e) => {
                        e.currentTarget.src = defaultProductPreview;
                    }}
                />

                {/* Featured Badge */}
                {item.is_featured && (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="px-3 h-[22px] bg-zinc-800/60 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center justify-center gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            <Star className="w-3 h-3 fill-white text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-md leading-none">Featured</span>
                        </div>
                    </div>
                )}

                {/* Recommended Badge */}
                {item.is_recommended && !item.is_featured && (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="px-3 h-[22px] bg-zinc-800/60 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center justify-center gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-md leading-none">Recommended</span>
                        </div>
                    </div>
                )}
                
                {/* Listing Type Badge */}
                {item.listing_type && item.listing_type !== 'sell' && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="px-3 h-[22px] bg-zinc-800/60 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-md leading-none">
                                {item.listing_type} {item.rental_duration ? `• ${item.rental_duration}` : ''}
                            </span>
                        </div>
                    </div>
                )}

                {item.status !== 'approved' && item.status !== 'available' && (
                    <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Badge variant={item.status === 'sold' ? "secondary" : "destructive"} className="px-4 py-2 text-[10px] font-bold shadow-lg uppercase tracking-widest bg-white text-black border-none">
                            {item.status}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className="p-3 sm:p-5 flex flex-col flex-1">
                <div className="flex flex-col justify-between items-start gap-1 mb-2">
                    <span className="font-display font-bold text-lg text-white whitespace-nowrap mb-1">
                        ₹{item.price}
                    </span>
                    <h3 className="font-medium text-[15px] leading-tight line-clamp-2 text-zinc-300 group-hover:text-white transition-colors" title={item.title}>
                        {item.title}
                    </h3>
                </div>

                <div className="flex flex-col mt-auto">
                    <div
                        className="flex items-center gap-2 text-xs text-zinc-500 pt-3 pb-1 cursor-pointer group/user"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${item.seller_id}`);
                        }}
                    >
                        <div className="w-6 h-6 rounded-full bg-[#111] border border-zinc-800 flex items-center justify-center">
                            {item.profiles?.avatar_url ? (
                                <img src={item.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-3 h-3 text-zinc-400" />
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium truncate max-w-[120px] group-hover/user:text-white transition-colors">
                                {item.profiles?.full_name || "Student"}
                            </span>
                            {item.profiles?.is_verified && <VerifiedBadge />}
                        </div>
                        <span className="opacity-30">•</span>
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 ml-1">5.0</span>
                    </div>
                </div>
            </CardContent>

            {/* Footer Actions */}
            <CardFooter className="p-3 sm:p-5 pt-0 gap-2 border-t border-zinc-900 mt-2" onClick={(e) => e.stopPropagation()}>
                {isOwner ? (
                    <div className="flex w-full gap-2 pt-3">
                        {item.status !== 'sold' && (
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 border-zinc-800 hover:bg-[#111] text-zinc-300 hover:text-white h-9 text-xs"
                                onClick={() => onStatusChange(item.id, 'sold')}
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mark Sold</span><span className="sm:hidden">Sold</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-zinc-500 hover:bg-[#111] hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        className="w-full gap-2 h-10 bg-white hover:bg-zinc-200 text-black font-semibold mt-3 text-sm rounded-xl"
                        disabled={item.status === 'sold' || item.status === 'pending'}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/marketplace/${item.id}`);
                        }}
                        variant="default"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {isLoggedIn ? "View Details" : "Login to Buy"}
                    </Button>
                )}
            </CardFooter>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-2xl bg-[#0a0a0a] border-zinc-900 text-white" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete this listing? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                        <AlertDialogCancel className="rounded-xl border-zinc-800 bg-[#111] text-white hover:bg-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
