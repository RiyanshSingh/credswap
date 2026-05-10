import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot, User, Sparkles, ShoppingBag, BedDouble, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    metadata?: {
        items?: any[];
        rooms?: any[];
    };
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getSystemPrompt(pathname: string, searchContext?: string): string {
    const base = `You are **Campus AI**, a highly professional, intelligent, and helpful assistant for **CredSwap** — India's premier student-to-student marketplace.

**Your Persona:**
- Professional, concise, and structured.
- Use proper spacing (newlines) between paragraphs to ensure readability.
- Be actionable: suggest specific steps.
- Use markdown effectively (bolding, lists).

**Context-Aware Capabilities:**
1. **Search & Discovery**: You have access to real-time listings on the platform. If you find matching items/rooms in your context, mention them specifically and refer to them.
2. **Interactive Cards**: When you want to show a specific listing or room, use the following syntax exactly:
   - For marketplace items: [ITEM_CARD:item_uuid]
   - For rooms: [ROOM_CARD:room_uuid]
   Only show a maximum of 3 cards per response to keep it clean.

${searchContext ? `**Real-time Results found for current query:**\n${searchContext}` : ""}

**Current Page Logic:**`;

    if (pathname.startsWith("/marketplace")) {
        return `${base}
- You are on the **Marketplace**.
- Help users buy/sell books, electronics, etc.
- If matches are provided in context, suggest them immediately.
- Use [ITEM_CARD:id] to display them visually.`;
    }

    if (pathname.startsWith("/rooms")) {
        return `${base}
- You are on the **Room Finder**.
- Help students find PGs, shared rooms, or flats.
- Use [ROOM_CARD:id] to display them visually.`;
    }

    return `${base}
- Guide users to Marketplace or Room Finder as needed.
- If you find relevant listings in context, you can show them.`;
}

export function ChatBot() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Generate context-aware intro when page changes or chat opens
    useEffect(() => {
        const path = location.pathname;
        let intro = "👋 Hey! I'm **Campus AI**, your assistant on CredSwap. Ask me anything about buying/selling items, finding rooms, or using the platform!";

        if (path.startsWith("/marketplace")) {
            intro = "🛒 Hey! I'm **Campus AI**. I can help you find great deals, price your listings, or navigate the Marketplace. What are you looking for today?";
        } else if (path.startsWith("/rooms")) {
            intro = "🏠 Hey! I'm **Campus AI**. Looking for a room or want to list your space? I can help you find the right fit, understand pricing, and stay safe. What do you need?";
        }

        setMessages([{ id: "intro", role: "assistant", content: intro }]);
    }, [location.pathname]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userInput,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // --- DATA ENRICHMENT STEP ---
            let searchContext = "";
            let matchedItems: any[] = [];
            let matchedRooms: any[] = [];

            // Detect keywords for search (improved extraction)
            const keywords = userInput.toLowerCase().split(' ').filter(w => w.length > 2 && !['want', 'need', 'find', 'show', 'search', 'buy', 'sell', 'for', 'the'].includes(w));

            if (keywords.length > 0) {
                // Search for ANY of the keywords in the title for marketplace
                const queryPartsItems = keywords.map(kw => `title.ilike.%${kw}%`).join(',');

                // 1. Search Marketplace Items
                const { data: items } = await supabase
                    .from('marketplace_items')
                    .select('id, title, price, category, image_url')
                    .or(queryPartsItems)
                    .eq('status', 'approved')
                    .limit(4);
                
                if (items && items.length > 0) {
                    matchedItems = items;
                    searchContext += `**Database Results for Marketplace Items:**\n` + 
                        items.map(i => `- [ITEM_CARD:${i.id}] Title: ${i.title}, Price: ₹${i.price}, Category: ${i.category}`).join('\n') + '\n';
                }

                // 2. Search Rooms (title OR location)
                const queryPartsRooms = keywords.map(kw => `title.ilike.%${kw}%,location.ilike.%${kw}%`).join(',');
                const { data: rooms } = await supabase
                    .from('rooms')
                    .select('id, title, price, location, type')
                    .or(queryPartsRooms)
                    .eq('status', 'available')
                    .limit(3);
                
                if (rooms && rooms.length > 0) {
                    matchedRooms = rooms;
                    searchContext += `**Database Results for Rooms:**\n` + 
                        rooms.map(r => `- [ROOM_CARD:${r.id}] Title: ${r.title}, Rent: ₹${r.price}, Location: ${r.location}`).join('\n') + '\n';
                }
            }

            const systemPrompt = getSystemPrompt(location.pathname, searchContext) + 
                `\n\n**CRITICAL RULE**: ONLY use the [ITEM_CARD:uuid] or [ROOM_CARD:uuid] tags for the EXACT IDs provided in the Database Results above. NEVER MAKE UP AN ID. If no results were found, DO NOT use these tags.` +
                `\n\n**CRITICAL STYLE RULE**: If you are outputting cards, your text MUST be EXTREMELY short (1 sentence max, e.g., 'Here are some options:'). However, if you are NOT outputting any cards, DO NOT say "Here are some options" or "Here are related rooms". Never end your message with a colon indicating options unless the tags immediately follow.`;

            const historyForGroq = messages
                .filter(m => m.id !== "intro")
                .map(m => ({ role: m.role, content: m.content }));

            if (!GROQ_API_KEY) {
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "⚠️ **API Key Missing**: It looks like the Groq API key isn't being picked up. Please restart your dev server (`Ctrl+C` and `npm run dev`) for the new `.env` changes to take effect!",
                }]);
                setIsLoading(false);
                return;
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...historyForGroq,
                        { role: "user", content: userInput },
                    ],
                    max_tokens: 1024,
                    temperature: 0.5,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API Error Detail:", errorData);
                const errorMessage = errorData.error?.message || response.statusText || 'Unknown error';
                throw new Error(`Groq API error: ${response.status} - ${errorMessage}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || "I'm having trouble right now. Please try again!";

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: reply,
                metadata: {
                    items: matchedItems,
                    rooms: matchedRooms
                }
            }]);
        } catch (error: any) {
            console.error("Groq chat error:", error);
            
            let errorMessage = "Sorry, I ran into an issue connecting to the AI. Please try again in a moment.";
            
            if (error.message.includes("401")) {
                errorMessage = "🔑 **Authentication Error**: The API key is invalid or not being picked up correctly. Try restarting your terminal!";
            } else if (error.message.includes("429")) {
                errorMessage = "⏳ **Rate Limit Reached**: You've sent too many messages quickly. Please wait a minute or two!";
            } else if (error.message.includes("404")) {
                errorMessage = "🧩 **Model Error**: The AI model might be temporarily unavailable. I'm checking for updates.";
            }

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: errorMessage,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Hide on auth/inbox/admin pages
    if (
        location.pathname === "/auth" ||
        location.pathname.startsWith("/inbox") ||
        location.pathname.startsWith("/admin")
    ) return null;

    // Context-aware icon
    const PageIcon = location.pathname.startsWith("/marketplace")
        ? ShoppingBag
        : location.pathname.startsWith("/rooms")
            ? BedDouble
            : MessageSquare;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <div className="fixed bottom-20 right-3 md:right-6 md:bottom-6 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-black shadow-[0_5px_40px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 group"
                        aria-label="Open AI Assistant"
                    >
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050505] animate-pulse" />
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-3 md:right-6 md:bottom-6 w-[calc(100vw-1.5rem)] sm:w-[400px] h-[520px] sm:h-[560px] max-h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                                <PageIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Campus AI</h3>
                                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {location.pathname.startsWith("/marketplace") ? "Marketplace Expert" : location.pathname.startsWith("/rooms") ? "Room Finder Expert" : "General Assistant"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2.5 max-w-[88%]",
                                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-7 h-7 shrink-0 rounded-full flex items-center justify-center",
                                    message.role === "user" ? "bg-white text-black" : "bg-[#111] text-white border border-white/10"
                                )}>
                                    {message.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-[13.5px] leading-[1.65]",
                                    message.role === "user"
                                        ? "bg-white text-black rounded-tr-sm"
                                        : "bg-[#111] border border-white/[0.08] text-zinc-200 rounded-tl-sm w-full"
                                )}>
                                    <div className={cn(
                                        "prose prose-sm prose-invert max-w-none font-sans",
                                        "prose-p:leading-relaxed prose-p:my-1.5 prose-headings:my-2.5 prose-ul:my-2 prose-li:my-1",
                                        "prose-strong:text-white prose-code:text-zinc-300",
                                        message.role === "user" && "prose-invert-none prose-p:text-black prose-strong:text-black prose-li:text-black prose-headings:text-black"
                                    )}>
                                        {(() => {
                                            if (message.role === "user") {
                                                return <ReactMarkdown>{message.content}</ReactMarkdown>;
                                            }

                                            let cleanContent = message.content;
                                            const itemMatches = [...cleanContent.matchAll(/\[ITEM_CARD:([^\]]+)\]/g)];
                                            const roomMatches = [...cleanContent.matchAll(/\[ROOM_CARD:([^\]]+)\]/g)];
                                            
                                            // Remove tags from the text
                                            cleanContent = cleanContent.replace(/\[ITEM_CARD:[^\]]+\]/g, '').replace(/\[ROOM_CARD:[^\]]+\]/g, '').trim();

                                            return (
                                                <>
                                                    {cleanContent && <ReactMarkdown>{cleanContent}</ReactMarkdown>}
                                                    
                                                    {itemMatches.map((match, idx) => {
                                                        const id = match[1];
                                                        const item = message.metadata?.items?.find(i => i.id === id);
                                                        if (!item) return null;
                                                        return (
                                                            <div 
                                                                key={`item-${id}-${idx}`}
                                                                className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                                                                onClick={() => window.open(`/marketplace/${item.id}`, '_blank')}
                                                            >
                                                                {item.image_url && (
                                                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-bold text-white truncate">{item.title}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] font-black text-emerald-400">₹{item.price}</span>
                                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{item.category}</span>
                                                                    </div>
                                                                </div>
                                                                <Sparkles className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                                                            </div>
                                                        );
                                                    })}

                                                    {roomMatches.map((match, idx) => {
                                                        const id = match[1];
                                                        const room = message.metadata?.rooms?.find(r => r.id === id);
                                                        if (!room) return null;
                                                        return (
                                                            <div 
                                                                key={`room-${id}-${idx}`}
                                                                className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                                                                onClick={() => window.open(`/rooms/${room.id}`, '_blank')}
                                                            >
                                                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                    <BedDouble className="w-6 h-6 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-bold text-white truncate">{room.title}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] font-black text-emerald-400">₹{room.price}/mo</span>
                                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">{room.location}</span>
                                                                    </div>
                                                                </div>
                                                                <Sparkles className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2.5 max-w-[88%] mr-auto items-center">
                                <div className="w-7 h-7 shrink-0 rounded-full bg-[#111] text-white border border-white/10 flex items-center justify-center">
                                    <Bot className="w-3.5 h-3.5" />
                                </div>
                                <div className="bg-[#111] border border-white/[0.08] p-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '120ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '240ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                            {(location.pathname.startsWith("/marketplace")
                                ? ["How to sell an item?", "Best price for books?", "What's Recommended?"]
                                : location.pathname.startsWith("/rooms")
                                    ? ["Find a PG near campus", "Typical rent in India?", "Room safety tips"]
                                    : ["Explore Marketplace", "Find a Room", "How does CredSwap work?"]
                            ).map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        setTimeout(() => {
                                            const form = document.getElementById("chat-form") as HTMLFormElement;
                                            form?.requestSubmit();
                                        }, 50);
                                    }}
                                    className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form id="chat-form" onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#0A0A0A] shrink-0">
                        <div className="relative flex items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    location.pathname.startsWith("/marketplace")
                                        ? "Ask about items, pricing..."
                                        : location.pathname.startsWith("/rooms")
                                            ? "Ask about rooms, rent, amenities..."
                                            : "Ask me anything..."
                                }
                                className="w-full bg-[#111] border-white/10 text-white placeholder:text-zinc-600 pr-12 h-11 rounded-full focus-visible:ring-1 focus-visible:ring-white/20 text-sm"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 w-9 h-9 rounded-full bg-white hover:bg-zinc-200 text-black disabled:opacity-40 transition-all"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-center mt-2 text-[10px] text-zinc-600">
                            Powered by <span className="text-zinc-500 font-medium">Groq AI · Llama 3</span>
                        </p>
                    </form>
                </div>
            )}
        </>
    );
}
