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
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama3-70b-8192";

function getSystemPrompt(pathname: string): string {
    const base = `You are Campus AI, a smart and friendly assistant for CredSwap — a student campus platform in India. You speak in a helpful, concise, and professional tone. Keep responses short and actionable unless asked for detail. Use markdown formatting for lists or steps.`;

    if (pathname.startsWith("/marketplace")) {
        return `${base}

You are currently assisting users on the **Marketplace** page. Your specialty here is:
- Helping students find or list items like books, electronics, stationery, furniture
- Advising on fair pricing for used campus items (books ~₹50-300, calculators ~₹200-800, etc.)
- Explaining how to sell: click "Sell an Item", fill in title/price/category/image, submit
- Recommending what categories to browse for specific needs
- Explaining the "Recommended" badge — items marked by sellers as top picks, soon to be AI-personalized
- Helping with negotiation tips and safe trade advice
- Listing benefits: no middlemen, campus-only, direct student-to-student

If asked about rooms or other features, briefly answer and guide them there.`;
    }

    if (pathname.startsWith("/rooms")) {
        return `${base}

You are currently assisting users on the **Room Finder** page. Your specialty here is:
- Helping students find rooms: Single, Shared, PG/Hostel, or Full Flat
- Advising on what to check before renting: location, amenities, price range, owner verification
- Explaining how to list a room: click "List Property", provide title/location/price/type/amenities
- Typical price ranges in Indian college cities: PG ₹3000-7000/mo, Single ₹5000-12000/mo, Shared ₹2500-5000/mo
- Tips for negotiating rent, what amenities to prioritize (WiFi, AC, laundry, meals)
- Safety tips: always meet in public first, verify owner identity, check the room physically
- Explaining room types: Single (private), Shared (shared with another student), PG (paying guest with meals), Flat (full apartment)

If asked about marketplace or other features, briefly answer and guide them there.`;
    }

    return `${base}

You can help with all features of CredSwap:
- **Marketplace**: Buy/sell books, electronics, stationery, furniture with campus peers
- **Room Finder**: Find PGs, shared rooms, single rooms, or full flats near college
- **Community**: Connect with students, post discussions
- **Inbox**: Message other students directly
- **Profile**: Update your academic and professional details

Guide users to the right page when they have specific questions.`;
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

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const systemPrompt = getSystemPrompt(location.pathname);
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
                        { role: "user", content: userMsg.content },
                    ],
                    max_tokens: 512,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API Error Detail:", errorData);
                throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || "I'm having trouble right now. Please try again!";

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: reply,
            }]);
        } catch (error: any) {
            console.error("Groq chat error:", error);
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I ran into an issue connecting to the AI. Please try again in a moment.",
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
                                        : "bg-[#111] border border-white/[0.08] text-zinc-200 rounded-tl-sm"
                                )}>
                                    <div className={cn(
                                        "prose prose-sm prose-invert max-w-none font-sans",
                                        "prose-p:leading-relaxed prose-p:my-0.5 prose-headings:my-1.5 prose-ul:my-1 prose-li:my-0.5",
                                        "prose-strong:text-white prose-code:text-zinc-300",
                                        message.role === "user" && "prose-invert-none prose-p:text-black prose-strong:text-black prose-li:text-black prose-headings:text-black"
                                    )}>
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
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
