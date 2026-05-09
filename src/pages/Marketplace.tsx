
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ShoppingBag, Loader2, CheckCircle } from "lucide-react";
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

const GridBg = () => (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    </div>
);

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
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] pb-20 transition-colors duration-300 font-sans">
            <SEO
                title="Student Marketplace | CredSwap"
                description="Buy and sell pre-loved books, electronics, and campus essentials. Only for students."
            />
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
                <GridBg />
                
                {/* Background Glows */}
                <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="container relative z-10 px-8">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-5 max-w-3xl">
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase shadow-sm">
                                    Campus Store
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white dark:bg-[#111112] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 text-[10px] font-black tracking-widest uppercase">
                                    Trusted Sellers
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">Marketplace</span>
                                </h1>
                                <p className="text-base md:text-lg text-slate-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                                    The trusted place to buy and sell used essentials with your campus peers. No middlemen, just students helping students.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Total Items", value: String(items?.length || 0), icon: ShoppingBag },
                                { label: "Safe Trades", value: "Verified", icon: CheckCircle },
                                { label: "Campus Excl.", value: "Students", icon: Search }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#0B0B0C] border border-zinc-200 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-sm hover:border-indigo-500/30 transition-colors group">
                                    <stat.icon className="w-4.5 h-4.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white leading-none">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Filter Section */}
            <section className="container mx-auto px-6 -mt-8 md:-mt-10 relative z-20">
                <div className="bg-white dark:bg-[#0B0B0C] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 lg:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                            {/* Search Section */}
                            <div className="lg:col-span-9 space-y-4">
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 ml-1">
                                        <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Find What You Need</label>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
                                        <input
                                            type="text"
                                            placeholder="Search for books, calculators, furniture or electronics..."
                                            className="w-full h-11 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-xl pl-11 pr-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="lg:col-span-3">
                                <Button
                                    onClick={handleSellClick}
                                    className="w-full h-11 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-xs shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Sell an Item
                                </Button>
                            </div>
                        </div>

                        {/* Category Section */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-300 whitespace-nowrap",
                                            selectedCategory === cat
                                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
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
            <section className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-56 w-full rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {filteredItems?.map(item => (
                            <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${0.1} s` }}>
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
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-2xl font-display font-bold text-foreground mb-2">No items found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    We couldn't find any items matching your filters. Try checking a different category or be the first to list something!
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-4 text-primary"
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
