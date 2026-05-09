import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: AssistantAction | null;
}

type ProfileUpdate = Partial<{
    full_name: string;
    college: string;
    branch: string;
    semester: string;
    avatar_url: string;
    bio: string;
    skills: string;
    linkedin: string;
    github: string;
    portfolio: string;
    resume_link: string;
}>;

interface AssistantAction {
    type: "profile_update";
    data: ProfileUpdate;
}

const PROFILE_FIELD_LABELS: Record<keyof ProfileUpdate, string> = {
    full_name: "Full name",
    college: "College",
    branch: "Branch",
    semester: "Semester",
    avatar_url: "Avatar URL",
    bio: "Bio",
    skills: "Skills",
    linkedin: "LinkedIn",
    github: "GitHub",
    portfolio: "Portfolio",
    resume_link: "Resume link",
};

export function ChatBot() {
    const location = useLocation();
    const navigate = useNavigate();



    const [isOpen, setIsOpen] = useState(false);
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "intro",
            role: "assistant",
            content: "Welcome to CredSwap. I am Campus AI, your professional assistant. I can guide you through Notes, Events, Marketplace, Lost & Found, Roadmaps, Opportunities, Community, Inbox, Room Finder, and Profile/Settings. How may I assist you today?",
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSessionUserId(data.session?.user?.id || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const appendAssistantMessage = (content: string, action?: AssistantAction | null) => {
        const botMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            role: "assistant",
            content,
            action: action || null,
        };
        setMessages((prev) => [...prev, botMessage]);
    };

    const clearMessageAction = (id: string) => {
        setMessages((prev) => prev.map((msg) => (
            msg.id === id ? { ...msg, action: null } : msg
        )));
    };

    const sanitizeProfileUpdate = (data: ProfileUpdate) => {
        const allowedKeys = Object.keys(PROFILE_FIELD_LABELS) as (keyof ProfileUpdate)[];
        const cleaned: ProfileUpdate = {};

        allowedKeys.forEach((key) => {
            const value = data[key];
            if (typeof value === "string") {
                cleaned[key] = value.trim();
            }
        });

        return cleaned;
    };

    const applyProfileUpdate = async (message: Message) => {
        if (!message.action || message.action.type !== "profile_update") return;
        if (!sessionUserId) {
            appendAssistantMessage("Please sign in to apply profile changes.");
            return;
        }

        const updatePayload = sanitizeProfileUpdate(message.action.data);

        // Security block for reserved names
        const reservedNames = ["admin", "credswap"];
        const adminEmails = ["itsyourriyansh@gmail.com", "credswap@gmail.com"];

        if (updatePayload.full_name) {
            const { data: { user } } = await supabase.auth.getUser();
            const isReserved = reservedNames.some(name => updatePayload.full_name?.trim().toLowerCase() === name);
            const isAdminEmail = adminEmails.includes(user?.email?.toLowerCase() || '');

            if (isReserved && !isAdminEmail) {
                appendAssistantMessage(`Sorry, the name "${updatePayload.full_name}" is reserved for system use for security reasons.`);
                clearMessageAction(message.id);
                return;
            }
        }

        if (Object.keys(updatePayload).length === 0) {
            appendAssistantMessage("I didn't find any valid profile fields to update. Please specify the fields you want to change.");
            clearMessageAction(message.id);
            return;
        }

        setActionLoadingId(message.id);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ ...updatePayload, updated_at: new Date().toISOString() })
                .eq("id", sessionUserId);

            if (error) throw error;

            appendAssistantMessage("Your profile has been updated successfully.");
            clearMessageAction(message.id);
        } catch (error: any) {
            console.error("Profile update error:", error);
            appendAssistantMessage(`Sorry, I couldn't update your profile. ${error.message || "Please try again."}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Call our Supabase Edge Function that securely connects to HuggingFace
            const { data, error } = await supabase.functions.invoke('chatbot', {
                body: {
                    query: userMessage.content,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    context: { path: location.pathname }
                }
            });

            if (error) {
                throw new Error(error.message || "Failed to get response");
            }

            appendAssistantMessage(
                data?.response || "I'm having trouble connecting right now. Please try again later.",
                data?.action || null
            );
        } catch (error: any) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Oops! Something went wrong while connecting to the AI. Please make sure the HuggingFace API key is configured.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (
        location.pathname === "/auth" ||
        location.pathname.startsWith('/opportunities/') ||
        location.pathname.startsWith("/inbox") ||
        location.pathname.startsWith("/admin")
    ) {
        return null;
    }

    return (
        <>
            {/* Floating Action Button */}
            <div className={cn("fixed bottom-20 right-3 md:right-6 md:bottom-6 z-50 transition-all", isOpen ? "hidden" : "block")}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-black shadow-[0_5px_40px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                >
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-in zoom-in duration-300" />
                </button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-3 md:right-6 md:bottom-6 w-[calc(100vw-1.5rem)] sm:w-[400px] h-[500px] sm:h-[550px] max-h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Campus AI</h3>
                                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                {/* Avatar */}
                                <div className={cn(
                                    "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px]",
                                    message.role === "user" ? "bg-white text-black" : "bg-[#111] text-white border border-white/10"
                                )}>
                                    {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                {/* Bubble */}
                                <div className={cn(
                                    "p-3 rounded-2xl text-[14px] leading-[1.6]",
                                    message.role === "user"
                                        ? "bg-white text-black rounded-tr-sm shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                                        : "bg-[#111] border border-white/10 text-zinc-200 rounded-tl-sm backdrop-blur-sm"
                                )}>
                                    <div className={cn(
                                        "prose prose-sm prose-invert max-w-none",
                                        "prose-p:leading-relaxed prose-p:my-0 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5",
                                        "prose-strong:text-white prose-code:text-zinc-300 font-sans"
                                    )}>
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>

                                    {message.role === "assistant" && message.action?.type === "profile_update" && (
                                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                                            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                                                Profile update
                                            </div>
                                            <div className="space-y-1 text-[13px]">
                                                {Object.entries(message.action.data).length > 0 ? (
                                                    Object.entries(message.action.data).map(([key, value]) => (
                                                        <div key={key} className="flex items-start gap-2">
                                                            <span className="text-zinc-400 min-w-[90px]">
                                                                {PROFILE_FIELD_LABELS[key as keyof ProfileUpdate] || key}
                                                            </span>
                                                            <span className="text-zinc-200 break-words">
                                                                {value && value.length > 0 ? value : "(clear)"}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-zinc-500">No profile fields were provided.</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={actionLoadingId === message.id}
                                                    onClick={() => applyProfileUpdate(message)}
                                                >
                                                    {actionLoadingId === message.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                    ) : null}
                                                    Apply changes
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => clearMessageAction(message.id)}
                                                    className="text-zinc-400 hover:text-white"
                                                >
                                                    Dismiss
                                                </Button>
                                                {!sessionUserId && (
                                                    <span className="text-[11px] text-zinc-500">Sign in required</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                                <div className="w-7 h-7 shrink-0 rounded-full bg-[#111] text-white border border-white/10 flex items-center justify-center">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-[#111] border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#0A0A0A]">
                        <div className="relative flex items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-[#111] border-white/10 text-white placeholder:text-zinc-500 pr-12 h-11 rounded-full focus-visible:ring-1 focus-visible:ring-white/20"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 w-9 h-9 rounded-full bg-white hover:bg-zinc-200 text-black disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-zinc-600 font-medium">Powered by HuggingFace AI</span>
                        </div>
                    </form>

                </div>
            )}
        </>
    );
}
