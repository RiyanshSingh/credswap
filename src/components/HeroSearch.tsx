import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Loader2, FileText, Calendar, Coins, HelpCircle, ShoppingBag, BedDouble, Briefcase, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SearchBar } from "./SearchBar";
import { cn } from "@/lib/utils";

// Simple inline debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

interface SearchResult {
    item_type: 'note' | 'event' | 'task' | 'lost' | 'found' | 'marketplace' | 'room' | 'opportunity' | 'roadmap';
    item_id: string;
    item_title: string;
    item_subtitle: string;
    item_url: string;
}

export function HeroSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 300);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close results when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('search_content', { query_text: debouncedQuery });

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const handleSelect = (url: string) => {
        setShowResults(false);
        
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
            case 'roadmap': return <GraduationCap className="w-4 h-4 text-indigo-500" />;
            default: return <Search className="w-4 h-4 text-zinc-400" />;
        }
    };

    return (
        <div className="relative w-full max-w-xl mx-auto" ref={wrapperRef}>
            <SearchBar
                placeholder="Search notes, roadmaps, events, marketplace..."
                value={query}
                onChange={(val) => {
                    setQuery(val);
                    setShowResults(true);
                }}
                showFilter={false}
                className={cn(
                    "transition-all duration-500 h-12 md:h-13 px-5",
                    "bg-white/5 backdrop-blur-md border border-white/10",
                    "shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]",
                    "focus-within:border-primary/40 focus-within:shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]",
                    "rounded-2xl md:rounded-[1.25rem]",
                    showResults && query && "rounded-b-none border-b-transparent shadow-none"
                )}
            />

            {showResults && query && (
                <div className="absolute top-full left-0 right-0 bg-card border-2 border-border/50 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {isLoading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {results.map((result) => (
                                <button
                                    key={`${result.item_type}-${result.item_id}`}
                                    onClick={() => handleSelect(result.item_url)}
                                    className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted rounded-xl transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        {getIcon(result.item_type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-foreground truncate text-sm md:text-base">{result.item_title}</div>
                                        <div className="text-xs text-muted-foreground truncate opacity-80 uppercase tracking-wider font-semibold">{result.item_type} • {result.item_subtitle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center animate-pulse">
                            <p className="text-muted-foreground font-medium">No results found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
