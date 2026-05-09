
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Search, Plus, ShoppingBag, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { AddItemDialog } from "@/components/marketplace/AddItemDialog";
import { EditItemDialog } from "@/components/marketplace/EditItemDialog";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { MarketplaceItem } from "@/types/database";
import { Session } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export default function Marketplace() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    }, []);

    const { data: items, isLoading } = useQuery<MarketplaceItem[]>({
        queryKey: ['marketplace-items', debouncedSearchQuery, selectedCategory],
        queryFn: async () => {
            let query = supabase
                .from('marketplace_items')
                .select('*, profiles!seller_id(*)')
                .eq('status', 'approved');

            if (selectedCategory !== "All") {
                query = query.eq('category', selectedCategory);
            }

            if (debouncedSearchQuery) {
                query = query.or(`title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching items:", error);
                return [];
            }
            return data || [];
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
            toast({ title: "Item Removed", description: "Your listing has been deleted." });
        },
        onError: () => toast({ title: "Error", description: "Could not delete item.", variant: "destructive" })
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('marketplace_items').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
            toast({ title: "Status Updated", description: "Item status has been changed." });
        }
    });

    const filteredItems = items;

    const categories = ["All", "Books", "Electronics", "Furniture", "Stationery", "Other"];

    const handleSellClick = () => {
        if (!session) {
            toast({
                title: "Sign In Required",
                description: "You must be a registered student to sell items.",
                variant: "default"
            });
            navigate("/auth");
            return;
        }
        setIsAddOpen(true);
    }

    return (
        <div className="min-h-screen bg-transparent pb-20 transition-colors duration-300 font-sans text-white">
            <SEO
                title="Student Marketplace | CredSwap"
                description="Buy and sell pre-loved books, electronics, and campus essentials. Only for students."
            />
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
                {/* Background Glows to match the subtle Bit Lura lighting */}
                <div className="absolute top-0 left-[20%] w-[60%] h-[60%] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

                <div className="container relative z-10 px-6 lg:px-8 mx-auto flex flex-col gap-8 items-center text-center">
                    <div className="space-y-6 max-w-3xl flex flex-col items-center">
                        <div className="flex items-center gap-2 justify-center">
                            <div className="px-4 py-1.5 rounded-full bg-[#111] border border-white/10 text-zinc-300 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                Campus Marketplace
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.1]">
                                Buy and Sell Essentials.
                            </h1>
                            <p className="text-[15px] md:text-[17px] text-zinc-400 font-medium leading-[1.6] max-w-2xl mx-auto">
                                The trusted place to buy and sell used essentials with your campus peers. No middlemen, just students helping students.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {[
                            { label: "Total Items", value: String(items?.length || 0) },
                            { label: "Safe Trades", value: "Verified" },
                            { label: "Campus Excl.", value: "Students" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center bg-[#0a0a0a] border border-zinc-900 px-8 py-4 rounded-2xl shadow-xl min-w-[140px]">
                                <div className="text-2xl font-bold text-white leading-none mb-1">{stat.value}</div>
                                <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Filter Section */}
            <section className="container mx-auto px-6 lg:px-8 relative z-20 -mt-6">
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[24px] p-6 shadow-2xl">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Search Section */}
                            <div className="lg:col-span-9 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10" />
                                    <input
                                        type="text"
                                        placeholder="Search for books, calculators, furniture or electronics..."
                                        className="w-full h-12 bg-[#111] border border-zinc-800 rounded-xl pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all outline-none placeholder:text-zinc-600"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="lg:col-span-3">
                                <Button
                                    onClick={handleSellClick}
                                    className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all"
                                >
                                    Sell an Item
                                </Button>
                            </div>
                        </div>

                        {/* Category Section */}
                        <div className="pt-4 border-t border-zinc-900">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 whitespace-nowrap",
                                            selectedCategory === cat
                                                ? "bg-zinc-800 text-white"
                                                : "bg-[#111] text-zinc-500 hover:text-zinc-300 border border-zinc-900"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="container mx-auto px-6 lg:px-8 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-[220px] w-full rounded-2xl bg-zinc-900" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4 bg-zinc-900" />
                                    <Skeleton className="h-4 w-1/2 bg-zinc-900" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredItems?.map((item, index) => (
                            <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                <ItemCard
                                    item={item}
                                    isOwner={session?.user?.id === item.seller_id}
                                    isLoggedIn={!!session}
                                    onDelete={deleteItem.mutate}
                                    onEdit={(item: any) => setEditingItem(item)}
                                    onStatusChange={(id: string, status: string) => updateStatus.mutate({ id, status })}
                                />
                            </div>
                        ))}

                        {filteredItems?.length === 0 && (
                            <div className="col-span-full py-24 text-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-zinc-900 border border-zinc-800">
                                    <ShoppingBag className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
                                <p className="text-zinc-500 max-w-md mx-auto text-sm">
                                    We couldn't find any items matching your filters. Try checking a different category or be the first to list something!
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-4 text-zinc-300 hover:text-white"
                                    onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <AddItemDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
                    toast({ title: "Item Listed!", description: "Your item is now live on the marketplace." });
                }}
                userId={session?.user?.id}
            />

            <EditItemDialog
                open={!!editingItem}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
                    setEditingItem(null);
                }}
                item={editingItem}
            />
        </div>
    );
}
