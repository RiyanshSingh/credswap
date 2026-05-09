/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin, Calendar, Tag, ArrowLeft, Share2,
    Loader2, MessageSquare, User, ShoppingCart,
    AlertCircle, CheckCircle, ShieldCheck, Wallet, CreditCard, Trash2
} from "lucide-react";
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
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
// Types
const ListingDetailsSkeleton = () => (
    <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
            <Skeleton className="h-4 w-24 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                <div className="space-y-6">
                    <Skeleton className="aspect-square md:aspect-[4/3] w-full rounded-3xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-10 md:h-12 w-3/4 mb-4" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    <div className="flex items-center gap-4 py-6 border-y border-border">
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                </div>
            </div>
        </main>
        <Footer />
    </div>
);

export interface MarketplaceItem {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    image_url: string;
    status: 'pending' | 'approved' | 'sold' | 'rejected' | 'reserved';
    seller_id: string;
    profiles?: {
        full_name: string;
        avatar_url: string;
        email?: string;
    };
    created_at: string;
}

export default function ListingDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    }, []);
    // 1. Fetch Item with Seller Profile
    const { data: item, isLoading, error: fetchError } = useQuery({
        queryKey: ['listing', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_items')
                .select('*, profiles!seller_id(*)') // Use correct FK for JOIN
                .eq('id', id)
                .single();
            if (error) {
                console.error("Listing fetch error:", error);
                throw error;
            }
            return data;
        }
    });

    const seller = item?.profiles; // Access joined profile directly
    const isOwner = session?.user?.id === item?.seller_id;

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const { data } = await supabase.from('marketplace_items').select('status').eq('id', id).single();
            if (data?.status === 'reserved' || data?.status === 'sold') {
                throw new Error("Item is locked in an active order and cannot be deleted.");
            }
            const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Listing deleted");
            navigate('/dashboard');
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };



    // Chat Handler
    const handleChat = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }

        try {
            const { data: convId, error } = await supabase.rpc('start_chat', {
                p_other_user_id: item?.seller_id,
                p_item_id: item?.id
            });
            if (error) throw error;

            // Send Context Message
            const contextMessage = `Hi, I'm interested in your listing '${item.title}' (₹${item.price}). Is it still available?`;
            await supabase.from('messages').insert({
                conversation_id: convId,
                sender_id: user.id,
                content: contextMessage
            });

            // Send Email Alert to Seller
            if (item?.profiles?.email && user.email) {
                // Fetch buyer's actual name
                const { data: buyerProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

                await sendEmail({
                    type: "order_alert",
                    payload: {
                        variant: "seller",
                        itemTitle: item.title,
                        sellerEmail: item.profiles.email,
                        buyerEmail: user.email,
                        buyerName: buyerProfile?.full_name || "A Student",
                        amount: item.price
                    }
                });
            }

            navigate(`/inbox?id=${convId}`);
        } catch (err: any) {
            console.error("Chat Error:", err);
            navigate(`/inbox`);
        }
    };

    if (isLoading) return <ListingDetailsSkeleton />;
    if (fetchError) return <div className="p-8 text-center text-red-500 font-bold">Error loading item: {(fetchError as Error).message || String(fetchError)}</div>;
    if (!item) return <div className="p-8 text-center text-muted-foreground font-medium text-lg mt-10">Item not found. It may have been deleted or the link is invalid.</div>;

    return (
        <div className="min-h-screen bg-transparent flex flex-col font-sans text-white">
            <Navbar />

            <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl relative z-10">
                <Link to="/marketplace" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-white mb-8 transition-colors group">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 mr-3 group-hover:border-white/10 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Marketplace
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left: Image */}
                    <div className="space-y-6">
                        <div className="relative aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent z-10 pointer-events-none" />
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-6 left-6 z-20">
                                <div className="px-4 py-2 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl text-[11px] font-bold uppercase tracking-widest text-white">
                                    {item.condition}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
                                    {item.category}
                                </div>
                                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight leading-tight">
                                {item.title}
                            </h1>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-light text-zinc-400">₹</span>
                                <span className="text-5xl font-display font-bold text-white tracking-tighter">{item.price}</span>
                            </div>
                        </div>

                        <div className="text-[15px] leading-relaxed text-zinc-400 font-medium max-w-xl">
                            <p>{item.description}</p>
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-5 py-8 border-y border-white/5">
                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <span className="relative z-10">{seller?.full_name?.[0] || <User className="w-7 h-7" />}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sold by</p>
                                <p className="text-lg font-bold text-white tracking-tight">{seller?.full_name || "CredSwap User"}</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-auto rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all px-6 h-11" 
                                onClick={handleChat}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="space-y-6">
                            {isOwner ? (
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <p className="font-bold text-zinc-400 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                            You are the owner of this listing
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button 
                                            className="flex-1 h-14 rounded-2xl bg-white text-black font-bold text-base hover:bg-zinc-200 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.1)] active:scale-[0.98]" 
                                            onClick={() => navigate(`/marketplace/edit/${item.id}`)}
                                        >
                                            Edit Listing
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="w-14 h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all text-zinc-400" 
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : item.status === 'approved' ? (
                                <Button
                                    size="xl"
                                    className="w-full h-16 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all shadow-[0_12px_40px_rgba(255,255,255,0.1)] active:scale-[0.98] group"
                                    onClick={handleChat}
                                >
                                    <MessageSquare className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                                    Message Seller to Buy
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
                                        <p className="font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                            Item is {item.status}
                                        </p>
                                        {item.status === 'reserved' && <p className="mt-2 text-sm text-zinc-600 font-medium italic">Sold (Payment in Escrow)</p>}
                                    </div>
                                </div>
                            )}

                            <Button 
                                variant="ghost" 
                                className="w-full h-14 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm tracking-widest uppercase" 
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied!");
                                }}
                            >
                                <Share2 className="w-4 h-4 mr-3" />
                                Share Listing
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-white tracking-tight">Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
                            Are you sure? This action is permanent and your listing will be removed from the campus marketplace forever.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-8">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                            onClick={() => deleteMutation.mutate()}
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
