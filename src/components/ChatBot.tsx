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

import { generateAIResponse } from "@/lib/ai";

function getSystemPrompt(pathname: string, searchContext?: string): string {
    let pageContext = "";
    if (pathname.startsWith("/marketplace")) {
        pageContext = "User is currently browsing the Marketplace.";
    } else if (pathname.startsWith("/rooms")) {
        pageContext = "User is currently browsing the Room Finder.";
    }

    return `You are **Campus AI**, a smart, concise assistant for **CredSwap** (India's student marketplace & room finder).
${pageContext}
${searchContext ? `\nAvailable Results from Database:\n${searchContext}` : ""}
Rules:
- Be concise, direct, and friendly (1-2 sentences).
- For simple greetings ("hi", "hello", "hey"): Reply in ONE short sentence (e.g. "Hey! How can I help you on CredSwap today?").
- When matching items/rooms exist in Available Results, ALWAYS output the exact [ITEM_CARD:uuid] or [ROOM_CARD:uuid] card tags (max 3) so they render visually for the user.
- NEVER invent or alter IDs. Only use exact UUIDs from Available Results.`;
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

    const [popupIndex, setPopupIndex] = useState(0);
    const [showPopup, setShowPopup] = useState(true);

    const rotatingPrompts = [
        "✨ Ask Gemini anything...",
        "🔍 Search calculator",
        "🏠 I want a room in Danish Nagar",
        "🛒 Search products with Gemini AI",
        "📚 Engineering textbooks & notes",
    ];

    // Rotate prompt popup every 3.5 seconds
    useEffect(() => {
        if (isOpen) return;
        const interval = setInterval(() => {
            setPopupIndex((prev) => (prev + 1) % rotatingPrompts.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [isOpen, rotatingPrompts.length]);

    const handleSendQuery = async (queryText: string) => {
        if (!queryText.trim() || isLoading) return;

        const userInput = queryText.trim();
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

            // Detect keywords for search (filtered with stop words)
            const stopWords = new Set(['i', 'want', 'an', 'a', 'in', 'to', 'buy', 'sell', 'looking', 'for', 'the', 'give', 'get', 'some', 'any', 'please', 'tell', 'about', 'with', 'from', 'this', 'that', 'have', 'like', 'need', 'find', 'show', 'search', 'rent', 'me', 'you', 'is', 'are', 'of']);
            const cleanInput = userInput.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
            const keywords = cleanInput.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));

            if (keywords.length > 0) {
                // 1. Search Marketplace Items (title, description, category)
                const queryPartsItems = keywords.map(kw => `title.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`).join(',');

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

                // 2. Search Rooms (title, location, description)
                const queryPartsRooms = keywords.map(kw => `title.ilike.%${kw}%,location.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
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

            const systemPrompt = getSystemPrompt(location.pathname, searchContext);

            const conversationHistory = messages
                .filter(m => m.id !== "intro")
                .slice(-6)
                .map(m => ({ role: m.role, content: m.content }));

            const aiResult = await generateAIResponse({
                systemPrompt,
                messages: [
                    ...conversationHistory,
                    { role: "user", content: userInput }
                ],
                temperature: 0.2,
                maxTokens: 1024,
            });

            const reply = aiResult.text || "I'm having trouble right now. Please try again!";

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
            console.error("AI chat error:", error);
            
            let errorMessage = "Sorry, I ran into an issue connecting to the assistant. Please try again in a moment.";
            
            if (error?.message?.includes("401") || error?.message?.includes("API_KEY_INVALID")) {
                errorMessage = "🔑 **Authentication Error**: The API key is invalid or not being picked up correctly. Try restarting your terminal!";
            } else if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
                errorMessage = "⏳ **Rate Limit Reached**: Too many requests received. Please wait a minute and try again!";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        handleSendQuery(input);
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
            {/* Floating Button with Rotating Text Popup */}
            {!isOpen && (
                <div className="fixed bottom-20 right-3 md:right-6 md:bottom-6 z-50 flex items-center gap-2">
                    {/* Rotating Animated Speech Bubble */}
                    {showPopup && (
                        <div
                            onClick={() => {
                                setIsOpen(true);
                            }}
                            className="hidden sm:flex items-center gap-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer hover:border-white/30 hover:scale-105 transition-all group animate-in fade-in slide-in-from-right-3 duration-300"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <p className="text-xs font-medium text-zinc-200 tracking-tight transition-all duration-300 max-w-[220px] truncate">
                                {rotatingPrompts[popupIndex]}
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPopup(false);
                                }}
                                className="text-zinc-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors ml-1"
                                title="Dismiss"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-black shadow-[0_5px_40px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 group"
                    >
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
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

                    {/* Quick Suggestion Pills */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-1 border-t border-white/5">
                            {[
                                { label: "🧮 Search calculator", query: "Search calculator" },
                                { label: "🏠 Room in Danish Nagar", query: "I want a room in Danish Nagar" },
                                { label: "📚 Engineering textbooks", query: "Show me engineering textbooks" },
                                { label: "🎧 Search electronics", query: "Show electronics items" },
                                { label: "✨ Ask Gemini anything", query: "What can Gemini AI do on CredSwap?" },
                                { label: "🛡️ How Escrow works?", query: "How does 48h escrow protection work?" }
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => handleSendQuery(item.query)}
                                    disabled={isLoading}
                                    className="whitespace-nowrap text-[11.5px] font-medium px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/15 hover:border-white/25 transition-all shrink-0 active:scale-95 disabled:opacity-50"
                                >
                                    {item.label}
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
                            Powered by <span className="text-zinc-500 font-medium">Gemini AI</span>
                        </p>
                    </form>
                </div>
            )}
        </>
    );
}
