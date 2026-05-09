import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    Search, 
    Loader2, 
    FileText, 
    Calendar, 
    Coins, 
    HelpCircle, 
    ShoppingBag, 
    BedDouble, 
    Briefcase,
    LayoutDashboard, 
    Settings, 
    PlusCircle,
    MapPin,
    Map
} from "lucide-react";
import { 
    Dialog, 
    DialogContent 
} from "@/components/ui/dialog";
import { 
    Command,
    CommandInput, 
    CommandList, 
    CommandEmpty, 
    CommandGroup, 
    CommandItem,
    CommandSeparator
} from "@/components/ui/command";
import { supabase } from "@/lib/supabase";

interface SearchResult {
    item_type: 'note' | 'event' | 'task' | 'lost' | 'found' | 'marketplace' | 'room' | 'opportunity' | 'roadmap';
    item_id: string;
    item_title: string;
    item_subtitle: string;
    item_url: string;
}

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('search_content', { query_text: query });

                if (error) {
                    console.error("Search RPC Error, falling back to client-side queries:", error);
                    // Fallback client-side search across tables
                    const safeQuery = `%${query}%`;
                    const [notesRes, eventsRes, marketplaceRes, roomsRes, oppsRes, roadmapsRes] = await Promise.allSettled([
                        supabase.from('notes').select('id, title, subject').eq('status', 'approved').or(`title.ilike.${safeQuery},subject.ilike.${safeQuery}`).limit(4),
                        supabase.from('events').select('id, title, venue, description').eq('status', 'approved').or(`title.ilike.${safeQuery},description.ilike.${safeQuery}`).limit(4),
                        supabase.from('marketplace_items').select('id, title, price').eq('status', 'approved').or(`title.ilike.${safeQuery},description.ilike.${safeQuery}`).limit(4),
                        supabase.from('rooms').select('id, title, price, location').eq('status', 'available').or(`title.ilike.${safeQuery},location.ilike.${safeQuery}`).limit(4),
                        supabase.from('opportunities').select('id, title, company, location').or(`title.ilike.${safeQuery},company.ilike.${safeQuery},description.ilike.${safeQuery}`).limit(4),
                        supabase.from('roadmaps').select('id, slug, title, difficulty').or(`title.ilike.${safeQuery},description.ilike.${safeQuery}`).limit(4)
                    ]);

                    const fallbackData: SearchResult[] = [];

                    if (notesRes.status === 'fulfilled' && notesRes.value.data) {
                        notesRes.value.data.forEach(n => fallbackData.push({
                            item_type: 'note', item_id: n.id, item_title: n.title, item_subtitle: n.subject || 'General', item_url: `/notes/${n.id}`
                        }));
                    }
                    if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
                        eventsRes.value.data.forEach(e => fallbackData.push({
                            item_type: 'event', item_id: e.id, item_title: e.title, item_subtitle: e.venue || 'Campus', item_url: `/events/${e.id}`
                        }));
                    }
                    if (marketplaceRes.status === 'fulfilled' && marketplaceRes.value.data) {
                        marketplaceRes.value.data.forEach(m => fallbackData.push({
                            item_type: 'marketplace', item_id: m.id, item_title: m.title, item_subtitle: `₹${m.price}`, item_url: `/marketplace/${m.id}`
                        }));
                    }
                    if (roomsRes.status === 'fulfilled' && roomsRes.value.data) {
                        roomsRes.value.data.forEach(r => fallbackData.push({
                            item_type: 'room', item_id: r.id, item_title: r.title, item_subtitle: `₹${r.price}/mo • ${r.location || 'Local'}`, item_url: `/rooms/${r.id}`
                        }));
                    }
                    if (oppsRes.status === 'fulfilled' && oppsRes.value.data) {
                        oppsRes.value.data.forEach(o => fallbackData.push({
                            item_type: 'opportunity', item_id: o.id, item_title: o.title, item_subtitle: `${o.company} • ${o.location || 'Remote'}`, item_url: `/opportunities/${o.id}`
                        }));
                    }
                    if (roadmapsRes.status === 'fulfilled' && roadmapsRes.value.data) {
                        roadmapsRes.value.data.forEach(rm => fallbackData.push({
                            item_type: 'roadmap', item_id: rm.id, item_title: rm.title, item_subtitle: rm.difficulty || 'Roadmap', item_url: `/roadmap/${rm.slug}`
                        }));
                    }

                    setResults(fallbackData);
                } else {
                    setResults(data || []);
                }
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(search, 150);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (url: string) => {
        onOpenChange(false);
        
        // Fix: DB returns '/roadmaps/:slug' but the router path is '/roadmap/:slug'
        if (url.startsWith('/roadmaps/') && url !== '/roadmaps') {
            navigate(url.replace('/roadmaps/', '/roadmap/'));
        } else {
            navigate(url);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'note': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'event': return <Calendar className="w-4 h-4 text-purple-500" />;
            case 'task': return <Coins className="w-4 h-4 text-yellow-500" />;
            case 'lost':
            case 'found': return <HelpCircle className="w-4 h-4 text-orange-500" />;
            case 'marketplace': return <ShoppingBag className="w-4 h-4 text-green-500" />;
            case 'room': return <BedDouble className="w-4 h-4 text-indigo-500" />;
            case 'opportunity': return <Briefcase className="w-4 h-4 text-cyan-500" />;
            case 'roadmap': return <Map className="w-4 h-4 text-pink-500" />;
            default: return <Search className="w-4 h-4 text-zinc-400" />;
        }
    };

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.item_type]) acc[result.item_type] = [];
        acc[result.item_type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 overflow-hidden max-w-2xl border-none shadow-2xl">
                <Command shouldFilter={false} className="rounded-none border-none">
                    <div className="flex flex-col h-full bg-popover text-popover-foreground">
                        <div className="relative">
                            <CommandInput 
                                placeholder="Search notes, events, internships..." 
                                value={query}
                                onValueChange={setQuery}
                                className="h-12 border-none focus:ring-0"
                            />
                            {isLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        <CommandList className="max-h-[450px] scrollbar-hide py-2">
                            <CommandEmpty className="py-12 animate-in fade-in zoom-in-95">
                                <div className="flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                        <Search className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No matches found</p>
                                    <p className="text-xs text-muted-foreground mt-1 px-8">Try searching for subjects, companies, or events.</p>
                                </div>
                            </CommandEmpty>

                            {!query && (
                                <>
                                    <CommandGroup heading="Quick Navigation">
                                        <CommandItem onSelect={() => handleSelect('/dashboard')} className="rounded-xl mx-2 my-0.5">
                                            <LayoutDashboard className="mr-3 h-4 w-4" />
                                            <span>My Dashboard</span>
                                            <span className="ml-auto text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded">Jump</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/notes/upload')} className="rounded-xl mx-2 my-0.5">
                                            <PlusCircle className="mr-3 h-4 w-4" />
                                            <span>Upload Resource</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/settings')} className="rounded-xl mx-2 my-0.5">
                                            <Settings className="mr-3 h-4 w-4" />
                                            <span>General Settings</span>
                                        </CommandItem>
                                    </CommandGroup>
                                    
                                    <CommandSeparator className="my-2" />
                                    
                                    <CommandGroup heading="Platform Tools">
                                        <CommandItem onSelect={() => handleSelect('/marketplace')} className="rounded-xl mx-2 my-0.5">
                                            <ShoppingBag className="mr-3 h-4 w-4 text-green-500" />
                                            <span>Campus Marketplace</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/rooms')} className="rounded-xl mx-2 my-0.5">
                                            <BedDouble className="mr-3 h-4 w-4 text-purple-500" />
                                            <span>Student Housing</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}

                            {query && Object.entries(groupedResults).map(([type, items]) => (
                                <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
                                    {items.map((item) => (
                                        <CommandItem
                                            key={`${item.item_type}-${item.item_id}`}
                                            onSelect={() => handleSelect(item.item_url)}
                                            className="rounded-xl mx-2 my-0.5"
                                        >
                                            <div className="flex items-center gap-3 py-0.5">
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    {getIcon(item.item_type)}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-semibold truncate text-[14px]">
                                                        {item.item_title}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate opacity-80">
                                                        {item.item_subtitle}
                                                    </span>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </CommandList>
                        
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted border font-sans font-medium">↵</kbd>
                                    to select
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted border font-sans font-medium">↑↓</kbd>
                                    to navigate
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Powered by</span>
                                <span className="font-display font-bold text-foreground">CredSwap AI</span>
                            </div>
                        </div>
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
