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
import { Skeleton } from "@/components/ui/skeleton";
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
    Home,
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
    CreditCard,
    Camera,
    Upload,
    FileCheck,
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
            <div className="flex h-screen items-center justify-center bg-[#030303]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-white border-transparent animate-spin" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-white font-bold tracking-tight">Bit Lura Admin</p>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Verifying Security</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#030303] overflow-hidden font-sans relative text-white">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-white/[0.02] backdrop-blur-2xl border-r border-white/10 h-full flex flex-col transition-all duration-500 z-50 absolute md:relative top-0 left-0 bottom-0 overflow-hidden",
                    sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-24 md:translate-x-0"
                )}
            >
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <div className={cn("flex items-center gap-3 font-display font-bold text-xl text-white transition-opacity overflow-hidden whitespace-nowrap", !sidebarOpen && "md:hidden")}>
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <ShieldCheck className="w-6 h-6 text-black" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-sm font-black tracking-tighter">BIT LURA</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Admin</span>
                        </div>
                    </div>
                    {!sidebarOpen && (
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeSection === "overview"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("overview"); setSearchParams({ tab: "overview" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Newspaper} label="Blog & News" active={activeSection === "blog"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("blog"); setSearchParams({ tab: "blog" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={ShoppingBag} label="Marketplace" active={activeSection === "marketplace"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("marketplace"); setSearchParams({ tab: "marketplace" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={FileText} label="Moderation" active={activeSection === "moderation"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("moderation"); setSearchParams({ tab: "moderation" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Users} label="Users" active={activeSection === "users"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("users"); setSearchParams({ tab: "users" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />

                    <div className="pt-4 pb-2">
                        <div className={cn("px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2", !sidebarOpen && "hidden")}>Settings</div>
                        <div className={cn("h-[1px] bg-white/5 mx-4 mb-2", sidebarOpen && "hidden")} />
                    </div>

                    <SidebarItem icon={Mail} label="Emails" active={activeSection === "emails"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("emails"); setSearchParams({ tab: "emails" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                    <SidebarItem icon={Settings} label="Platform" active={activeSection === "settings"} collapsed={!sidebarOpen} onClick={() => { setActiveSection("settings"); setSearchParams({ tab: "settings" }); if (window.innerWidth < 768) setSidebarOpen(false); }} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Button
                        variant="ghost"
                        className={cn("w-full h-12 rounded-2xl justify-start text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group", !sidebarOpen && "justify-center")}
                        onClick={() => {
                            localStorage.removeItem("admin_auth");
                            localStorage.removeItem("admin_creds");
                            navigate("/");
                        }}
                    >
                        <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1" />
                        {sidebarOpen && <span className="font-bold tracking-tight">Exit Admin</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative w-full">
                {/* Header */}
                <header className="h-20 bg-white/[0.02] backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 md:px-8 shrink-0 z-40">
                    <div className="flex items-center gap-6 absolute md:static left-0 right-0 px-6 md:px-0 pointer-events-none md:pointer-events-auto">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden pointer-events-auto rounded-xl bg-white/5 border border-white/5">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-col pointer-events-auto">
                            <h2 className="text-xl font-bold font-display tracking-tight capitalize">{activeSection.replace('-', ' ')}</h2>
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest hidden md:block">System Management Console</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto pointer-events-auto z-50">
                        <div className="relative hidden lg:block w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <Input placeholder="Search system resources..." className="h-11 pl-11 bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-white/20 rounded-2xl transition-all placeholder:text-zinc-600 text-sm" />
                        </div>
                        <div className="hidden sm:block">
                            <NotificationDropdown adminMode={true} />
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xs shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-4 ring-white/5 shrink-0">
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
                <AlertDialogContent className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-2xl max-w-md">
                    <AlertDialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                            <ShieldAlert className={cn("w-8 h-8", confirmDialog.variant === 'destructive' ? "text-rose-500" : "text-white")} />
                        </div>
                        <AlertDialogTitle className="text-3xl font-display font-bold tracking-tight text-white">{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 font-medium leading-relaxed">
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3">
                        <AlertDialogCancel className="h-12 px-8 rounded-2xl bg-white/5 border-white/5 text-zinc-500 font-bold hover:text-white transition-all">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            }}
                            className={cn(
                                "h-12 px-10 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-2xl",
                                confirmDialog.variant === 'destructive' 
                                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/20" 
                                    : "bg-white text-black hover:bg-zinc-200"
                            )}
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
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] transition-all duration-500 relative group overflow-hidden",
                active
                    ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.15)] translate-x-1"
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.04]",
                collapsed && "justify-center px-0 h-14 translate-x-0"
            )}
        >
            <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                active ? "bg-black/5" : "bg-white/5 group-hover:bg-white/10 border border-white/5 group-hover:border-white/10"
            )}>
                <Icon className={cn("w-5 h-5 transition-transform duration-500", active ? "scale-110" : "group-hover:scale-110")} />
            </div>
            {!collapsed && <span className="font-bold tracking-tight text-sm">{label}</span>}
            
            {active && !collapsed && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black/20" />
            )}

            {collapsed && (
                <div className="absolute left-full ml-4 px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-x-[-20px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[60] shadow-2xl border border-white/10 whitespace-nowrap">
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
        <div className="space-y-10 animate-fade-in pb-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={stats?.users || 0} icon={Users} />
                <StatCard title="Marketplace Items" value={stats?.marketplace || 0} icon={ShoppingBag} />
                <StatCard 
                    title="Pending Approvals" 
                    value={stats?.pending || 0} 
                    icon={ShieldAlert} 
                    highlight={!!stats?.pending && stats.pending > 0}
                />
            </div>

            {/* Quick Actions & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold tracking-tight">Quick Operations</h3>
                        <div className="h-[1px] flex-1 bg-white/5 mx-6 hidden md:block" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => setActiveSection('marketplace')}
                            className="group p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all flex items-center gap-4 text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold tracking-tight">Manage Marketplace</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Audit Listings</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => setActiveSection('blog')}
                            className="group p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all flex items-center gap-4 text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                <Newspaper className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold tracking-tight">Manage Blog</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Publish News</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 relative overflow-hidden h-full flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] blur-[60px] rounded-full -mr-16 -mt-16" />
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </div>
                                <h4 className="font-black text-[10px] tracking-[0.3em] uppercase text-zinc-400">System Health</h4>
                            </div>
                            <p className="text-2xl font-bold tracking-tight mb-2">Operational</p>
                            <p className="text-sm text-zinc-500 leading-relaxed">Database, storage, and edge functions are currently stable and performing within normal parameters.</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                <span>Latency</span>
                                <span className="text-white">24ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white/[0.02] border-white/10 rounded-[32px] overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Recent Users</CardTitle>
                                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">Community Growth</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setActiveSection('users')} className="rounded-xl border border-white/5 hover:bg-white hover:text-black">
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {recentUsers?.map((user: any) => (
                                <div key={user.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.03] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold overflow-hidden group-hover:scale-105 transition-transform">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.full_name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight group-hover:text-white transition-colors">{user.full_name}</p>
                                            <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[150px]">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                        user.is_verified 
                                            ? "bg-white text-black border-white" 
                                            : "bg-white/5 text-zinc-500 border-white/5"
                                    )}>
                                        {user.is_verified ? "Verified" : "Regular"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/10 rounded-[32px] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">KPI Summary</CardTitle>
                                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">Performance Metrics</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-center">
                        <div className="space-y-4">
                            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">Marketplace Velocity</span>
                                    </div>
                                    <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">Healthy</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                                    <div className="w-[85%] h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                </div>
                            </div>
                            
                            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">Engagement Rate</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white tracking-widest uppercase">72%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                                    <div className="w-[72%] h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, highlight }: { title: string, value: string | number, icon: any, highlight?: boolean }) {
    return (
        <div className="relative group p-8 rounded-[32px] bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.03] blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-white/[0.05] transition-all" />
            <div className="relative z-10 flex flex-col gap-4">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl border",
                    highlight 
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/5 text-zinc-400 border-white/5"
                )}>
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-4xl font-display font-bold tracking-tighter text-white mb-1">{value}</h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{title}</p>
                </div>
            </div>
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
        <div className="space-y-10 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">Blog & News</h2>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium mt-1">Institutional communication console</p>
                </div>
                <Button 
                    onClick={() => { setEditing(null); resetForm(); setDialogOpen(true); }}
                    className="h-12 px-8 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5 mr-2" /> New Publication
                </Button>
            </div>

            <Card className="bg-white/[0.02] border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Content Repository</CardTitle>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">All internal and external posts</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Publication</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Type</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Status</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Date</th>
                                    <th className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Synchronizing Data</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && posts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center text-zinc-500 font-medium">No publications found.</td>
                                    </tr>
                                )}
                                {!isLoading && posts.map((post) => (
                                    <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold tracking-tight text-white mb-0.5 group-hover:text-white transition-colors">{post.title}</div>
                                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest opacity-60">/{post.slug}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="inline-flex px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                {post.type || "blog"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                post.status === "published" 
                                                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                                                    : "bg-white/5 text-zinc-500 border border-white/5"
                                            )}>
                                                {post.status || "draft"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-500 text-[11px] font-medium uppercase tracking-tight">
                                            {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditing(post);
                                                        resetForm(post);
                                                        setDialogOpen(true);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all group/btn"
                                                >
                                                    <Edit2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const nextStatus = post.status === "published" ? "draft" : "published";
                                                        const payload = buildPayloadFromPost(post, { status: nextStatus });
                                                        quickUpdate.mutate(payload, {
                                                            onSuccess: () => toast({ title: nextStatus === "published" ? "Post Published" : "Post Unpublished" })
                                                        } as any);
                                                    }}
                                                    className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all"
                                                >
                                                    {post.status === "published" ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => setConfirm({
                                                        isOpen: true,
                                                        title: "Delete Publication?",
                                                        description: `This will permanently remove "${post.title}". This action cannot be reversed.`,
                                                        confirmText: "Delete Permanently",
                                                        variant: "destructive",
                                                        onConfirm: () => deletePost.mutate(post.id)
                                                    })}
                                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl p-8 no-scrollbar">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-bold tracking-tight text-white">Publication Editor</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest mt-1">Institutional Content Management System</DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-between bg-white/[0.03] p-5 rounded-3xl border border-white/5 mb-8 group">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="auto-suggest"
                                checked={autoSuggest}
                                onCheckedChange={(checked) => setAutoSuggest(!!checked)}
                                className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                            />
                            <Label htmlFor="auto-suggest" className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors cursor-pointer">AI-Assisted Drafting</Label>
                        </div>
                        <Button
                            size="sm"
                            className="h-10 px-6 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white hover:text-black transition-all font-black text-[10px] uppercase tracking-widest"
                            disabled={!formData.title || suggestingField === "auto"}
                            onClick={autoFillSuggestions}
                        >
                            {suggestingField === "auto" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Auto-Generate Metadata
                        </Button>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="flex items-center justify-start gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-8 h-auto overflow-x-auto no-scrollbar">
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="general">General</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="content">Content</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="media">Media</TabsTrigger>
                            <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="seo">SEO</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6 mt-0">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Publication Title</Label>
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
                                        placeholder="Enter title..."
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">URL Slug</Label>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) => {
                                            slugTouchedRef.current = true;
                                            setFormData((prev) => ({ ...prev, slug: e.target.value }));
                                        }}
                                        placeholder="auto-generated-slug"
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Content Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                            <SelectItem value="blog">Blog Publication</SelectItem>
                                            <SelectItem value="news">Press Release / News</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Category Tag</Label>
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                                        placeholder="e.g. Technology"
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Visibility Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                            <SelectItem value="draft">Draft Mode</SelectItem>
                                            <SelectItem value="published">Live Public</SelectItem>
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

                    <DialogFooter className="mt-10 pt-8 border-t border-white/5">
                        <Button
                            variant="ghost"
                            className="h-12 px-8 rounded-2xl text-zinc-500 font-bold hover:text-white transition-all"
                            onClick={() => {
                                setDialogOpen(false);
                                setEditing(null);
                            }}
                        >
                            Discard
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
                            className="h-12 px-10 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                            disabled={savePost.isPending}
                        >
                            {savePost.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {editing ? "Save Changes" : "Commit Publication"}
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

    const toggleFeatured = useMutation({
        mutationFn: async ({ id, isFeatured }: { id: string, isFeatured: boolean }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);

            const { error } = await supabase.rpc('admin_toggle_marketplace_featured', {
                p_item_id: id,
                p_is_featured: isFeatured,
                p_username: creds.username,
                p_password: creds.password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-all'] });
            toast({ title: "Featured Status Updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });


    return (
        <div className="space-y-10 animate-fade-in pb-12">
            <div>
                <h2 className="text-3xl font-display font-bold tracking-tight">Marketplace Manager</h2>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium mt-1">Product listing audit & control</p>
            </div>

            <Card className="bg-white/[0.02] border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Listing Database</CardTitle>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Comprehensive marketplace overview</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm min-w-[900px]">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Product</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Merchant</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Price</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Category</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Status</th>
                                    <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Date</th>
                                    <th className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-8 py-5">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="w-14 h-14 rounded-2xl bg-white/5" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-48 bg-white/5" />
                                                        <Skeleton className="h-3 w-32 bg-white/5" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8"><Skeleton className="h-4 w-32 bg-white/5" /></td>
                                            <td className="p-8"><Skeleton className="h-5 w-16 bg-white/5" /></td>
                                            <td className="p-8"><Skeleton className="h-4 w-20 bg-white/5" /></td>
                                            <td className="p-8"><Skeleton className="h-6 w-24 rounded-full bg-white/5" /></td>
                                            <td className="p-8"><Skeleton className="h-4 w-24 bg-white/5" /></td>
                                            <td className="p-8"><div className="flex justify-end gap-2"><Skeleton className="w-10 h-10 rounded-xl bg-white/5" /><Skeleton className="w-10 h-10 rounded-xl bg-white/5" /></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    items?.map((item: MarketplaceItem) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-6 h-6 text-zinc-600" />
                                                    )}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="font-bold tracking-tight text-white truncate" title={item.title}>{item.title}</p>
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium mt-0.5">ID: {item.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-zinc-300">{item.profiles?.full_name || "Unknown"}</p>
                                            <p className="text-[10px] text-zinc-600 truncate max-w-[120px]">{item.profiles?.email}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-lg font-bold text-white tracking-tighter">₹{item.price}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                                item.status === 'approved' ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" :
                                                item.status === 'sold' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                                item.status === 'pending' ? "bg-white/5 text-zinc-400 border border-white/5" :
                                                "bg-red-500/10 text-red-400 border border-red-500/20"
                                            )}>
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-500 text-[11px] font-medium uppercase tracking-tight">
                                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                {item.status === 'pending' && (
                                                    <button 
                                                        onClick={() => updateStatus.mutate({ id: item.id, status: 'approved' })}
                                                        className="h-10 px-6 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-[0.98]"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {item.status !== 'rejected' && item.status !== 'sold' && (
                                                    <button 
                                                        onClick={() => updateStatus.mutate({ id: item.id, status: 'rejected' })}
                                                        className="h-10 px-6 rounded-xl bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => toggleFeatured.mutate({ id: item.id, isFeatured: !item.is_featured })}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                                                        item.is_featured 
                                                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                                                            : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                                                    )}
                                                    title={item.is_featured ? "Remove from Featured" : "Add to Featured"}
                                                >
                                                    <Star className={cn("w-4 h-4", item.is_featured && "fill-current")} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirm({
                                                        isOpen: true,
                                                        title: "Permanently Delete?",
                                                        description: "This listing will be scrubbed from the platform. This action is final.",
                                                        confirmText: "Delete Listing",
                                                        variant: "destructive",
                                                        onConfirm: () => deleteItem.mutate(item.id)
                                                    })}
                                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {items?.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-16 text-center text-zinc-500 font-medium italic">
                                        Marketplace is currently empty.
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

    const getCreds = () => JSON.parse(localStorage.getItem("admin_creds") || "{}");

    const { data: pendingMarketplaceItems } = useQuery<MarketplaceItem[]>({
        queryKey: ['admin-marketplace'], queryFn: async () => {
            const { data } = await supabase.from('marketplace_items').select('*, profiles!seller_id(full_name, email)').eq('status', 'pending'); return data || [];
        }
    });

    // Rooms: use credential-based RPC to bypass RLS (admin uses custom auth, not Supabase session)
    const { data: pendingRooms } = useQuery<Room[]>({
        queryKey: ['admin-rooms'], queryFn: async () => {
            const creds = getCreds();
            const { data, error } = await supabase.rpc('admin_get_pending_rooms', {
                p_username: creds.username,
                p_password: creds.password,
            });
            if (error) throw error;
            return (data as any[]) || [];
        }
    });

    const updateMarketplaceStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('marketplace_items').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
            toast({ title: "Resolution Recorded", description: `Item successfully marked as ${variables.status}` });
        },
        onError: (error) => {
            toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
        }
    });

    const updateRoomStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const creds = getCreds();
            const { error } = await supabase.rpc('admin_update_room_status', {
                p_username: creds.username,
                p_password: creds.password,
                p_room_id: id,
                p_status: status,
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast({ title: "Room Updated", description: `Room successfully marked as ${variables.status}` });
        },
        onError: (error) => {
            toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
        }
    });

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            <div>
                <h2 className="text-3xl font-display font-bold tracking-tight text-white">Content Moderation</h2>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black mt-1">Pending verification queue</p>
            </div>

            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="flex items-center justify-start gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-8 h-auto overflow-x-auto no-scrollbar">
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="marketplace">
                        Marketplace <span className="ml-2 text-[10px] opacity-60">[{pendingMarketplaceItems?.length || 0}]</span>
                    </TabsTrigger>
                    <TabsTrigger className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2.5 font-bold text-xs transition-all duration-300 text-zinc-500" value="rooms">
                        Rooms <span className="ml-2 text-[10px] opacity-60">[{pendingRooms?.length || 0}]</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 gap-4">
                        {pendingMarketplaceItems?.map((item: MarketplaceItem) => (
                            <div key={item.id} className="group bg-white/[0.02] border border-white/10 p-6 rounded-[32px] flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center hover:bg-white/[0.04] transition-all duration-500">
                                <div className="flex gap-5">
                                    <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ShoppingBag className="w-8 h-8 text-zinc-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl tracking-tight text-white">{item.title}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-lg font-black text-white/90">₹{item.price}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{item.category}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-600 font-medium mt-2">Requested {new Date(item.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => updateMarketplaceStatus.mutate({ id: item.id, status: 'rejected' })}
                                        className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => updateMarketplaceStatus.mutate({ id: item.id, status: 'approved' })}
                                        className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pendingMarketplaceItems?.length === 0 && (
                            <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[32px]">
                                <p className="text-zinc-500 font-medium text-sm italic tracking-tight">The marketplace queue is clear.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="rooms" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRooms?.map((item: Room) => (
                            <div key={item.id} className="group bg-white/[0.02] border border-white/10 p-6 rounded-[32px] flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center hover:bg-white/[0.04] transition-all duration-500">
                                <div className="flex gap-5">
                                    <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                        {item.images?.[0] ? (
                                            <img src={item.images[0]} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Home className="w-8 h-8 text-zinc-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl tracking-tight text-white">{item.title}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-lg font-black text-white/90">₹{item.price}<span className="text-xs font-medium text-zinc-500 ml-1">/mo</span></span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{item.type}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-600 font-medium mt-2">Requested {new Date(item.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => updateRoomStatus.mutate({ id: item.id, status: 'rejected' })}
                                        className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => updateRoomStatus.mutate({ id: item.id, status: 'available' })}
                                        className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pendingRooms?.length === 0 && (
                            <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[32px]">
                                <p className="text-zinc-500 font-medium text-sm italic tracking-tight">The rooms queue is clear.</p>
                            </div>
                        )}
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

    const handleManualVerify = async (userId: string, verifyStatus: boolean) => {
        try {
            const credsStr = localStorage.getItem("admin_creds");
            const creds = credsStr ? JSON.parse(credsStr) : {};
            const { error } = await supabase.rpc('admin_verify_user_v2', {
                p_username: creds.username || '',
                p_password: creds.password || '',
                target_user_id: userId,
                new_status: verifyStatus ? 'verified' : 'unverified',
                feedback: null
            });
            if (error) throw error;
            toast({ title: "Status Updated", description: `User has been ${verifyStatus ? 'verified' : 'unverified'}.` });
            queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
        } catch (error: any) {
            toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
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

    const [selectedReviewUser, setSelectedReviewUser] = useState<any>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [rejectionMessage, setRejectionMessage] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    const handleReviewSubmit = async (status: 'verified' | 'rejected') => {
        if (!selectedReviewUser) return;
        if (status === 'rejected' && !rejectionMessage.trim()) {
            toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
            return;
        }

        try {
            setIsReviewing(true);
            const credsStr = localStorage.getItem("admin_creds");
            const creds = credsStr ? JSON.parse(credsStr) : {};
            
            const { error } = await supabase.rpc('admin_verify_user_v2', {
                p_username: creds.username || '',
                p_password: creds.password || '',
                target_user_id: selectedReviewUser.id,
                new_status: status,
                feedback: status === 'rejected' ? rejectionMessage : null
            });

            if (error) throw error;

            toast({ 
                title: status === 'verified' ? "User Verified" : "User Rejected", 
                description: status === 'verified' ? "The student is now verified." : "Rejection notice sent." 
            });
            
            queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
            setReviewDialogOpen(false);
            setRejectionMessage("");
            setSelectedReviewUser(null);
        } catch (error: any) {
            toast({ title: "Review Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsReviewing(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-display font-bold tracking-tight text-white">User Directory</h2>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black mt-1">Personnel & Access Control Console</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <Input
                            placeholder="Filter by name, email or college..."
                            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all font-medium text-white placeholder:text-zinc-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={downloadCSV}
                        className="w-full md:w-auto h-12 px-6 rounded-2xl bg-white/5 border border-white/5 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Personnel", value: stats.total, icon: Users },
                    { label: "Verified Access", value: stats.verified, icon: ShieldCheck },
                    { label: "New Enlistments", value: stats.growth, icon: TrendingUp }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/10 p-8 rounded-[32px] flex items-center justify-between group hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] -mr-12 -mt-12" />
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                            <p className="text-4xl font-display font-bold text-white tracking-tighter">{item.value}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                            <item.icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-white/[0.03] rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-none mb-1.5">Precision Filter</p>
                            <p className="text-xs font-medium text-zinc-500">Segment directory by academic criteria</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <button 
                            onClick={() => setSelectedUserIds(new Set(filteredUsers?.filter(u => !u.is_verified).map(u => u.id)))}
                            className="h-10 px-5 rounded-xl bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all text-[10px] font-black uppercase tracking-widest text-zinc-400"
                        >
                            Select Unverified
                        </button>
                        <button 
                            onClick={() => setSelectedUserIds(new Set(filteredUsers?.filter(u => u.is_verified).map(u => u.id)))}
                            className="h-10 px-5 rounded-xl bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all text-[10px] font-black uppercase tracking-widest text-zinc-400"
                        >
                            Select Verified
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
                        <select 
                            value={semesterFilter}
                            onChange={(e) => setSemesterFilter(e.target.value)}
                            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-white/20 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                            <option value="all" className="bg-[#0a0a0a]">All Semesters</option>
                            {["1", "2", "3", "4", "5", "6", "7", "8"].map(s => (
                                <option key={s} value={s} className="bg-[#0a0a0a]">Semester {s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Card className="bg-white/[0.02] border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
                    {/* Bulk Action Bar - Premium High Fidelity */}
                    {selectedUserIds.size > 0 && (
                        <div className="absolute top-0 inset-x-0 h-20 bg-white z-20 flex items-center justify-between px-10 animate-in slide-in-from-top-full duration-500">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black">
                                        {selectedUserIds.size}
                                    </div>
                                    <span className="text-black font-black uppercase tracking-[0.2em] text-[10px]">Accounts Selected</span>
                                </div>
                                <div className="h-8 w-px bg-black/10" />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleBulkResend}
                                        disabled={isBulkResending}
                                        className="h-10 px-6 rounded-xl bg-black/5 hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2"
                                    >
                                        {isBulkResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                        Resend Verif.
                                    </button>
                                    <button 
                                        onClick={() => handleBulkModeration('block')}
                                        disabled={isBulkResending}
                                        className="h-10 px-6 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2"
                                    >
                                        <ShieldAlert className="w-3 h-3" />
                                        Block
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUserIds(new Set())}
                                className="text-black/40 hover:text-black font-black uppercase tracking-widest text-[10px] transition-colors"
                            >
                                Dismiss Selection
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="px-8 py-5 w-10">
                                        <Checkbox 
                                            checked={filteredUsers?.length > 0 && selectedUserIds.size === filteredUsers?.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-white/10 data-[state=checked]:bg-white data-[state=checked]:text-black"
                                        />
                                    </th>
                                    <th className="px-8 py-5 text-left">
                                        <button onClick={() => handleSort('full_name')} className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500 hover:text-white transition-colors">
                                            Personnel {sortConfig?.key === 'full_name' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </button>
                                    </th>
                                    <th className="px-8 py-5 text-left font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500">Academic Deployment</th>
                                    <th className="px-8 py-5 text-left">
                                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500 hover:text-white transition-colors">
                                            Authentication {sortConfig?.key === 'created_at' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </button>
                                    </th>
                                    <th className="px-8 py-5 text-right font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><Skeleton className="w-4 h-4 bg-white/5" /></td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <Skeleton className="w-14 h-14 rounded-[22px] bg-white/5" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-40 bg-white/5" />
                                                        <Skeleton className="h-3 w-24 bg-white/5" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 bg-white/5" />
                                                    <Skeleton className="h-3 w-20 bg-white/5" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-full bg-white/5" /></td>
                                            <td className="px-8 py-6"><div className="flex justify-end gap-2"><Skeleton className="w-20 h-10 rounded-xl bg-white/5" /><Skeleton className="w-10 h-10 rounded-xl bg-white/5" /></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredUsers?.map((user) => (
                                        <tr 
                                            key={user.id} 
                                            className={cn(
                                                "group hover:bg-white/[0.02] transition-all duration-300",
                                                selectedUserIds.has(user.id) && "bg-white/[0.04]"
                                            )}
                                        >
                                            <td className="px-8 py-6">
                                                <Checkbox 
                                                    checked={selectedUserIds.has(user.id)}
                                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                                    className="border-white/10 data-[state=checked]:bg-white data-[state=checked]:text-black"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative group/avatar">
                                                        <div className="w-14 h-14 rounded-[22px] bg-white/5 overflow-hidden flex items-center justify-center border border-white/10 group-hover/avatar:scale-110 transition-transform duration-500">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xl font-bold text-zinc-700">{user.full_name?.[0] || 'U'}</span>
                                                            )}
                                                        </div>
                                                        {user.verification_status === 'verified' && (
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-[#0a0a0a]">
                                                                <CheckCircle className="w-3.5 h-3.5 text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg text-white tracking-tight leading-none mb-1">{user.full_name || "New Member"}</p>
                                                        <p className="text-[11px] font-medium text-zinc-500 tracking-tight">{user.email}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mt-2">
                                                            Reg. {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-zinc-300 max-w-[200px] truncate">{user.college || "Unassigned"}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{user.branch || "General"}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Sem {user.semester || "—"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                                                user.verification_status === 'verified' 
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                    : user.verification_status === 'pending'
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                                    : user.verification_status === 'rejected'
                                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    : "bg-white/5 text-zinc-500 border-white/5"
                                            )}>
                                                {user.verification_status || "Unverified"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.verification_status === 'pending' ? (
                                                     <button
                                                        className="h-10 px-5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all font-black uppercase tracking-widest text-[9px] flex items-center gap-2"
                                                        onClick={() => {
                                                            setSelectedReviewUser(user);
                                                            setReviewDialogOpen(true);
                                                        }}
                                                    >
                                                        <FileCheck className="w-3.5 h-3.5" />
                                                        Review
                                                    </button>
                                                ) : user.verification_status !== 'verified' ? (
                                                     <button
                                                        className="h-10 px-5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest text-[9px] text-blue-500 flex items-center gap-2"
                                                        onClick={() => handleManualVerify(user.id, true)}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Verify
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="h-10 px-5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all font-black uppercase tracking-widest text-[9px] text-rose-500 flex items-center gap-2"
                                                        onClick={() => handleManualVerify(user.id, false)}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Unverify
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => navigate(`/profile/${user.id}`)}
                                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}

                {/* Review Dialog */}
                <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogContent className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-8 shadow-2xl max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Review Student Application</DialogTitle>
                            <DialogDescription className="text-zinc-500 pt-1">
                                Inspect the document provided by {selectedReviewUser?.full_name} for student verification.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 space-y-6">
                            <div className="aspect-[16/9] w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden relative group">
                                {selectedReviewUser?.verification_document_url ? (
                                    <img 
                                        src={selectedReviewUser.verification_document_url} 
                                        alt="Student ID" 
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-zinc-600 font-bold uppercase tracking-widest text-xs">
                                        No Document Uploaded
                                    </div>
                                )}
                                <a 
                                    href={selectedReviewUser?.verification_document_url} 
                                    target="_blank" 
                                    className="absolute bottom-4 right-4 h-10 px-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[9px] flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Download className="w-3 h-3" /> Full View
                                </a>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Rejection Feedback (Required if rejecting)</Label>
                                <Textarea 
                                    placeholder="Tell the student why their document was rejected (e.g. 'Document is too old', 'Image is blurred')..."
                                    className="bg-white/5 border-white/10 rounded-2xl h-24 focus:border-white/20 transition-all text-white"
                                    value={rejectionMessage}
                                    onChange={(e) => setRejectionMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button 
                                variant="outline" 
                                className="h-14 flex-1 rounded-2xl bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                                onClick={() => handleReviewSubmit('rejected')}
                                disabled={isReviewing}
                            >
                                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                Reject Application
                            </Button>
                            <Button 
                                className="h-14 flex-1 rounded-2xl bg-white text-black hover:bg-zinc-200"
                                onClick={() => handleReviewSubmit('verified')}
                                disabled={isReviewing}
                            >
                                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Approve & Verify
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                            {filteredUsers?.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-white/5">
                                                <Search className="w-8 h-8 text-zinc-700" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Search Parameters Nullified</h3>
                                            <p className="text-zinc-500 text-sm mt-1">Adjust filters to broaden directory search results.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
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
            toast({ title: "Relay Updated", description: "System communication node has been synchronized." });
        },
        onError: (err: any) => toast({ title: "Sync Error", description: err.message, variant: "destructive" })
    });

    const emailFeatures = [
        { key: 'email_enabled_welcome', label: 'Onboarding Protocol', description: 'Welcome sequences for new personnel.', icon: Sparkles },
        { key: 'email_enabled_reset_password', label: 'Identity Recovery', description: 'Authentication relays for credentials.', icon: ShieldAlert },
        { key: 'email_enabled_password_changed', label: 'Security Breaches', description: 'Critical alerts on profile mutations.', icon: ShieldCheck },
        { key: 'email_enabled_ticket', label: 'Access Tokens', description: 'Digital passes and QR identification.', icon: QrCode },
        { key: 'email_enabled_order_alert', label: 'Transaction Audit', description: 'Escrow and fulfillment confirmations.', icon: ShoppingBag },
        { key: 'email_enabled_dispute_alert', label: 'Conflict Resolution', description: 'Admin alerts for marketplace disputes.', icon: ShieldAlert },
        { key: 'email_enabled_verification_notice', label: 'Credential Audit', description: 'Reminders for unverified accounts.', icon: Mail },
    ];

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Retrieving Relay Map</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-white">Email Preferences</h2>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black mt-1">Automated Communications Console</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <Mail className="w-5 h-5 text-white" />
                    <span className="font-bold text-xs text-white tracking-tight">Active Relay Nodes</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {emailFeatures.map((feature) => {
                    const isEnabled = settings?.[feature.key] ?? true;
                    return (
                        <div key={feature.key} className={cn(
                            "group bg-white/[0.02] border border-white/10 p-8 rounded-[40px] flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden",
                            !isEnabled && "opacity-60 grayscale-[0.5]"
                        )}>
                            <div className={cn(
                                "absolute top-0 right-0 w-48 h-48 blur-[100px] -mr-24 -mt-24 transition-colors duration-700 opacity-20",
                                isEnabled ? "bg-white" : "bg-zinc-900"
                            )} />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex items-start gap-6">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 border",
                                            isEnabled 
                                                ? "bg-white border-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                                                : "bg-white/5 border-white/5 text-zinc-600"
                                        )}>
                                            <feature.icon className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="font-bold text-xl tracking-tight text-white">{feature.label}</h3>
                                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-[220px] uppercase tracking-wider">{feature.description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleMutation.mutate({ key: feature.key, value: !isEnabled })}
                                        disabled={toggleMutation.isPending}
                                        className={cn(
                                            "relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-500 outline-none p-1",
                                            isEnabled ? "bg-white" : "bg-white/10"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none block h-7 w-7 rounded-full shadow-2xl ring-0 transition-transform duration-500",
                                                isEnabled ? "translate-x-7 bg-black" : "translate-x-0 bg-zinc-600"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
                                    <div className={cn(
                                        "inline-flex px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                        isEnabled ? "bg-white text-black" : "bg-white/5 text-zinc-600 border border-white/5"
                                    )}>
                                        {isEnabled ? "Relay Operational" : "Relay Inhibited"}
                                    </div>
                                    
                                    {toggleMutation.isPending && (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-white text-black rounded-[40px] p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/10 blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-20 h-20 rounded-[24px] bg-black text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-display font-bold tracking-tight text-black">System Reliability Protocol</h3>
                        <p className="text-black/60 font-medium max-w-2xl leading-relaxed text-sm">
                            Outgoing communication triggers are synchronized across the global edge network. Inhibiting a relay node will immediately halt all downstream processing for that protocol, ensuring zero leakage during maintenance or operational shifts.
                        </p>
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
            const { data } = await supabase.from('system_settings').select('*');
            const settingsMap: Record<string, string> = {};
            data?.forEach((s: any) => { settingsMap[s.key] = s.value; });
            return settingsMap;
        }
    });

    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            const credsStr = localStorage.getItem("admin_creds");
            if (!credsStr) throw new Error("Admin credentials not found");
            const creds = JSON.parse(credsStr);
            const { data, error } = await supabase.rpc('admin_update_system_setting', {
                p_key: key, p_value: value, p_username: creds.username, p_password: creds.password
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast({ title: "Parameter Updated", description: "System configuration synchronized successfully." });
        },
        onError: (err) => toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            if (!file) return;
            setUploading(true);
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `admin-qr-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            updateSetting.mutate({ key: 'admin_qr_url', value: publicUrl });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const isPopupEnabled = settings?.['show_signin_popup'] === 'true';
    const upiId = settings?.['admin_upi_id'] || '';
    const qrUrl = settings?.['admin_qr_url'] || '';

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Retrieving Environment Config</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div>
                <h2 className="text-3xl font-display font-bold tracking-tight text-white">Platform Parameters</h2>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black mt-1">Core Environment Configuration</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* UX Settings */}
                <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white tracking-tight">Onboarding Dispatch</h3>
                            <p className="text-sm text-zinc-500 font-medium">Prompt unauthenticated users to join the network.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSetting.mutate({ key: 'show_signin_popup', value: String(!isPopupEnabled) })}
                        disabled={updateSetting.isPending}
                        className={cn(
                            "h-12 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3",
                            isPopupEnabled ? "bg-white text-black" : "bg-white/5 text-zinc-400 border border-white/5"
                        )}
                    >
                        {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isPopupEnabled ? 'Inhibitor Active' : 'Engage Protocol'}
                    </button>
                </div>

                {/* Financial Relay (UPI) */}
                <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[40px] space-y-10 hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-lg tracking-tight text-white uppercase text-[12px] tracking-[0.2em]">Financial Relay Node</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Unified Payment Interface ID</Label>
                            <Input 
                                defaultValue={upiId}
                                placeholder="vpa@bank"
                                onBlur={(e) => updateSetting.mutate({ key: 'admin_upi_id', value: e.target.value })}
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all font-bold text-white text-lg px-6"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Digital Identification (QR)</Label>
                            <div className="h-48 bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-center overflow-hidden group relative">
                                {qrUrl ? (
                                    <img src={qrUrl} className="max-h-40 object-contain group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="text-center">
                                        <Camera className="w-10 h-10 text-zinc-800 mx-auto mb-2" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">No Asset Sync</p>
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-md">
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-white" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload Sync</span>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
