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
                        {activeSection === "events" && <EventsManager setConfirm={setConfirmDialog} />}
                        {activeSection === "marketplace" && <MarketplaceManager setConfirm={setConfirmDialog} />}
                        {activeSection === "opportunities" && <OpportunitiesManager setConfirm={setConfirmDialog} />}
                        {activeSection === "blog" && <BlogManager setConfirm={setConfirmDialog} />}
                        {activeSection === "scanner" && <ScannerManager />}
                        {activeSection === "moderation" && <ContentModeration setConfirm={setConfirmDialog} />}
                        {activeSection === "users" && <UsersManager />}

                        {activeSection === "lost-found" && <LostFoundManager setConfirm={setConfirmDialog} />}
                        {activeSection === "roadmaps" && <RoadmapsManager setConfirm={setConfirmDialog} />}
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

// ---------------- SUBCOMPONENTS ----------------

// --- LOST & FOUND MANAGER ---
: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: items, isLoading } = useQuery({
        queryKey: ['admin-lost-found'],
        queryFn: async () => {
            // Fetch all items (RLS allows select for all)
            const { data } = await supabase
                .from('lost_found_items')
                .select('*, profiles(full_name, email)') // Assuming user_id links to profiles
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_delete_lost_found_item', {
                p_item_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-lost-found'] });
            toast({ title: "Item Deleted", variant: "destructive" });
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });

    const toggleStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_update_lost_found_status', {
                p_item_id: id,
                p_status: status,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-lost-found'] });
            toast({ title: "Status Updated", description: "Item status has been changed." });
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold font-display">Lost & Found Manager</h2>
                <p className="text-muted-foreground">Manage reported lost and found items on campus.</p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                    <div className="rounded-md border border-border/50 overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-muted/50 border-b border-border/50 text-left">
                                <tr>
                                    <th className="p-4 font-medium text-muted-foreground">Item</th>
                                    <th className="p-4 font-medium text-muted-foreground">Type</th>
                                    <th className="p-4 font-medium text-muted-foreground">Location & Date</th>
                                    <th className="p-4 font-medium text-muted-foreground">Reporter</th>
                                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {items?.map((item: any) => (
                                    <tr key={item.id} className="group hover:bg-secondary/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-secondary/30 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Search className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="font-medium">{item.title}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={cn(
                                                item.type === 'lost' ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                                            )}>
                                                {item.type.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <span className="block text-foreground">{item.location}</span>
                                            <span className="text-xs">{item.date_lost_found}</span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {/* Fallback if profiles join fails or RLS blocks profile viewing (though usually public) */}
                                            {item.profiles ? (
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{item.profiles.full_name}</span>
                                                    <span className="text-xs">{item.profiles.email}</span>
                                                </div>
                                            ) : (
                                                <span>Unknown</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={item.status === 'resolved' ? 'default' : 'secondary'}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 text-xs">
                                                {item.status !== 'resolved' && (
                                                    <Button size="sm" variant="outline" onClick={() => toggleStatus.mutate({ id: item.id, status: 'resolved' })}>
                                                        Resolve
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirm({
                                                    isOpen: true,
                                                    title: "Delete Item?",
                                                    description: "Are you sure you want to delete this reported item?",
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
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground italic">No lost & found items.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
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
            const [notes, events, users, marketplace, opportunities, pendingMarketplace, pendingEvents, pendingNotes, pendingRooms] = await Promise.all([
                supabase.from('notes').select('id', { count: 'exact' }),
                supabase.from('events').select('id', { count: 'exact' }),
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('marketplace_items').select('id', { count: 'exact' }),
                supabase.from('opportunities').select('id', { count: 'exact' }),
                supabase.from('marketplace_items').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('events').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('notes').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('rooms').select('id', { count: 'exact' }).eq('status', 'pending'),
            ]);
            return {
                notes: notes.count || 0,
                events: events.count || 0,
                users: users.count || 0,
                marketplace: marketplace.count || 0,
                opportunities: opportunities.count || 0,
                pending: (pendingMarketplace.count || 0) + (pendingEvents.count || 0) + (pendingNotes.count || 0) + (pendingRooms.count || 0),
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
                <<StatCard title="Marketplace Items" value={stats?.marketplace || 0} icon={ShoppingBag} color="text-orange-500" bg="bg-orange-500/10" />
                <<<StatCard 
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
                            <div className="flex justify-between items-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-sm">Event Participation</span>
                                </div>
                                <span className="text-xs font-black text-purple-600">+12% UP</span>
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

// --- EVENTS MANAGER (CRUD) ---
: { setConfirm: any }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const { data: events, isLoading } = useQuery({
        queryKey: ['admin-all-events'],
        queryFn: async () => {
            const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
            return data || [];
        }
    });

    const deleteEvent = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_delete_event', {
                p_event_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
            toast({ title: "Event Deleted", variant: "destructive" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display">Events Manager</h2>
                    <p className="text-muted-foreground">Create, edit, and manage all campus events.</p>
                </div>
                <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" /> Create Event
                </Button>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                    <div className="rounded-md border border-border/50 overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-muted/50 border-b border-border/50 text-left">
                                <tr>
                                    <th className="p-4 font-medium text-muted-foreground">Event</th>
                                    <th className="p-4 font-medium text-muted-foreground">Date & Time</th>
                                    <th className="p-4 font-medium text-muted-foreground">Venue</th>
                                    <th className="p-4 font-medium text-muted-foreground">Organizer</th>
                                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {events?.map((event: Event) => (
                                    <tr key={event.id} className="group hover:bg-secondary/30 transition-colors">
                                        <td className="p-4 font-medium">
                                            {event.title}
                                            {event.is_featured && <Badge variant="secondary" className="ml-2 text-xs">Featured</Badge>}
                                        </td>
                                        <td className="p-4 text-muted-foreground">{event.date} • {event.time}</td>
                                        <td className="p-4 text-muted-foreground">{event.venue}</td>
                                        <td className="p-4 text-muted-foreground">{event.organizer}</td>
                                        <td className="p-4">
                                            <Badge variant={event.status === 'approved' ? 'default' : event.status === 'pending' ? 'secondary' : 'destructive'}>
                                                {event.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${event.id}`)}>
                                                    Manage
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => { setEditingEvent(event); setIsDialogOpen(true); }}>
                                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setConfirm({
                                                    isOpen: true,
                                                    title: "Delete Event?",
                                                    description: "Are you sure you want to delete this event?",
                                                    confirmText: "Delete",
                                                    variant: "destructive",
                                                    onConfirm: () => deleteEvent.mutate(event.id)
                                                })}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {events?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No events found. Create one above!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Event Dialog form */}
            <EventDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingEvent}
                onSuccess={() => { setIsDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-all-events'] }); }}
            />
        </div>
    );
}

// --- TASKS MANAGER ---

// --- OPPORTUNITIES MANAGER ---
: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    const emptyForm = {
        id: "",
        slug: "",
        title: "",
        company: "",
        company_logo: "",
        banner_url: "",
        category: "",
        industry: "",
        type: "Internship",
        work_mode: "Remote",
        location: "",
        duration: "",
        stipend_text: "",
        stipend_min: "",
        stipend_max: "",
        stipend_currency: "INR",
        work_hours: "",
        employment_type: "",
        experience: "",
        eligibility: "",
        education: "",
        required_skills: "",
        branches_allowed: "",
        year_of_study: "",
        age_limit: "",
        description: "",
        introduction: "",
        program_overview: "",
        domains: "",
        eligibility_criteria: "",
        how_to_apply: "",
        faqs: [] as { question: string; answer: string }[],
        show_header: true,
        show_role_overview: true,
        show_eligibility_skills: true,
        show_introduction: true,
        show_program_overview: true,
        show_domains: true,
        show_eligibility_criteria: true,
        show_how_to_apply: true,
        show_faqs: true,
        show_listing_details: true,
        show_share: true,
        apply_by: "",
        valid_through: "",
        openings: "",
        open_method: "",
        application_fee: "",
        apply_url: "",
        is_paid: false,
        is_featured: false,
        referral_code: "",
        show_referral_code: false,
    };

    const [formData, setFormData] = useState({ ...emptyForm });
    const [suggestingField, setSuggestingField] = useState<string | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState<any>(null);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            if (!file) return;

            setUploadingBanner(true);
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `opportunity-banner-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, banner_url: publicUrl }));
            toast({ title: "Upload Success", description: "Banner image uploaded successfully." });
        } catch (err: any) {
            console.error("Banner upload error:", err);
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        } finally {
            setUploadingBanner(false);
        }
    };

    const fetchAiSuggestion = async (field: string) => {
        if (!formData.title || !formData.company) {
            toast({
                title: "Missing Info",
                description: "Please enter Title and Company first for AI to work!",
                variant: "destructive"
            });
            return;
        }

        setSuggestingField(field);
        try {
            const { data, error } = await supabase.functions.invoke('opportunity-suggestions', {
                body: { title: formData.title, company: formData.company, field }
            });

            if (error) {
                console.error("Supabase Function Error Object:", error);
                throw error;
            }
            if (data?.error) throw new Error(data.error);
            
            if (data?.suggestion) {
                if (field === 'faqs' && Array.isArray(data.suggestion)) {
                    setFormData(prev => ({ ...prev, faqs: [...(prev.faqs || []), ...data.suggestion] }));
                } else {
                    setFormData(prev => ({ ...prev, [field]: data.suggestion }));
                }
                toast({ title: "AI Suggestion Added!", description: `Field ${field} updated.` });
            }
        } catch (err: any) {
            console.error("AI Suggestion Error FULL:", err);
            let errorMessage = err.message || "An unknown error occurred";
            
            // Supabase Functions error objects can contain details in context
            if (err.context) {
                try {
                    const body = await err.context.json();
                    console.log("Error body from function:", body);
                    if (body.error) errorMessage = `${body.error}`;
                    if (body.details) errorMessage += ` - ${body.details}`;
                } catch (e) {
                    // Fallback to text if JSON parse fails
                    try {
                        const text = await err.context.text();
                        errorMessage += ` (${text})`;
                    } catch (e2) {}
                }
            }
            
            toast({ 
                title: "AI Failed", 
                description: errorMessage, 
                variant: "destructive" 
            });
        } finally {
            setSuggestingField(null);
        }
    };

    const AiSuggestButton = ({ field }: { field: string }) => (
        <Button
            size="sm"
            variant="ghost"
            type="button"
            className="h-7 px-2.5 rounded-full text-indigo-600 dark:text-indigo-400 font-black text-[9px] tracking-wider hover:bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm transition-all duration-300"
            onClick={() => fetchAiSuggestion(field)}
            disabled={suggestingField === field}
        >
            {suggestingField === field ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Sparkles className="w-4 h-4" />
            )}
            <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider">AI</span>
        </Button>
    );


    const toCsv = (value: any) => Array.isArray(value) ? value.join(", ") : (value || "");
    const toList = (value: string) => value.split(/\n|,/).map(v => v.trim()).filter(Boolean);
    const slugify = (value: string) =>
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    const normalizeType = (value?: string) =>
        (value || "")
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/\s+/g, " ")
            .trim();
    const canonicalType = (value?: string) => {
        const v = normalizeType(value);
        if (v === "internship") return "Internship";
        if (v === "campus ambassador" || v === "campusambassador") return "Campus Ambassador";
        if (v === "swags and certification" || v === "swags and certificates" || v === "swags certification") return "Swags and Certification";
        if (v === "job") return "Job";
        return value?.trim() || "Internship";
    };

    const resetForm = (data?: any, typeOverride?: string) => {
        if (!data) {
            setFormData({ ...emptyForm, type: typeOverride || emptyForm.type });
            return;
        }
        setFormData({
            ...emptyForm,
            ...data,
            stipend_min: data.stipend_min ?? "",
            stipend_max: data.stipend_max ?? "",
            openings: data.openings ?? "",
            application_fee: data.application_fee ?? "",
            required_skills: toCsv(data.required_skills),
            branches_allowed: toCsv(data.branches_allowed),
            domains: toCsv(data.domains),
            eligibility_criteria: toCsv(data.eligibility_criteria),
            how_to_apply: toCsv(data.how_to_apply),
            faqs: Array.isArray(data.faqs) ? data.faqs : [],
            show_header: data.show_header ?? true,
            show_role_overview: data.show_role_overview ?? true,
            show_eligibility_skills: data.show_eligibility_skills ?? true,
            show_introduction: data.show_introduction ?? true,
            show_program_overview: data.show_program_overview ?? true,
            show_domains: data.show_domains ?? true,
            show_eligibility_criteria: data.show_eligibility_criteria ?? true,
            show_how_to_apply: data.show_how_to_apply ?? true,
            show_faqs: data.show_faqs ?? true,
            show_listing_details: data.show_listing_details ?? true,
            show_share: data.show_share ?? true,
            is_featured: !!data.is_featured,
            referral_code: data.referral_code || "",
            show_referral_code: !!data.show_referral_code,
            apply_by: data.apply_by || "",
            valid_through: data.valid_through || "",
            type: canonicalType(typeOverride || data.type || "Internship"),
        });
    };

    const { data: opportunities = [], isLoading } = useQuery({
        queryKey: ['admin-opportunities'],
        queryFn: async () => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) return [];
            const creds = JSON.parse(credsStr);
            const { data, error } = await supabase.rpc('admin_get_opportunities', {
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) {
                console.error("Admin Opportunities Fetch Error", error);
                toast({
                    title: "Failed to load opportunities",
                    description: error.message || "Unknown RPC error. Did you run the migration?",
                    variant: "destructive"
                });
                const { data: fallback } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
                return fallback || [];
            }
            return data || [];
        }
    });

    const { data: applications = [], isLoading: applicationsLoading } = useQuery({
        queryKey: ['admin-opportunity-applications'],
        queryFn: async () => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) return [];
            const creds = JSON.parse(credsStr);
            const { data, error } = await supabase.rpc('admin_get_opportunity_applications', {
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) {
                console.error("Admin Applications Fetch Error", error);
                toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
                return [];
            }
            return data || [];
        }
    });

    const upsertOpportunity = useMutation({
        mutationFn: async () => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const payload = {
                id: formData.id || undefined,
                slug: formData.slug || slugify(formData.title),
                title: formData.title,
                company: formData.company,
                company_logo: formData.company_logo || null,
                banner_url: formData.banner_url || null,
                category: formData.category || null,
                industry: formData.industry || null,
                type: canonicalType(formData.type),
                work_mode: formData.work_mode || null,
                location: formData.location || null,
                duration: formData.duration || null,
                stipend_text: formData.stipend_text || null,
                stipend_min: formData.stipend_min ? Number(formData.stipend_min) : null,
                stipend_max: formData.stipend_max ? Number(formData.stipend_max) : null,
                stipend_currency: formData.stipend_currency || "INR",
                work_hours: formData.work_hours || null,
                employment_type: formData.employment_type || null,
                experience: formData.experience || null,
                eligibility: formData.eligibility || null,
                education: formData.education || null,
                required_skills: toList(formData.required_skills),
                branches_allowed: toList(formData.branches_allowed),
                year_of_study: formData.year_of_study || null,
                age_limit: formData.age_limit || null,
                description: formData.description || null,
                introduction: formData.introduction || null,
                program_overview: formData.program_overview || null,
                domains: toList(formData.domains),
                eligibility_criteria: toList(formData.eligibility_criteria),
                how_to_apply: toList(formData.how_to_apply),
                faqs: formData.faqs || [],
                show_header: !!formData.show_header,
                show_role_overview: !!formData.show_role_overview,
                show_eligibility_skills: !!formData.show_eligibility_skills,
                show_introduction: !!formData.show_introduction,
                show_program_overview: !!formData.show_program_overview,
                show_domains: !!formData.show_domains,
                show_eligibility_criteria: !!formData.show_eligibility_criteria,
                show_how_to_apply: !!formData.show_how_to_apply,
                show_faqs: !!formData.show_faqs,
                show_listing_details: !!formData.show_listing_details,
                show_share: !!formData.show_share,
                apply_by: formData.apply_by || null,
                valid_through: formData.valid_through || null,
                openings: formData.openings ? Number(formData.openings) : null,
                open_method: formData.open_method || null,
                application_fee: formData.application_fee ? Number(formData.application_fee) : null,
                apply_url: formData.apply_url || null,
                is_paid: !!formData.is_paid,
                is_featured: !!formData.is_featured,
                referral_code: formData.referral_code || null,
                show_referral_code: !!formData.show_referral_code,
            };

            const { data, error } = await supabase.rpc('admin_upsert_opportunity', {
                p_username: creds.username,
                p_password: creds.password,
                p_data: payload
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: editing ? "Opportunity Updated" : "Opportunity Created" });
            setDialogOpen(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const deleteOpportunity = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);
            const { error } = await supabase.rpc('admin_delete_opportunity', {
                p_opportunity_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
            toast({ title: "Opportunity Deleted", variant: "destructive" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const updateApplicationStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);
            const { error } = await supabase.rpc('admin_update_opportunity_application_status', {
                p_id: id,
                p_status: status,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-opportunity-applications'] }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const toggleFeatured = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);
            const { data, error } = await supabase.rpc('admin_set_opportunity_featured', {
                p_opportunity_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
            toast({ 
                title: data.featured ? "Marked as Featured" : "Removed from Featured",
                description: data.featured ? "This listing is now visible on the homepage." : "Listing removed from homepage priority."
            });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const deleteApplication = useMutation({
        mutationFn: async (id: string) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);
            const { error } = await supabase.rpc('admin_delete_opportunity_application', {
                p_id: id,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-opportunity-applications'] });
            toast({ title: "Application Deleted", variant: "destructive" });
        }
    });

    const openCreate = (type: string) => {
        setEditing(null);
        resetForm(undefined, type);
        setDialogOpen(true);
    };

    const openEdit = (item: any) => {
        setEditing(item);
        resetForm(item);
        setDialogOpen(true);
    };

    const sections = [
        { title: "Available Internships", key: "Internship" },
        { title: "Campus Ambassador", key: "Campus Ambassador" },
        { title: "Swags & Certification", key: "Swags and Certification" },
    ];

    const sectionKeys = {
        internships: "show_opportunities_internships",
        ambassadors: "show_opportunities_campus_ambassador",
        swags: "show_opportunities_swags_certification",
    };

    const { data: sectionSettings } = useQuery({
        queryKey: ['admin-opportunity-sections'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('key,value')
                .in('key', Object.values(sectionKeys));
            const map: Record<string, string> = {};
            data?.forEach((row: any) => { map[row.key] = row.value; });
            return map;
        }
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ key, value, description: 'Updated via Opportunities Manager' });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-opportunity-sections'] }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const sectionEnabled = (key: string) => sectionSettings?.[key] !== 'false';

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold font-display">Opportunities Manager</h2>
                <p className="text-muted-foreground">Create, edit, and manage internship, ambassador, and swag listings.</p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Section Visibility</CardTitle>
                    <CardDescription>Turn sections on/off for the Opportunities page.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { key: sectionKeys.internships, label: "Available Internships" },
                        { key: sectionKeys.ambassadors, label: "Campus Ambassador" },
                        { key: sectionKeys.swags, label: "Swags & Certification" },
                    ].map((s) => {
                        const enabled = sectionEnabled(s.key);
                        return (
                            <div key={s.key} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">{s.label}</Label>
                                    <p className="text-xs text-muted-foreground">Show this section on website</p>
                                </div>
                                <Button
                                    variant={enabled ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateSetting.mutate({ key: s.key, value: String(!enabled) })}
                                    disabled={updateSetting.isPending}
                                    className={cn("min-w-[90px]", enabled ? "bg-primary" : "text-muted-foreground")}
                                >
                                    {enabled ? "Enabled" : "Disabled"}
                                </Button>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {sections.map((section) => {
                const items = opportunities.filter((item: any) => {
                    const itemType = canonicalType(item.type);
                    return normalizeType(itemType) === normalizeType(section.key);
                });
                return (
                    <Card key={section.key} className="border-border/50 shadow-sm">
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>{section.title}</CardTitle>
                                <CardDescription>{items.length} listings</CardDescription>
                            </div>
                            <Button onClick={() => openCreate(section.key)}>
                                <Plus className="w-4 h-4 mr-2" /> Add {section.key}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border border-border/50 overflow-x-auto max-h-[400px] overflow-y-auto overscroll-behavior-y-contain">
                                <table className="w-full text-sm min-w-[900px] border-separate border-spacing-0">
                                    <thead className="text-left">
                                        <tr>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Title</th>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Company</th>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Location</th>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Apply By</th>
                                            <th className="p-4 font-medium text-muted-foreground text-center sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Featured</th>
                                            <th className="p-4 font-medium text-muted-foreground text-right sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {isLoading && (
                                            <tr>
                                                <td colSpan={6} className="p-6 text-center text-muted-foreground">Loading opportunities...</td>
                                            </tr>
                                        )}
                                        {!isLoading && items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="p-4 font-medium max-w-[280px] truncate" title={item.title}>{item.title}</td>
                                                <td className="p-4">{item.company || "—"}</td>
                                                <td className="p-4">{item.location || "—"}</td>
                                                <td className="p-4 text-muted-foreground">{item.apply_by || "—"}</td>
                                                <td className="p-4 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className={cn(
                                                            "transition-all duration-300",
                                                            item.is_featured ? "text-amber-500 hover:text-amber-600 bg-amber-50" : "text-muted-foreground hover:text-amber-500"
                                                        )}
                                                        onClick={() => toggleFeatured.mutate(item.id)}
                                                        disabled={toggleFeatured.isPending}
                                                    >
                                                        <Star className={cn("w-4 h-4", item.is_featured && "fill-current")} />
                                                    </Button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={() => setViewingApplicantsFor(item)}
                                                        >
                                                            <Users className="w-3.5 h-3.5 mr-1.5" />
                                                            <span className="font-bold">
                                                                {applications.filter((a: any) => a.opportunity_id === item.id).length}
                                                            </span>
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => setConfirm({
                                                                isOpen: true,
                                                                title: "Delete Opportunity?",
                                                                description: "Are you sure you want to delete this listing?",
                                                                confirmText: "Delete",
                                                                variant: "destructive",
                                                                onConfirm: () => deleteOpportunity.mutate(item.id)
                                                            })}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!isLoading && items.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-6 text-center text-muted-foreground">No listings found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Individual Applicants Dialog */}
            <Dialog open={!!viewingApplicantsFor} onOpenChange={() => setViewingApplicantsFor(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="p-6 pb-4 bg-secondary/20 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-2xl font-black font-display tracking-tight">
                                        {viewingApplicantsFor?.title}
                                    </DialogTitle>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {viewingApplicantsFor?.type}
                                    </Badge>
                                </div>
                                <DialogDescription className="font-medium">
                                    {viewingApplicantsFor?.company} • {applications.filter((a: any) => a.opportunity_id === viewingApplicantsFor?.id).length} Total Applications
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
                            <table className="w-full text-sm border-separate border-spacing-0">
                                <thead className="text-left">
                                    <tr>
                                        <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Applicant</th>
                                        <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Contact Info</th>
                                        <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Academic Details</th>
                                        <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Status</th>
                                        <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {(() => {
                                        const subset = applications.filter((a: any) => a.opportunity_id === viewingApplicantsFor?.id);
                                        if (subset.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                                                <Users className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                            <p className="text-muted-foreground font-medium">No applications found for this listing.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return subset.map((app: any) => (
                                            <tr key={app.id} className="hover:bg-secondary/20 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-base tracking-tight">{app.name}</span>
                                                        <div className="flex gap-2 mt-1">
                                                            {app.linkedin_url && (
                                                                <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] font-bold">LinkedIn</a>
                                                            )}
                                                            {app.portfolio_url && (
                                                                <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline text-[10px] font-bold">Portfolio</a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col text-xs gap-1">
                                                        <span className="font-medium text-muted-foreground">{app.email}</span>
                                                        <span className="text-[10px] text-muted-foreground/70">{app.phone || "No phone"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-bold">{app.college}</span>
                                                        <span className="text-muted-foreground">{app.branch} • Year {app.year_of_study}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Select
                                                        value={app.status}
                                                        onValueChange={(value) => updateApplicationStatus.mutate({ id: app.id, status: value })}
                                                    >
                                                        <SelectTrigger className="h-9 w-[130px] rounded-xl border-border/50 bg-secondary/30">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                                            <SelectItem value="submitted">Submitted</SelectItem>
                                                            <SelectItem value="link_sent">Link Sent</SelectItem>
                                                            <SelectItem value="follow_up">Follow Up</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setConfirm({
                                                            isOpen: true,
                                                            title: "Delete Application?",
                                                            description: "Remove this application record?",
                                                            confirmText: "Delete",
                                                            variant: "destructive",
                                                            onConfirm: () => deleteApplication.mutate(app.id)
                                                        })}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <DialogFooter className="p-6 pt-2 bg-secondary/10 border-t border-border/50">
                        <Button variant="outline" className="rounded-xl" onClick={() => setViewingApplicantsFor(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-secondary/10">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        All Applications
                    </CardTitle>
                    <CardDescription>Global view of all interest submissions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border border-border/50 overflow-x-auto max-h-[400px] overflow-y-auto overscroll-behavior-y-contain">
                        <table className="w-full text-sm min-w-[1000px] border-separate border-spacing-0">
                            <thead className="text-left">
                                <tr>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Applicant</th>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Email</th>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Opportunity</th>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Type</th>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Submitted</th>
                                    <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Status</th>
                                    <th className="p-4 font-medium text-muted-foreground text-right sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {applicationsLoading && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">Loading applications...</td>
                                    </tr>
                                )}
                                {!applicationsLoading && applications.map((app: any) => (
                                    <tr key={app.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="p-4 font-medium">{app.name}</td>
                                        <td className="p-4">{app.email}</td>
                                        <td className="p-4 max-w-[240px] truncate" title={app.opportunity_title}>{app.opportunity_title}</td>
                                        <td className="p-4">{app.opportunity_type}</td>
                                        <td className="p-4 text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <Select
                                                value={app.status}
                                                onValueChange={(value) => updateApplicationStatus.mutate({ id: app.id, status: value })}
                                            >
                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                    <SelectItem value="link_sent">Link Sent</SelectItem>
                                                    <SelectItem value="follow_up">Follow Up</SelectItem>
                                                    <SelectItem value="closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setConfirm({
                                                    isOpen: true,
                                                    title: "Delete Application?",
                                                    description: "Remove this application record?",
                                                    confirmText: "Delete",
                                                    variant: "destructive",
                                                    onConfirm: () => deleteApplication.mutate(app.id)
                                                })}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!applicationsLoading && applications.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">No applications yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {(() => {
                const known = new Set(sections.map((s) => normalizeType(s.key)));
                const others = opportunities.filter((item: any) => {
                    const itemType = normalizeType(item.type || "internship");
                    return !known.has(itemType);
                });
                if (!others.length) return null;
                return (
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Other / Unmapped</CardTitle>
                            <CardDescription>{others.length} listings need a valid type</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border border-border/50 overflow-x-auto max-h-[400px] overflow-y-auto overscroll-behavior-y-contain">
                                <table className="w-full text-sm min-w-[900px] border-separate border-spacing-0">
                                    <thead className="text-left">
                                        <tr>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Title</th>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Type</th>
                                            <th className="p-4 font-medium text-muted-foreground sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Company</th>
                                            <th className="p-4 font-medium text-muted-foreground text-right sticky top-0 z-20 bg-muted border-b border-border/50 [transform:translateZ(0)] will-change-transform">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {others.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="p-4 font-medium max-w-[280px] truncate" title={item.title}>{item.title}</td>
                                                <td className="p-4">{item.type || "—"}</td>
                                                <td className="p-4">{item.company || "—"}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={() => setViewingApplicantsFor(item)}
                                                        >
                                                            <Users className="w-3.5 h-3.5 mr-1.5" />
                                                            <span className="font-bold">
                                                                {applications.filter((a: any) => a.opportunity_id === item.id).length}
                                                            </span>
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                                            <Edit2 className="w-4 h-4" />
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
                );
            })()}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-[98vw] md:max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_100px_-20px_rgba(79,70,229,0.15)] sm:rounded-[2rem]">
                    <DialogHeader className="px-6 py-6 bg-gradient-to-br from-indigo-950 via-[#0B1120] to-black text-white relative overflow-hidden border-b border-white/5">
                        <DialogTitle className="text-lg md:text-2xl font-black tracking-tight">{editing ? "Edit Opportunity" : "Create Opportunity"}</DialogTitle>
                        <DialogDescription className="text-indigo-200/70 font-medium">Fill out the details for this listing.</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[80vh] md:max-h-[70vh] overflow-y-auto p-4 md:p-6 space-y-4 pt-4">
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Core</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Listing Identity</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-slate-400">Required</div>
                                    <Button
                                        size="sm"
                                        variant={formData.show_header ? "default" : "outline"}
                                        className="rounded-full px-4 h-8 font-bold text-[10px] uppercase tracking-wider"
                                        onClick={() => setFormData({ ...formData, show_header: !formData.show_header })}
                                    >
                                        {formData.show_header ? "Header On" : "Header Off"}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Title</Label>
                                        <AiSuggestButton field="title" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.title} 
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Slug</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.slug} 
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                            <SelectItem value="Campus Ambassador">Campus Ambassador</SelectItem>
                                            <SelectItem value="Swags and Certification">Swags and Certification</SelectItem>
                                            <SelectItem value="Job">Job</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Company</Label>
                                        <AiSuggestButton field="company" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.company} 
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Company Logo URL</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.company_logo} 
                                        onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Banner Image (Upload or Paste URL)</Label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBannerUpload}
                                                disabled={uploadingBanner}
                                                className="cursor-pointer bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl file:cursor-pointer file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-600 dark:file:text-indigo-400 file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-3 file:font-bold hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/20 file:h-full file:mt-[-8px]"
                                            />
                                            {uploadingBanner && <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />}
                                        </div>
                                        <Input
                                            value={formData.banner_url}
                                            onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                                            placeholder="Or enter URL here..."
                                            className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Metadata</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Work & Classification</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={formData.show_role_overview ? "default" : "outline"}
                                    onClick={() => setFormData({ ...formData, show_role_overview: !formData.show_role_overview })}
                                >
                                    {formData.show_role_overview ? "Role Overview On" : "Role Overview Off"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Work Mode</Label>
                                    <Select value={formData.work_mode} onValueChange={(value) => setFormData({ ...formData, work_mode: value })}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Remote">Remote</SelectItem>
                                            <SelectItem value="Onsite">Onsite</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="Flexible">Flexible</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Location</Label>
                                        <AiSuggestButton field="location" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.location} 
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Category</Label>
                                        <AiSuggestButton field="category" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.category} 
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Industry</Label>
                                        <AiSuggestButton field="industry" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.industry} 
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</Label>
                                        <AiSuggestButton field="duration" />
                                    </div>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.duration} 
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Work Hours</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.work_hours} 
                                        onChange={(e) => setFormData({ ...formData, work_hours: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Employment Type</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.employment_type} 
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Experience</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.experience} 
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Compensation</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Stipend & Payment</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Stipend Text</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.stipend_text} 
                                        onChange={(e) => setFormData({ ...formData, stipend_text: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Stipend Min</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.stipend_min} 
                                        onChange={(e) => setFormData({ ...formData, stipend_min: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Stipend Max</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.stipend_max} 
                                        onChange={(e) => setFormData({ ...formData, stipend_max: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Stipend Currency</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.stipend_currency} 
                                        onChange={(e) => setFormData({ ...formData, stipend_currency: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Paid</Label>
                                    <Select value={formData.is_paid ? "yes" : "no"} onValueChange={(value) => setFormData({ ...formData, is_paid: value === "yes" })}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Eligibility</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Who Can Apply</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={formData.show_eligibility_skills ? "default" : "outline"}
                                    onClick={() => setFormData({ ...formData, show_eligibility_skills: !formData.show_eligibility_skills })}
                                >
                                    {formData.show_eligibility_skills ? "Eligibility On" : "Eligibility Off"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Eligibility</Label>
                                        <AiSuggestButton field="eligibility" />
                                    </div>
                                    <Textarea 
                                        rows={3} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.eligibility} 
                                        onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Education</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.education} 
                                        onChange={(e) => setFormData({ ...formData, education: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Required Skills (comma or newline)</Label>
                                        <AiSuggestButton field="required_skills" />
                                    </div>
                                    <Textarea 
                                        rows={2} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.required_skills} 
                                        onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Branches Allowed (comma)</Label>
                                        <AiSuggestButton field="branches_allowed" />
                                    </div>
                                    <Textarea 
                                        rows={2} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.branches_allowed} 
                                        onChange={(e) => setFormData({ ...formData, branches_allowed: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Year of Study</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.year_of_study} 
                                        onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Age Limit</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.age_limit} 
                                        onChange={(e) => setFormData({ ...formData, age_limit: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Content</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Description & Program</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                                        <AiSuggestButton field="description" />
                                    </div>
                                    <Textarea 
                                        rows={3} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Introduction</Label>
                                            <AiSuggestButton field="introduction" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={formData.show_introduction ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_introduction: !formData.show_introduction })}
                                        >
                                            {formData.show_introduction ? "On" : "Off"}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        rows={3} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.introduction} 
                                        onChange={(e) => setFormData({ ...formData, introduction: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Program Overview</Label>
                                            <AiSuggestButton field="program_overview" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={formData.show_program_overview ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_program_overview: !formData.show_program_overview })}
                                        >
                                            {formData.show_program_overview ? "On" : "Off"}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        rows={3} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.program_overview} 
                                        onChange={(e) => setFormData({ ...formData, program_overview: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Domains / Projects (comma)</Label>
                                            <AiSuggestButton field="domains" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={formData.show_domains ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_domains: !formData.show_domains })}
                                        >
                                            {formData.show_domains ? "On" : "Off"}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        rows={2} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.domains} 
                                        onChange={(e) => setFormData({ ...formData, domains: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Eligibility Criteria (comma)</Label>
                                            <AiSuggestButton field="eligibility_criteria" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={formData.show_eligibility_criteria ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_eligibility_criteria: !formData.show_eligibility_criteria })}
                                        >
                                            {formData.show_eligibility_criteria ? "On" : "Off"}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        rows={2} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.eligibility_criteria} 
                                        onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">How to Apply (comma or newline)</Label>
                                            <AiSuggestButton field="how_to_apply" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={formData.show_how_to_apply ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_how_to_apply: !formData.show_how_to_apply })}
                                        >
                                            {formData.show_how_to_apply ? "On" : "Off"}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        rows={2} 
                                        className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"
                                        value={formData.how_to_apply} 
                                        onChange={(e) => setFormData({ ...formData, how_to_apply: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">FAQs</Label>
                                            <AiSuggestButton field="faqs" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={formData.show_faqs ? "default" : "outline"}
                                                onClick={() => setFormData({ ...formData, show_faqs: !formData.show_faqs })}
                                            >
                                                {formData.show_faqs ? "On" : "Off"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setFormData({ ...formData, faqs: [...(formData.faqs || []), { question: "", answer: "" }] })}
                                            >
                                                Add FAQ
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(formData.faqs || []).map((faq, idx) => (
                                            <div key={idx} className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50 dark:bg-slate-900 p-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Question</Label>
                                                        <Input
                                                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                                                            value={faq.question}
                                                            onChange={(e) => {
                                                                const next = [...(formData.faqs || [])];
                                                                next[idx] = { ...next[idx], question: e.target.value };
                                                                setFormData({ ...formData, faqs: next });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Answer</Label>
                                                        <Input
                                                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                                                            value={faq.answer}
                                                            onChange={(e) => {
                                                                const next = [...(formData.faqs || [])];
                                                                next[idx] = { ...next[idx], answer: e.target.value };
                                                                setFormData({ ...formData, faqs: next });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pt-2 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            const next = [...(formData.faqs || [])].filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, faqs: next });
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {(formData.faqs || []).length === 0 && (
                                            <div className="text-xs text-muted-foreground">No FAQs added yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-4 md:p-6 transition-all duration-300">
                            <div className="flex flex-row items-center justify-between gap-4 mb-3 md:mb-4">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Process</div>
                                    <div className="text-sm md:text-base font-bold font-display text-slate-900 dark:text-slate-100">Dates & Submission</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={formData.show_listing_details ? "default" : "outline"}
                                        onClick={() => setFormData({ ...formData, show_listing_details: !formData.show_listing_details })}
                                    >
                                        {formData.show_listing_details ? "Listing On" : "Listing Off"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={formData.show_share ? "default" : "outline"}
                                        onClick={() => setFormData({ ...formData, show_share: !formData.show_share })}
                                    >
                                        {formData.show_share ? "Share On" : "Share Off"}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Apply By</Label>
                                    <Input 
                                        type="date" 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.apply_by} 
                                        onChange={(e) => setFormData({ ...formData, apply_by: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Valid Through</Label>
                                    <Input 
                                        type="date" 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.valid_through} 
                                        onChange={(e) => setFormData({ ...formData, valid_through: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Openings</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.openings} 
                                        onChange={(e) => setFormData({ ...formData, openings: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Open Method</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.open_method} 
                                        onChange={(e) => setFormData({ ...formData, open_method: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Application Fee</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.application_fee} 
                                        onChange={(e) => setFormData({ ...formData, application_fee: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Apply URL</Label>
                                    <Input 
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.apply_url} 
                                        onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Referral Code</Label>
                                        <Button
                                            size="sm"
                                            variant={formData.show_referral_code ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, show_referral_code: !formData.show_referral_code })}
                                            className="h-7 px-2 text-[10px]"
                                        >
                                            {formData.show_referral_code ? "Visible" : "Hidden"}
                                        </Button>
                                    </div>
                                    <Input 
                                        placeholder="e.g. CREDSWAP100"
                                        className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"
                                        value={formData.referral_code} 
                                        onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#070b14]/50 backdrop-blur-md flex items-center justify-between gap-4">
                        <Button variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => upsertOpportunity.mutate()} disabled={upsertOpportunity.isPending}>
                            {upsertOpportunity.isPending ? "Saving..." : "Save Opportunity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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

: { open: boolean, onOpenChange: (open: boolean) => void, initialData: Event | null, onSuccess: () => void }) {
    const isEdit = !!initialData;
    const { toast } = useToast();
    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: initialData || {
            title: "", date: "", time: "", venue: "", organizer: "Admin", category: "Social", description: "", image_url: "", is_featured: false
        }
    });

    useEffect(() => {
        if (initialData) reset(initialData);
        else reset({ title: "", date: "", time: "", venue: "", organizer: "Admin", category: "Social", description: "", image_url: "", is_featured: false });
    }, [initialData, reset]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (isEdit) {
                const { error } = await supabase.from('events').update(data).eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('events').insert(data);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast({ title: isEdit ? "Event Updated" : "Event Created", description: "Changes saved successfully." });
            onSuccess();
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Event" : "Create New Event"}</DialogTitle>
                    <DialogDescription>Fill in the details for the event.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Event Title</Label>
                        <Input {...register("title", { required: true })} placeholder="e.g. Annual Tech Fest" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Date</Label>
                            <Input {...register("date", { required: true })} placeholder="e.g. 25 Dec 2024" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Time</Label>
                            <Input {...register("time", { required: true })} placeholder="e.g. 10:00 AM" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Venue</Label>
                        <Input {...register("venue", { required: true })} placeholder="e.g. Main Auditorium" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Category</Label>
                        <Input {...register("category")} placeholder="e.g. Workshop, Cultural" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                        <Textarea {...register("description")} placeholder="Details about the event..." />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Image URL</Label>
                        <Input {...register("image_url")} placeholder="https://..." />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Event"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// --- CONTENT MODERATION (Existing Tabs logic) ---
function ContentModeration({ setConfirm }: { setConfirm: any }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Reusing existing queries
    const { data: pendingNotes } = useQuery<Note[]>({
        queryKey: ['admin-notes'], queryFn: async () => {
            const { data } = await supabase.from('notes').select('*').eq('status', 'pending'); return data || [];
        }
    });
    const { data: deletionRequests } = useQuery<Note[]>({
        queryKey: ['admin-deletion-requests'], queryFn: async () => {
            const { data } = await supabase.from('notes').select('*').eq('is_deletion_requested', true); return data || [];
        }
    });
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
    const { data: pendingEvents } = useQuery<Event[]>({
        queryKey: ['admin-events'], queryFn: async () => {
            const { data } = await supabase.from('events').select('*').eq('status', 'pending'); return data || [];
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ table, id, status }: { table: string, id: string, status: string }) => {
            const { error } = await supabase.from(table).update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [`admin-${variables.table}`] });
            queryClient.invalidateQueries({ queryKey: ['admin-notes'] }); // generic catch
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] }); // [NEW]
            queryClient.invalidateQueries({ queryKey: ['admin-events'] }); // [NEW]
            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] }); // Invalidate public marketplace list
            queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalidate public events list
            toast({ title: "Updated", description: `Item marked as ${variables.status}` });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });


    const approveDeletion = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deletion-requests'] });
            toast({ title: "Note Deleted", description: "The note has been permanently removed." });
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });

    const rejectDeletion = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('notes').update({ is_deletion_requested: false }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deletion-requests'] });
            toast({ title: "Request Dismissed", description: "Deletion request cancelled." });
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
    });

    // Keeping it simple with tabs
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
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="events">Events ({pendingEvents?.length || 0})</TabsTrigger>
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="notes">Pending Notes ({pendingNotes?.length || 0})</TabsTrigger>
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300" value="deletions">Deletion Requests ({deletionRequests?.length || 0})</TabsTrigger>
                </TabsList>

                {/* MARKETPLACE */}
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
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-md">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive flex-1 sm:flex-none" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'rejected' })}>Reject</Button>
                                    <Button size="sm" className="flex-1 sm:flex-none" onClick={() => updateStatus.mutate({ table: 'marketplace_items', id: item.id, status: 'approved' })}>Approve</Button>
                                </div>
                            </div>
                        ))}
                        {pendingMarketplaceItems?.length === 0 && <p className="text-muted-foreground italic text-center py-8 bg-card/30 rounded-lg border border-border/20">No pending marketplace items.</p>}
                    </div>
                </TabsContent>

                {/* ROOMS */}
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
                                        <p className="text-sm text-muted-foreground">
                                            ₹{item.price}/mo • {item.type} • {item.location}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <span>User: {item.profiles?.full_name || "Unknown"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive flex-1 sm:flex-none" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'rejected' })}>Reject</Button>
                                    <Button size="sm" className="flex-1 sm:flex-none" onClick={() => updateStatus.mutate({ table: 'rooms', id: item.id, status: 'available' })}>Approve</Button>
                                </div>
                            </div>
                        ))}
                        {pendingRooms?.length === 0 && <p className="text-muted-foreground italic text-center py-8 bg-card/30 rounded-lg border border-border/20">No pending rooms.</p>}
                    </div>
                </TabsContent>

                {/* EVENTS */}
                


                {/* NOTES */}
                

                {/* DELETIONS (Simplified Logic for Delete) */}
                <TabsContent value="deletions" className="space-y-4 mt-4">
                    {deletionRequests?.map((item: Note) => (
                        <div key={item.id} className="bg-card border border-border/50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-destructive flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Deletion Request
                                </h4>
                                <p className="font-medium mt-1">{item.title}</p>
                                <p className="text-sm text-muted-foreground">Reason: {item.deletion_reason || "No reason provided"}</p>
                                <p className="text-xs text-muted-foreground mt-1">From: {item.author}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => rejectDeletion.mutate(item.id)}>Dismiss</Button>
                                <Button size="sm" variant="destructive" onClick={() => setConfirm({
                                    isOpen: true,
                                    title: "Delete Note?",
                                    description: "Are you sure you want to permanently delete this note?",
                                    confirmText: "Delete",
                                    variant: "destructive",
                                    onConfirm: () => approveDeletion.mutate(item.id)
                                })}>Delete Note</Button>
                            </div>
                        </div>
                    ))}
                    {deletionRequests?.length === 0 && <p className="text-muted-foreground italic text-center py-8">No deletion requests.</p>}
                </TabsContent>
            </Tabs>
        </div>
    )
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
                                                {!user.is_verified ? (
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
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key,
                    value: value ? 'true' : 'false',
                    description: `Toggle for ${key.replace('email_enabled_', '')} emails`
                });
            if (error) throw error;
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
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key,
                    value,
                    description: 'Updated via Admin Dashboard'
                });
            if (error) throw error;
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
