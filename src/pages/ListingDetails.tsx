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
                other_user_id: item?.seller_id,
                item_id: item?.id
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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                <Link to="/marketplace" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left: Image */}
                    <div className="space-y-6">
                        <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-border bg-muted">
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4">
                                <Badge variant="secondary" className="backdrop-blur-md bg-background/80 shadow-sm border-0">
                                    {item.condition}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                    {item.category}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                                {item.title}
                            </h1>
                            <div className="text-3xl font-bold text-primary">₹{item.price}</div>
                        </div>

                        <div className="prose dark:prose-invert text-muted-foreground">
                            <p>{item.description}</p>
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-4 py-6 border-y border-border">
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg">
                                {seller?.full_name?.[0] || <User className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sold by</p>
                                <p className="font-semibold">{seller?.full_name || "CredSwap User"}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleChat}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            {isOwner ? (
                                <div className="space-y-3">
                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center mb-4">
                                        <p className="font-medium text-primary">You are the seller of this item.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button className="flex-1" onClick={() => navigate(`/marketplace/edit/${item.id}`)}>Edit Listing</Button>
                                        <Button variant="destructive" size="icon" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ) : item.status === 'approved' ? (
                                <Button
                                    size="xl"
                                    className="w-full text-lg shadow-xl shadow-primary/20"
                                    onClick={handleChat}
                                >
                                    <MessageSquare className="w-5 h-5 mr-2" />
                                    Message Seller to Buy
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-xl text-center border border-border">
                                        <p className="font-medium text-muted-foreground flex items-center justify-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            Item is {item.status} - {item.status === 'reserved' ? 'Sold (In Escrow)' : ''}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button variant="ghost" className="w-full" onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Link copied!");
                            }}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Listing
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-2xl border-border/50 shadow-large">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this listing? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/50 hover:bg-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6"
                            onClick={() => deleteMutation.mutate()}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
