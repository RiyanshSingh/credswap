import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { sendEmail } from "@/lib/email";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { NotificationDropdown } from "@/components/NotificationDropdown";


// Icons
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Newspaper,
    Users,
    Settings,
    LogOut,
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    ShoppingBag, // [NEW]
    Bell,
    Menu,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Download,
    ArrowUp,
    ArrowDown,
    Mail,
    QrCode,
    ScanLine,
    Briefcase, // [NEW]
    MapPin, // [NEW] Icon for Lost & Found
    ToggleLeft,
    ToggleRight,
    Loader2,
    Sparkles,
    ChevronRight,
    Filter,
    Star,
    Map,
    Building2,
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { Checkbox } from "@/components/ui/checkbox";
import { Event, Note, MarketplaceItem, Room, Profile, BlogPost } from "@/types/database";
import ReactMarkdown from "react-markdown";
// @ts-ignore
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
// @ts-ignore
import ImageResize from 'quill-image-resize-module-react';

if (typeof window !== "undefined" && window) {
    (window as any).Quill = Quill;
}
Quill.register('modules/imageResize', ImageResize);

// Local types removed, using global ones from @/types/database

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(searchParams.get("tab") || "overview");
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        confirmText?: string;
        variant?: "default" | "destructive";
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { },
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const credsStr = localStorage.getItem("admin_creds");

            if (!credsStr) {
                navigate("/admin");
                return;
            }

            try {
                const creds = JSON.parse(credsStr);
                const { data: isValid, error } = await supabase.rpc('login_admin', {
                    p_username: creds.username,
                    p_password: creds.password
                });

                if (error || !isValid) {
                    throw new Error("Invalid Credentials");
                }

                // Session Valid
                setVerifying(false);
            } catch (err) {
                console.error("Session verification failed", err);
                localStorage.removeItem("admin_auth"); // Clear invalid flags
                localStorage.removeItem("admin_creds");
                navigate("/admin");
            }
        };

        verifySession();
    }, [navigate]);

    if (verifying) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Verifying Access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans relative">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-card/95 backdrop-blur-xl border-r border-border/50 h-full flex flex-col transition-transform duration-300 z-50 absolute md:relative top-0 left-0 bottom-0 shadow-2xl md:shadow-none overflow-hidden",
                    sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-20 md:translate-x-0"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-border/50">
                    <div className={cn("flex items-center gap-2 font-display font-bold text-xl text-primary transition-opacity overflow-hidden whitespace-nowrap", !sidebarOpen && "md:hidden")}>
                        <ShieldAlert className="w-6 h-6 shrink-0" />
                        <span>Admin</span>
                    </div>
                    {!sidebarOpen && <ShieldAlert className="w-6 h-6 text-primary hidden md:block" />}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeSection === "overview"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("overview"); setSearchParams({ tab: "overview" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Newspaper} label="Blog & News" active={activeSection === "blog"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("blog"); setSearchParams({ tab: "blog" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={ShoppingBag} label="Marketplace" active={activeSection === "marketplace"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("marketplace"); setSearchParams({ tab: "marketplace" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={FileText} label="Content Moderation" active={activeSection === "moderation"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("moderation"); setSearchParams({ tab: "moderation" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Users} label="User Management" active={activeSection === "users"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("users"); setSearchParams({ tab: "users" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />

                    <SidebarItem icon={Mail} label="Email Settings" active={activeSection === "emails"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("emails"); setSearchParams({ tab: "emails" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Settings} label="Platform Settings" active={activeSection === "settings"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("settings"); setSearchParams({ tab: "settings" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                </nav>

                <div className="p-3 border-t border-border/50">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", !sidebarOpen && "justify-center")}
                        onClick={() => {
                            localStorage.removeItem("admin_auth");
                            localStorage.removeItem("admin_creds");
                            navigate("/");
                        }}
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        {sidebarOpen && "Logout"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-secondary/5 relative w-full">
                {/* Header */}
                <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 md:px-6 shrink-0 z-40">
                    <div className="flex items-center gap-3 md:gap-4 absolute md:static left-0 right-0 px-4 md:px-0 pointer-events-none md:pointer-events-auto">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden pointer-events-auto">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h2 className="text-lg font-semibold font-display capitalize md:pl-0 pointer-events-auto">{activeSection.replace('-', ' ')}</h2>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 ml-auto pointer-events-auto z-50">
                        <div className="relative hidden md:block w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Global Search..." className="pl-9 bg-secondary/50 border-transparent focus:bg-background transition-all" />
                        </div>
                        <div className="hidden sm:block">
                            <NotificationDropdown adminMode={true} />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background shadow-md shrink-0">
                            AD
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth w-full">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {activeSection === "overview" && <DashboardOverview setActiveSection={(s) => { setActiveSection(s); setSearchParams({ tab: s }); }} />}
                        {activeSection === "marketplace" && <MarketplaceManager setConfirm={setConfirmDialog} />}
                        {activeSection === "blog" && <BlogManager setConfirm={setConfirmDialog} />}
                        {activeSection === "moderation" && <ContentModeration setConfirm={setConfirmDialog} />}
                        {activeSection === "users" && <UsersManager />}
                        {activeSection === "emails" && <EmailSettingsManager />}
                        {activeSection === "settings" && <SettingsManager />}
                    </div>
                </div>
            </main>

            {/* Reusable Admin Confirmation Dialog */}
            <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent className="rounded-2xl border-border/50 shadow-large max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(
                                "rounded-xl px-6",
                                confirmDialog.variant === "destructive" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            }}
                        >
                            {confirmDialog.confirmText || "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


function SidebarItem({ icon: Icon, label, active, collapsed, onClick }: { icon: any, label: string, active: boolean, collapsed: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group relative",
                active
                    ? "bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/5",
                collapsed && "justify-center px-0 h-12"
            )}
        >
            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "scale-110" : "")} />
            {!collapsed && <span className="tracking-tight">{label}</span>}
            {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#0B0B0C] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 shadow-2xl border border-white/5">
                    {label}
                </div>
            )}
        </button>
    );
}

// --- OVERVIEW SECTION ---
function DashboardOverview({ setActiveSection }: { setActiveSection: (s: string) => void }) {
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [users, marketplace, pendingMarketplace, pendingRooms] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('marketplace_items').select('id', { count: 'exact' }),
                supabase.from('marketplace_items').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('rooms').select('id', { count: 'exact' }).eq('status', 'pending'),
            ]);
            return {
                users: users.count || 0,
                marketplace: marketplace.count || 0,
                pending: (pendingMarketplace.count || 0) + (pendingRooms.count || 0),
            };
        }
    });
    const { data: recentUsers } = useQuery({
        queryKey: ['admin-recent-users'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
            return data || [];
        }
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={stats?.users || 0} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
                <StatCard title="Marketplace Items" value={stats?.marketplace || 0} icon={ShoppingBag} color="text-orange-500" bg="bg-orange-500/10" />
                <StatCard 
                    title="Pending Approvals" 
                    value={stats?.pending || 0} 
                    icon={ShieldAlert} 
                    color={stats?.pending && stats.pending > 0 ? "text-rose-500" : "text-muted-foreground"} 
                    bg={stats?.pending && stats.pending > 0 ? "bg-rose-500/10" : "bg-muted/10"} 
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks you perform often.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" onClick={() => setActiveSection('marketplace')} className="gap-2">Manage Marketplace</Button>
                        <Button variant="outline" onClick={() => setActiveSection('blog')} className="gap-2">Manage Blog</Button>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20 shadow-inner">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center justify-center md:justify-start gap-2">
                            <ShieldAlert className="w-5 h-5" /> System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center md:items-start md:text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                            <span className="text-sm font-medium">All Systems Operational</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Database connected. Storage available.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                        <div>
                            <CardTitle className="text-lg">Recent Users</CardTitle>
                            <CardDescription>Latest members to join CredSwap.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveSection('users')} className="gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {recentUsers?.map((user: any) => (
                                <div key={user.id} className="p-4 flex items-center justify-between group hover:bg-secondary/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.full_name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={user.is_verified ? "default" : "secondary"} className="text-[10px] uppercase font-black tracking-tighter">
                                        {user.is_verified ? "Verified" : "Regular"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                        <div>
                            <CardTitle className="text-lg">Platform Summary</CardTitle>
                            <CardDescription>Key performance indicators.</CardDescription>
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-sm">Marketplace Velocity</span>
                                </div>
                                <span className="text-xs font-black text-orange-600">HEALTHY</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-sm">Retention Rate</span>
                                </div>
                                <span className="text-xs font-black text-blue-600">88%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
    return (
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-3xl font-display font-bold">{value}</h3>
                </div>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110", bg, color)}>
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    );
}

// --- BLOG & NEWS MANAGER ---
function BlogManager({ setConfirm }: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<BlogPost | null>(null);
    const [suggestingField, setSuggestingField] = useState<string | null>(null);
    const [autoSuggest, setAutoSuggest] = useState(true);
    const slugTouchedRef = useRef(false);
    const lastAutoTitle = useRef<string>("");
    const autoTimerRef = useRef<number | null>(null);
    const aiAvailableRef = useRef(true);
    const aiErrorShownRef = useRef(false);

    const emptyForm = {
        id: "",
        title: "",
        slug: "",
        type: "blog",
        category: "",
        excerpt: "",
        content: "",
        tags: "",
        cover_image_url: "",
        og_image_url: "",
        gallery_urls: "",
        source_links: "",
        author_name: "",
        author_title: "",
        author_avatar_url: "",
        status: "draft",
        is_featured: false,
        published_at: "",
        seo_title: "",
        seo_description: "",
        canonical_url: "",
    };

    const [formData, setFormData] = useState({ ...emptyForm });

    const slugify = (value: string) =>
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

    const toList = (value: string) =>
        value
            .split(/\n|,/)
            .map((v) => v.trim())
            .filter(Boolean);

    const toCsv = (value: string[] | null | undefined) =>
        Array.isArray(value) ? value.join(", ") : (value || "");

    const toLocalInput = (value?: string | null) => {
        if (!value) return "";
        const date = new Date(value);
        const offsetMs = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    };

    const resetForm = (data?: BlogPost) => {
        if (!data) {
            setFormData({ ...emptyForm });
            slugTouchedRef.current = false;
            aiAvailableRef.current = true;
            aiErrorShownRef.current = false;
            return;
        }
        setFormData({
            id: data.id || "",
            title: data.title || "",
            slug: data.slug || "",
            type: data.type || "blog",
            category: data.category || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            tags: toCsv(data.tags),
            cover_image_url: data.cover_image_url || "",
            og_image_url: data.og_image_url || "",
            gallery_urls: toCsv(data.gallery_urls),
            source_links: toCsv(data.source_links),
            author_name: data.author_name || "",
            author_title: data.author_title || "",
            author_avatar_url: data.author_avatar_url || "",
            status: data.status || "draft",
            is_featured: !!data.is_featured,
            published_at: toLocalInput(data.published_at),
            seo_title: data.seo_title || "",
            seo_description: data.seo_description || "",
            canonical_url: data.canonical_url || "",
        });
        slugTouchedRef.current = false;
        aiAvailableRef.current = true;
        aiErrorShownRef.current = false;
    };

    const getCreds = () => {
        const credsStr = localStorage.getItem("admin_creds");
        if (!credsStr) throw new Error("Admin credentials not found");
        return JSON.parse(credsStr);
    };

    const requestSuggestion = async (field: string) => {
        if (!aiAvailableRef.current) {
            throw new Error("AI service unavailable. Deploy the blog-suggestions Edge Function and set GROQ_API_KEY.");
        }
        const { data, error } = await supabase.functions.invoke("blog-suggestions", {
            body: {
                title: formData.title,
                type: formData.type,
                category: formData.category,
                field,
            },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data?.suggestion;
    };

    const applySuggestion = (field: string, suggestion: string) => {
        if (!suggestion) return;
        if (field === "tags") {
            setFormData((prev) => ({ ...prev, tags: suggestion }));
            return;
        }
        setFormData((prev) => ({ ...prev, [field]: suggestion }));
    };

    const fetchAiSuggestion = async (field: string) => {
        if (!formData.title) {
            toast({ title: "Missing Title", description: "Please enter a title first.", variant: "destructive" });
            return;
        }
        setSuggestingField(field);
        try {
            const suggestion = await requestSuggestion(field);
            applySuggestion(field, suggestion);
            toast({ title: "AI Suggestion Added", description: `Field ${field} updated.` });
        } catch (err: any) {
            const message = err?.message || "Could not fetch suggestion.";
            const lower = message.toLowerCase();
            if (lower.includes("ai service unavailable")) {
                if (!aiErrorShownRef.current) {
                    aiErrorShownRef.current = true;
                    toast({
                        title: "AI Offline",
                        description: "Edge Function not reachable. Deploy `blog-suggestions` and set `GROQ_API_KEY`.",
                        variant: "destructive"
                    });
                }
            } else if (lower.includes("edge function") || lower.includes("failed to send a request")) {
                aiAvailableRef.current = false;
                if (!aiErrorShownRef.current) {
                    aiErrorShownRef.current = true;
                    toast({
                        title: "AI Offline",
                        description: "Edge Function not reachable. Deploy `blog-suggestions` and set `GROQ_API_KEY`.",
                        variant: "destructive"
                    });
                }
            } else {
                toast({ title: "AI Failed", description: message, variant: "destructive" });
            }
        } finally {
            setSuggestingField(null);
        }
    };

    const autoFillSuggestions = async () => {
        if (!formData.title) return;
        const fields = ["excerpt", "seo_title", "seo_description", "tags"];
        setSuggestingField("auto");
        try {
            for (const field of fields) {
                if (formData[field as keyof typeof formData]) continue;
                const suggestion = await requestSuggestion(field);
                applySuggestion(field, suggestion);
            }
        } catch (err: any) {
            const message = err?.message || "Auto-suggestions failed.";
            const lower = message.toLowerCase();
            if (lower.includes("ai service unavailable")) {
                if (!aiErrorShownRef.current) {
                    aiErrorShownRef.current = true;
                    toast({
                        title: "AI Offline",
                        description: "Edge Function not reachable. Deploy `blog-suggestions` and set `GROQ_API_KEY`.",
                        variant: "destructive"
                    });
                }
            } else if (lower.includes("edge function") || lower.includes("failed to send a request")) {
                aiAvailableRef.current = false;
                if (!aiErrorShownRef.current) {
                    aiErrorShownRef.current = true;
                    toast({
                        title: "AI Offline",
                        description: "Edge Function not reachable. Deploy `blog-suggestions` and set `GROQ_API_KEY`.",
                        variant: "destructive"
                    });
                }
            } else {
                toast({ title: "AI Failed", description: message, variant: "destructive" });
            }
        } finally {
            setSuggestingField(null);
        }
    };

    useEffect(() => {
        if (!autoSuggest || !dialogOpen) return;
        const title = formData.title.trim();
        if (!title || title.length < 6) return;
        const key = `${title}::${formData.category || ""}::${formData.type || ""}`;
        if (lastAutoTitle.current === key) return;
        if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
        autoTimerRef.current = window.setTimeout(async () => {
            lastAutoTitle.current = key;
            await autoFillSuggestions();
        }, 800);
        return () => {
            if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
        };
    }, [formData.title, formData.category, formData.type, autoSuggest, dialogOpen]);

    const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
        queryKey: ["admin-blog-posts"],
        queryFn: async () => {
            const creds = getCreds();
            const { data, error } = await supabase.rpc("admin_get_blog_posts", {
                p_username: creds.username,
                p_password: creds.password,
            });
            if (error) throw error;
            return data || [];
        }
    });

    const savePost = useMutation({
        mutationFn: async (payload: any) => {
            const creds = getCreds();
            const { data, error } = await supabase.rpc("admin_upsert_blog_post", {
                p_username: creds.username,
                p_password: creds.password,
                p_data: payload
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: editing ? "Post Updated" : "Post Created" });
            setDialogOpen(false);
            setEditing(null);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const quickUpdate = useMutation({
        mutationFn: async (payload: any) => {
            const creds = getCreds();
            const { data, error } = await supabase.rpc("admin_upsert_blog_post", {
                p_username: creds.username,
                p_password: creds.password,
                p_data: payload
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const deletePost = useMutation({
        mutationFn: async (id: string) => {
            const creds = getCreds();
            const { error } = await supabase.rpc("admin_delete_blog_post", {
                p_blog_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast({ title: "Post Deleted", variant: "destructive" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const buildPayloadFromForm = () => {
        const content = formData.content || "";
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const reading_time = Math.max(1, Math.ceil(words / 200));
        const slug = formData.slug?.trim() || slugify(formData.title || "");

        const published_at = formData.published_at
            ? new Date(formData.published_at).toISOString()
            : null;

        const payload = {
            id: formData.id || null,
            title: formData.title?.trim(),
            slug,
            excerpt: formData.excerpt?.trim() || "",
            content,
            cover_image_url: formData.cover_image_url?.trim() || "",
            og_image_url: formData.og_image_url?.trim() || "",
            category: formData.category?.trim() || "",
            type: formData.type || "blog",
            tags: toList(formData.tags || ""),
            author_name: formData.author_name?.trim() || "",
            author_title: formData.author_title?.trim() || "",
            author_avatar_url: formData.author_avatar_url?.trim() || "",
            status: formData.status || "draft",
            is_featured: !!formData.is_featured,
            published_at,
            seo_title: formData.seo_title?.trim() || "",
            seo_description: formData.seo_description?.trim() || "",
            canonical_url: formData.canonical_url?.trim() || "",
            reading_time,
            gallery_urls: toList(formData.gallery_urls || ""),
            source_links: toList(formData.source_links || "")
        };

        if (payload.status === "published" && !payload.published_at) {
            payload.published_at = new Date().toISOString();
        }

        return payload;
    };

    const buildPayloadFromPost = (post: BlogPost, overrides?: Partial<BlogPost>) => {
        const merged = { ...post, ...overrides };
        return {
            id: merged.id,
            title: merged.title,
            slug: merged.slug,
            excerpt: merged.excerpt || "",
            content: merged.content || "",
            cover_image_url: merged.cover_image_url || "",
            og_image_url: merged.og_image_url || "",
            category: merged.category || "",
            type: merged.type || "blog",
            tags: merged.tags || [],
            author_name: merged.author_name || "",
            author_title: merged.author_title || "",
            author_avatar_url: merged.author_avatar_url || "",
            status: merged.status || "draft",
            is_featured: !!merged.is_featured,
            published_at: merged.published_at || null,
            seo_title: merged.seo_title || "",
            seo_description: merged.seo_description || "",
            canonical_url: merged.canonical_url || "",
            reading_time: merged.reading_time || null,
            gallery_urls: merged.gallery_urls || [],
            source_links: merged.source_links || []
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display">Blog & News</h2>
                    <p className="text-muted-foreground">Create and publish blog posts and news updates.</p>
                </div>
                <Button onClick={() => { setEditing(null); resetForm(); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> New Post
                </Button>
            </div>

            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">All Posts</CardTitle>
                    <CardDescription>Manage drafts and published posts.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40 text-muted-foreground">
                                <tr>
                                    <th className="text-left font-medium px-4 py-3">Title</th>
                                    <th className="text-left font-medium px-4 py-3">Type</th>
                                    <th className="text-left font-medium px-4 py-3">Status</th>
                                    <th className="text-left font-medium px-4 py-3">Published</th>
                                    <th className="text-right font-medium px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading...</td>
                                    </tr>
                                )}
                                {!isLoading && posts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No posts yet.</td>
                                    </tr>
                                )}
                                {!isLoading && posts.map((post) => (
                                    <tr key={post.id} className="border-b border-border/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{post.title}</div>
                                            <div className="text-xs text-muted-foreground">{post.slug}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="uppercase text-[9px] tracking-wider">{post.type || "blog"}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={post.status === "published" ? "default" : "outline"}>
                                                {post.status || "draft"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditing(post);
                                                        resetForm(post);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const nextStatus = post.status === "published" ? "draft" : "published";
                                                        const payload = buildPayloadFromPost(post, { status: nextStatus });
                                                        quickUpdate.mutate(payload, {
                                                            onSuccess: () => toast({ title: nextStatus === "published" ? "Post Published" : "Post Unpublished" })
                                                        } as any);
                                                    }}
                                                >
                                                    {post.status === "published" ? "Unpublish" : "Publish"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={post.is_featured ? "default" : "outline"}
                                                    onClick={() => {
                                                        const payload = buildPayloadFromPost(post, { is_featured: !post.is_featured });
                                                        quickUpdate.mutate(payload, {
                                                            onSuccess: () => toast({ title: post.is_featured ? "Removed from Featured" : "Marked as Featured" })
                                                        } as any);
                                                    }}
                                                >
                                                    <Star className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setConfirm({
                                                        isOpen: true,
                                                        title: "Delete Post",
                                                        description: `Are you sure you want to delete "${post.title}"?`,
                                                        confirmText: "Delete",
                                                        variant: "destructive",
                                                        onConfirm: () => deletePost.mutate(post.id)
                                                    })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
                        <DialogDescription>Write a real blog/news post with images, links, and SEO fields.</DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border/50 mb-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="auto-suggest"
                                checked={autoSuggest}
                                onCheckedChange={(checked) => setAutoSuggest(!!checked)}
                            />
                            <Label htmlFor="auto-suggest">Auto AI suggestions on title</Label>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!formData.title || suggestingField === "auto"}
                            onClick={autoFillSuggestions}
                        >
                            {suggestingField === "auto" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span className="ml-2">AI Auto-Fill</span>
                        </Button>
                    </div>

                    <Tabs defaultValue="general">
                        <TabsList className="grid grid-cols-4 p-1.5 bg-slate-100/50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-inner h-auto">
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="general">General</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="content">Content</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="media">Media</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="seo">SEO</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => {
                                                const next = { ...prev, title: value };
                                                if (!slugTouchedRef.current) {
                                                    next.slug = slugify(value);
                                                }
                                                return next;
                                            });
                                        }}
                                        placeholder="Post title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Slug</Label>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) => {
                                            slugTouchedRef.current = true;
                                            setFormData((prev) => ({ ...prev, slug: e.target.value }));
                                        }}
                                        placeholder="post-title-slug"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blog">Blog</SelectItem>
                                            <SelectItem value="news">News</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Category</Label>
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                                        placeholder="Career, Study Tips, Updates..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Excerpt</Label>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        type="button"
                                        onClick={() => fetchAiSuggestion("excerpt")}
                                        disabled={suggestingField === "excerpt"}
                                    >
                                        {suggestingField === "excerpt" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        <span className="ml-1 text-[10px] font-black uppercase">AI</span>
                                    </Button>
                                </div>
                                <Textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                                    placeholder="Short summary for cards and SEO."
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Tags (comma separated)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.tags}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                                            placeholder="career, internship, resume"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            type="button"
                                            onClick={() => fetchAiSuggestion("tags")}
                                            disabled={suggestingField === "tags"}
                                        >
                                            {suggestingField === "tags" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Published At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.published_at}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, published_at: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Author Name</Label>
                                    <Input
                                        value={formData.author_name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, author_name: e.target.value }))}
                                        placeholder="CredSwap Team"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Author Title</Label>
                                    <Input
                                        value={formData.author_title}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, author_title: e.target.value }))}
                                        placeholder="Editor"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Author Avatar URL</Label>
                                    <Input
                                        value={formData.author_avatar_url}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, author_avatar_url: e.target.value }))}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: !!checked }))}
                                />
                                <Label htmlFor="is_featured">Feature this post</Label>
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Content (Rich Text)</Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={() => fetchAiSuggestion("content")}
                                    disabled={suggestingField === "content"}
                                >
                                    {suggestingField === "content" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span className="ml-2">AI Draft</span>
                                </Button>
                            </div>
                            <div className="bg-background rounded-md overflow-hidden border quill-wrapper">
                                <ReactQuill 
                                    theme="snow" 
                                    value={formData.content} 
                                    onChange={(val: string) => setFormData(prev => ({ ...prev, content: val }))} 
                                    placeholder="Write your amazing post here..."
                                    className="h-[350px] pb-10"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            ['blockquote'],
                                            [{'list': 'ordered'}, {'list': 'bullet'}],
                                            ['link', 'image'],
                                            ['clean']
                                        ],
                                        imageResize: {
                                            parchment: Quill.import('parchment'),
                                            modules: ['Resize', 'DisplaySize']
                                        }
                                    }}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="media" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Cover Image URL</Label>
                                <Input
                                    value={formData.cover_image_url}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Open Graph Image URL</Label>
                                <Input
                                    value={formData.og_image_url}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, og_image_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Gallery Image URLs (comma or newline)</Label>
                                <Textarea
                                    value={formData.gallery_urls}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, gallery_urls: e.target.value }))}
                                    placeholder="https://..., https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Source Links (comma or newline)</Label>
                                <Textarea
                                    value={formData.source_links}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, source_links: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="seo" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">SEO Title</Label>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        type="button"
                                        onClick={() => fetchAiSuggestion("seo_title")}
                                        disabled={suggestingField === "seo_title"}
                                    >
                                        {suggestingField === "seo_title" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <Input
                                    value={formData.seo_title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, seo_title: e.target.value }))}
                                    placeholder="SEO title"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">SEO Description</Label>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        type="button"
                                        onClick={() => fetchAiSuggestion("seo_description")}
                                        disabled={suggestingField === "seo_description"}
                                    >
                                        {suggestingField === "seo_description" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <Textarea
                                    value={formData.seo_description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, seo_description: e.target.value }))}
                                    placeholder="SEO meta description"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Canonical URL</Label>
                                <Input
                                    value={formData.canonical_url}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, canonical_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialogOpen(false);
                                setEditing(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!formData.title.trim()) {
                                    toast({ title: "Title required", description: "Please add a title before saving.", variant: "destructive" });
                                    return;
                                }
                                const payload = buildPayloadFromForm();
                                savePost.mutate(payload);
                            }}
                            disabled={savePost.isPending}
                        >
                            {savePost.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {editing ? "Save Changes" : "Publish Post"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- MARKETPLACE MANAGER ---
function MarketplaceManager({ setConfirm }: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: items, isLoading } = useQuery<MarketplaceItem[]>({
        queryKey: ['admin-marketplace-all'],
        queryFn: async () => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) return []; // Should be redirected anyway
            const creds = JSON.parse(credsStr);

            const { data, error } = await supabase.rpc('admin_get_marketplace_items', {
                p_username: creds.username,
                p_password: creds.password
            });

            if (error) {
                console.error("Admin Marketplace Fetch Error", error);
                toast({
                    title: "Failed to load listings",
                    description: error.message || "Unknown RPC error. Did you run the migration?",
                    variant: "destructive"
                });
                // Fallback: try direct fetch (will likely be filtered by RLS but improved debugging)
                const { data: fallbackData } = await supabase.from('marketplace_items').select('*, profiles(full_name)').order('created_at', { ascending: false });
                return (fallbackData || []).map((item: MarketplaceItem) => ({
                    ...item,
                    profiles: {
                        full_name: item.profiles?.full_name || "Unknown",
                        email: "",
                        avatar_url: ""
                    }
                }));
            }

            // Map flat RPC structure to nested structure expected by UI
            return (data || []).map((item: any) => ({
                ...item,
                profiles: {
                    full_name: item.seller_name,
                    email: item.seller_email,
                    avatar_url: item.seller_avatar
                }
            }));
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_delete_marketplace_item', {
                p_item_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-all'] });
            toast({ title: "Item Deleted", variant: "destructive" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_update_marketplace_status', {
                p_item_id: id,
                p_status: status,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-all'] });
            toast({ title: "Status Updated", description: "Item status has been changed." });
        }
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold font-display">Marketplace Manager</h2>
                <p className="text-muted-foreground">Manage all listings (Active, Pending, Sold).</p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                    <div className="rounded-md border border-border/50 overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-muted/50 border-b border-border/50 text-left">
                                <tr>
                                    <th className="p-4 font-medium text-muted-foreground">Item</th>
                                    <th className="p-4 font-medium text-muted-foreground">Seller</th>
                                    <th className="p-4 font-medium text-muted-foreground">Price</th>
                                    <th className="p-4 font-medium text-muted-foreground">Category</th>
                                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="p-4 font-medium text-muted-foreground">Date</th>
                                    <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {items?.map((item: MarketplaceItem) => (
                                    <tr key={item.id} className="group hover:bg-secondary/30 transition-colors">
                                        <td className="p-4 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center overflow-hidden">
                                                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ShoppingBag className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                                <span className="truncate max-w-[200px]" title={item.title}>{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{item.profiles?.full_name || "Unknown"}</td>
                                        <td className="p-4 text-primary font-bold">₹{item.price}</td>
                                        <td className="p-4"><Badge variant="outline">{item.category}</Badge></td>
                                        <td className="p-4">
                                            <Badge variant={item.status === 'approved' ? 'default' : item.status === 'sold' ? 'secondary' : 'outline'} className={cn(
                                                item.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                                item.status === 'rejected' && "bg-red-50 text-red-700 border-red-200"
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 text-xs">
                                                {item.status === 'pending' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus.mutate({ id: item.id, status: 'approved' })}>
                                                        Approve
                                                    </Button>
                                                )}
                                                {item.status !== 'rejected' && (
                                                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: item.id, status: 'rejected' })}>
                                                        Reject
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirm({
                                                    isOpen: true,
                                                    title: "Delete Listing?",
                                                    description: "Are you sure you want to delete this listing permanently?",
                                                    confirmText: "Delete",
                                                    variant: "destructive",
                                                    onConfirm: () => deleteItem.mutate(item.id)
                                                })}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items?.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                                            No marketplace listings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- CONTENT MODERATION (Existing Tabs logic) ---
function ContentModeration({ setConfirm }: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: pendingMarketplaceItems } = useQuery<MarketplaceItem[]>({
        queryKey: ['admin-marketplace'], queryFn: async () => {
            const { data } = await supabase.from('marketplace_items').select('*').eq('status', 'pending'); return data || [];
        }
    });
    const { data: pendingRooms } = useQuery<Room[]>({
        queryKey: ['admin-rooms'], queryFn: async () => {
            const { data } = await supabase.from('rooms').select('*, profiles(full_name, email)').eq('status', 'pending'); return data || [];
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ table, id, status }: { table: string, id: string, status: string }) => {
            const { error } = await supabase.from(table).update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [`admin-${variables.table}`] });
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
            toast({ title: "Updated", description: `Item marked as ${variables.status}` });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold font-display">Content Moderation</h2>
                <p className="text-muted-foreground">Review user submissions and requests.</p>
            </div>

            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="bg-background border border-border/50 h-auto flex-wrap justify-start gap-2 p-1">
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="marketplace">Marketplace ({pendingMarketplaceItems?.length || 0})</TabsTrigger>
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="rooms">Rooms ({pendingRooms?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                        {pendingMarketplaceItems?.map((item: MarketplaceItem) => (
                            <div key={item.id} className="bg-card border border-border/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-secondary/30 rounded-md overflow-hidden shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Img</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            ₹{item.price} • {item.category}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'rejected' })}>Reject</Button>
                                    <Button size="sm" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'approved' })}>Approve</Button>
                                </div>
                            </div>
                        ))}
                        {pendingMarketplaceItems?.length === 0 && <p className="text-muted-foreground italic text-center py-8">No pending marketplace items.</p>}
                    </div>
                </TabsContent>

                <TabsContent value="rooms" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRooms?.map((item: Room) => (
                            <div key={item.id} className="bg-card border border-border/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-secondary/30 rounded-md overflow-hidden shrink-0">
                                        {item.images?.[0] ? (
                                            <img src={item.images[0]} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Img</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">{item.type} • ₹{item.price}/month</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'rejected' })}>Reject</Button>
                                    <Button size="sm" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'approved' })}>Approve</Button>
                                </div>
                            </div>
                        ))}
                        {pendingRooms?.length === 0 && <p className="text-muted-foreground italic text-center py-8">No pending room listings.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
function UsersManager() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [resendingEmail, setResendingEmail] = useState<string | null>(null);
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkResending, setIsBulkResending] = useState(false);

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users-list'],
        queryFn: async () => {
            const creds = JSON.parse(localStorage.getItem("admin_creds") || "{}");
            const { data, error } = await supabase.rpc('admin_get_users_with_status', {
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
            return data;
        }
    });

    const filteredUsers = useMemo(() => {
        let result = users || [];

        // Apply Search
        if (searchQuery) {
            result = result.filter((user: any) =>
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.college?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply Verification Status
        if (filterStatus === "verified") result = result.filter(u => u.is_verified);
        if (filterStatus === "unverified") result = result.filter(u => !u.is_verified);

        // Apply Semester Filter
        if (semesterFilter !== "all") {
            result = result.filter(u => u.semester === semesterFilter);
        }

        // Apply Sorting
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [users, searchQuery, filterStatus, semesterFilter, sortConfig]);

    const stats = useMemo(() => {
        if (!users) return { total: 0, verified: 0, growth: 0 };
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        
        return {
            total: users.length,
            verified: users.filter(u => u.is_verified).length,
            growth: users.filter(u => new Date(u.created_at) > sevenDaysAgo).length
        };
    }, [users]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const downloadCSV = () => {
        const headers = ["Name", "Email", "College", "Semester", "Branch", "Status", "Joined"];
        const rows = filteredUsers.map(u => [
            u.full_name || "New Member",
            u.email,
            u.college || "N/A",
            u.semester || "N/A",
            u.branch || "N/A",
            u.is_verified ? "Verified" : "Pending",
            new Date(u.created_at).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkModeration = async (action: 'block' | 'remove') => {
        const confirm = window.confirm(`Are you sure you want to ${action} ${selectedUserIds.size} users?`);
        if (!confirm) return;

        setIsBulkResending(true);
        let successCount = 0;
        
        for (const id of Array.from(selectedUserIds)) {
            try {
                if (action === 'remove') {
                    const { error } = await supabase.from('profiles').delete().eq('id', id);
                    if (error) throw error;
                } else {
                    // Assuming a 'is_blocked' field exists or simulating with a metadata update
                    const { error } = await supabase.from('profiles').update({ is_verified: false }).eq('id', id);
                    if (error) throw error;
                }
                successCount++;
            } catch (err) {
                console.error(err);
            }
        }

        toast({ title: "Bulk Action Complete", description: `Successfully ${action}ed ${successCount} users.` });
        queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
        setIsBulkResending(false);
        setSelectedUserIds(new Set());
    };

    const toggleUserSelection = (userId: string) => {
        const newSelection = new Set(selectedUserIds);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedUserIds(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.size === filteredUsers?.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(filteredUsers?.map(u => u.id)));
        }
    };

    const handleResendVerification = async (email: string, name: string) => {
        setResendingEmail(email);
        try {
            const { data, error } = await supabase.functions.invoke('admin-resend', {
                body: { email, name: name || "Member" }
            });
            if (error || data?.error) throw (error || new Error(data?.error));
            toast({ title: "Verification Email Sent", description: `An email has been sent to ${email}` });
        } catch (error: any) {
            toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
        } finally {
            setResendingEmail(null);
        }
    };

    const handleBulkResend = async () => {
        const unverifiedSelected = filteredUsers?.filter(u => selectedUserIds.has(u.id) && !u.is_verified);
        if (!unverifiedSelected || unverifiedSelected.length === 0) {
            toast({ title: "No unverified users selected", variant: "destructive" });
            return;
        }

        setIsBulkResending(true);
        let successCount = 0;
        let failCount = 0;

        for (const user of unverifiedSelected) {
            try {
                const { data, error } = await supabase.functions.invoke('admin-resend', {
                    body: { email: user.email, name: user.full_name || "Member" }
                });
                if (error || data?.error) throw (error || new Error(data?.error));
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        toast({ 
            title: "Bulk Action Complete", 
            description: `Sent ${successCount} emails. ${failCount} failed.` 
        });
        setIsBulkResending(false);
        setSelectedUserIds(new Set());
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">User Directory</h2>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm">Manage and monitor your community members.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={downloadCSV}
                        className="h-11 px-6 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search name, email or college..."
                            className="pl-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Members", value: stats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Verified Members", value: stats.verified, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "New This Week", value: stats.growth, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0B0B0C] border border-slate-200/80 dark:border-white/10 p-6 rounded-[32px] shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all duration-300">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{item.value}</p>
                        </div>
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", item.bg)}>
                            <item.icon className={cn("w-6 h-6", item.color)} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-[28px] border border-primary/20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Targeted Selection</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">Quickly select groups for bulk actions.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl border-primary/20 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                            onClick={() => setSelectedUserIds(new Set(filteredUsers?.filter(u => !u.is_verified).map(u => u.id)))}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Select Unverified
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl border-primary/20 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                            onClick={() => setSelectedUserIds(new Set(filteredUsers?.filter(u => u.is_verified).map(u => u.id)))}
                        >
                            <QrCode className="w-3.5 h-3.5" />
                            Select Verified
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                            onClick={toggleSelectAll}
                        >
                            {selectedUserIds.size === filteredUsers?.length ? "Deselect All" : "Select All Members"}
                        </Button>
                        <select 
                            value={semesterFilter}
                            onChange={(e) => setSemesterFilter(e.target.value)}
                            className="h-9 px-4 rounded-xl bg-white dark:bg-white/5 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-zinc-300 focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                            <option value="all">All Semesters</option>
                            {["1", "2", "3", "4", "5", "6", "7", "8"].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0B0B0C] border border-slate-200/80 dark:border-white/10 rounded-[32px] shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden relative">
                    {/* Bulk Action Bar */}
                    {selectedUserIds.size > 0 && (
                        <div className="absolute top-0 inset-x-0 h-16 bg-primary dark:bg-primary z-10 flex items-center justify-between px-6 animate-in slide-in-from-top-full duration-300">
                            <div className="flex items-center gap-4">
                                <span className="text-white font-black uppercase tracking-widest text-xs">{selectedUserIds.size} Selected</span>
                                <div className="h-6 w-px bg-white/20 mx-2" />
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2"
                                    onClick={handleBulkResend}
                                    disabled={isBulkResending}
                                >
                                    {isBulkResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                    Resend Verif.
                                </Button>
                                <div className="h-6 w-px bg-white/20 mx-2" />
                                <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="h-8 bg-rose-500 hover:bg-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2"
                                    onClick={() => handleBulkModeration('block')}
                                    disabled={isBulkResending}
                                >
                                    <ShieldAlert className="w-3 h-3" />
                                    Block
                                </Button>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-white hover:bg-white/10 font-black uppercase tracking-widest text-[10px]"
                                onClick={() => setSelectedUserIds(new Set())}
                            >
                                Clear
                            </Button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
                                    <th className="px-6 py-5 w-10">
                                        <Checkbox 
                                            checked={filteredUsers?.length > 0 && selectedUserIds.size === filteredUsers?.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-slate-300 dark:border-white/20"
                                        />
                                    </th>
                                    <th className="px-6 py-5 text-left">
                                        <button onClick={() => handleSort('full_name')} className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors">
                                            Member {sortConfig?.key === 'full_name' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-left font-black uppercase tracking-widest text-[10px] text-slate-400">Academic Context</th>
                                    <th className="px-6 py-5 text-left">
                                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors">
                                            Status {sortConfig?.key === 'created_at' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-right font-black uppercase tracking-widest text-[10px] text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredUsers?.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className={cn(
                                            "group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors",
                                            selectedUserIds.has(user.id) && "bg-slate-50 dark:bg-white/[0.03]"
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            <Checkbox 
                                                checked={selectedUserIds.has(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                                className="border-slate-300 dark:border-white/20"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-[18px] bg-slate-100 dark:bg-white/10 overflow-hidden flex items-center justify-center border-2 border-white dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-bold text-slate-400">{user.full_name?.[0] || 'U'}</span>
                                                        )}
                                                    </div>
                                                    {user.is_verified && (
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-[#0B0B0C] flex items-center justify-center shadow-sm">
                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">{user.full_name || "New Member"}</p>
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 mb-1">{user.email}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 max-w-[180px] truncate">{user.college || "No College Set"}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.branch || "General"} • {user.semester || "N/A"}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {user.is_verified ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Active</Badge>
                                            ) : (
                                                <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!user.is_verified && (
                                                     <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 px-4 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[9px] gap-2 shadow-sm"
                                                        onClick={() => handleResendVerification(user.email, user.full_name)}
                                                        disabled={resendingEmail === user.email}
                                                    >
                                                        {resendingEmail === user.email ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Mail className="w-3 h-3 text-primary" />
                                                        )}
                                                        Verify User
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all" onClick={() => navigate(`/profile/${user.id}`)}>
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers?.length === 0 && (
                        <div className="p-20 text-center space-y-3">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No members found</h3>
                                <p className="text-slate-500 dark:text-zinc-500">Try adjusting your filters or search terms.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}




// --- SCANNER MANAGER ---


// --- EMAIL SETTINGS MANAGER ---
function EmailSettingsManager() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-email-settings'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('*')
                .like('key', 'email_enabled_%');

            const settingsMap: Record<string, boolean> = {};
            data?.forEach((s: any) => {
                settingsMap[s.key] = s.value === 'true';
            });
            return settingsMap;
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: boolean }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { data, error } = await supabase.rpc('admin_update_system_setting', {
                p_key: key,
                p_value: value ? 'true' : 'false',
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-email-settings'] });
            toast({ title: "Preference Updated", description: "Email setting has been saved." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const emailFeatures = [
        { key: 'email_enabled_welcome', label: 'Welcome Emails', description: 'Sent to new users upon registration.', icon: Sparkles },
        { key: 'email_enabled_reset_password', label: 'Password Reset', description: 'Authentication emails for password recovery.', icon: ShieldAlert },
        { key: 'email_enabled_password_changed', label: 'Security Alerts', description: 'Notifies users when their password is changed.', icon: ShieldCheck },
        { key: 'email_enabled_ticket', label: 'Event Tickets', description: 'Sends QR-code tickets after event booking.', icon: QrCode },
        { key: 'email_enabled_order_alert', label: 'Marketplace Alerts', description: 'Order confirmations for buyers and sellers.', icon: ShoppingBag },
        { key: 'email_enabled_dispute_alert', label: 'Dispute Notifications', description: 'Alerts admins about new marketplace disputes.', icon: ShieldAlert },
        { key: 'email_enabled_verification_notice', label: 'Verification Reminders', description: 'Sent to unverified users to confirm email.', icon: Mail },
        
    ];

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black font-display tracking-tight">Email Preferences</h2>
                    <p className="text-muted-foreground font-medium">Control which automated emails are sent from the platform.</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20">
                    <Mail className="w-5 h-5" />
                    <span className="font-bold text-sm">Active Channels</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {emailFeatures.map((feature) => {
                    const isEnabled = settings?.[feature.key] ?? true; // Default to true if not set
                    return (
                        <Card key={feature.key} className={cn(
                            "group border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden relative",
                            !isEnabled && "opacity-80 grayscale-[0.5]"
                        )}>
                            <div className={cn(
                                "absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-colors duration-500",
                                isEnabled ? "bg-primary/20" : "bg-zinc-500/10"
                            )} />
                            
                            <CardContent className="p-8 relative z-10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                                            isEnabled 
                                                ? "bg-gradient-to-br from-primary to-indigo-600 text-white" 
                                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                                        )}>
                                            <feature.icon className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-black text-xl tracking-tight">{feature.label}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{feature.description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleMutation.mutate({ key: feature.key, value: !isEnabled })}
                                        disabled={toggleMutation.isPending}
                                        className={cn(
                                            "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            isEnabled ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-transform duration-300",
                                                isEnabled ? "translate-x-7" : "translate-x-0.5"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <Badge variant={isEnabled ? "default" : "secondary"} className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        isEnabled ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                    )}>
                                        {isEnabled ? "Delivery Active" : "Delivery Paused"}
                                    </Badge>
                                    
                                    {toggleMutation.isPending && (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            <div className="bg-zinc-950 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-black">Pro Tip: Global Override</h3>
                    <p className="text-zinc-400 font-medium max-w-2xl leading-relaxed">
                        These settings directly control the email triggers. If a feature is "Paused", no outgoing emails of that type will be processed by the Edge Function, saving on API quotas and ensuring user preferences (or system maintenance) are respected.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                        <div className="p-2 rounded-lg bg-white/10">
                            <ShieldCheck className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-sm font-bold text-zinc-300">Settings are applied instantly across the entire platform.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// End of AdminDashboard.tsx

// --- SETTINGS MANAGER ---
function SettingsManager() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('*');

            // Convert array to object
            const settingsMap: Record<string, string> = {};
            data?.forEach((s: any) => {
                settingsMap[s.key] = s.value;
            });
            return settingsMap;
        }
    });

    // Update Single Setting
    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { data, error } = await supabase.rpc('admin_update_system_setting', {
                p_key: key,
                p_value: value,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast({ title: "Settings Updated", description: "Changes saved successfully." });
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    // Handle File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);

            // Sanitize filename
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `admin-qr-${Date.now()}.${fileExt}`;

            console.log("Uploading file:", fileName);

            // Upload to 'avatars' (public bucket)
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            console.log("Public URL:", publicUrl);

            // Save URL
            updateSetting.mutate({ key: 'admin_qr_url', value: publicUrl });

        } catch (error: any) {
            console.error("File handling failed:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            // Reset input value to allow selecting same file again if needed
            e.target.value = '';
        }
    };

    const isPopupEnabled = settings?.['show_signin_popup'] === 'true';
    const upiId = settings?.['admin_upi_id'] || '';
    const qrUrl = settings?.['admin_qr_url'] || '';

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h2 className="text-2xl font-bold font-display">Platform Settings</h2>
                <p className="text-muted-foreground">Manage global configurations for the application.</p>
            </div>



            {/* UX Settings */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>User Experience</CardTitle>
                    <CardDescription>Control how users interact with the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium">Show Sign-In Popup</Label>
                            <p className="text-sm text-muted-foreground">
                                Prompt unauthenticated users to sign in when they visit the site.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isPopupEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateSetting.mutate({ key: 'show_signin_popup', value: String(!isPopupEnabled) })}
                                disabled={isLoading || updateSetting.isPending}
                                className={cn("min-w-[100px]", isPopupEnabled ? "bg-primary" : "text-muted-foreground")}
                            >
                                {updateSetting.isPending ? "Saving..." : (isPopupEnabled ? "Enabled" : "Disabled")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
