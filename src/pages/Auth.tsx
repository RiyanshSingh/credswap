import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/Navbar";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Send, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { SEO } from "@/components/SEO";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [showSignupSuccess, setShowSignupSuccess] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
                redirectTo: window.location.origin + '/settings?tab=account',
            });
            if (error) throw error;
            toast({
                title: "Protocol Initiated",
                description: "Identity recovery link has been dispatched to your relay address.",
            });
            setShowResetDialog(false);
            setResetEmail("");
        } catch (error: any) {
            toast({
                title: "Relay Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setResetLoading(false);
        }
    };

    useEffect(() => {
        const handleRedirectMessages = () => {
            const hash = window.location.hash;
            const search = window.location.search;

            if (hash.includes('type=signup') || search.includes('type=signup')) {
                toast({
                    title: "Node Verified",
                    description: "Your digital identity has been synchronized successfully.",
                });
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (hash.includes('type=recovery') || search.includes('type=recovery')) {
                toast({
                    title: "Access Restored",
                    description: "Recovery link verified. Update credentials in your profile console.",
                });
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        handleRedirectMessages();
    }, [toast]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const hash = window.location.hash;
                if (!hash.includes('type=signup')) {
                    navigate("/dashboard", { replace: true });
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const hash = window.location.hash;
                if (!hash.includes('type=signup')) {
                    navigate("/dashboard", { replace: true });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate("/dashboard");
        } catch (error: any) {
            toast({ title: "Auth Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const reservedNames = ["admin", "credswap"];
        const adminEmails = ["itsyourriyansh@gmail.com", "credswap@gmail.com"];
        if (reservedNames.some(name => fullName.trim().toLowerCase() === name) && !adminEmails.includes(email.trim().toLowerCase())) {
            toast({ title: "Inhibited Name", description: "Identity label reserved for system authority.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: fullName } },
            });
            if (error) throw error;
            if (data?.user && data.user.identities?.length === 0) {
                toast({ title: "Identity Conflict", description: "This relay is already synchronized with another node.", variant: "destructive" });
                return;
            }
            setShowSignupSuccess(true);
        } catch (error: any) {
            toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin + '/dashboard' }
            });
            if (error) throw error;
        } catch (error: any) {
            toast({ title: "Relay Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col overflow-hidden relative selection:bg-white selection:text-black">
            <Navbar />
            <SEO title="Authentication Console - Bit Lura" description="Secure gateway for the CredSwap ecosystem." />

            {/* Premium Monochrome Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-white/[0.03] blur-[150px] rounded-full animate-aurora" />
                <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-white/[0.02] blur-[130px] rounded-full animate-float" />
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10 pt-28">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[440px]"
                >
                    <div className="bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl shadow-[0_32px_120px_rgba(0,0,0,0.8)] rounded-[48px] overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col items-center text-center mb-6">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)] mb-6 group"
                                >
                                    <GraduationCap className="w-7 h-7 text-black group-hover:scale-110 transition-transform duration-500" />
                                </motion.div>
                                <h1 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
                                    Welcome to CredSwap
                                </h1>
                                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-2">
                                    Sign in or create an account
                                </p>
                            </div>

                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid grid-cols-2 w-full mb-6 bg-white/5 p-1 rounded-full h-12 border border-white/5">
                                    <TabsTrigger value="login" className="h-full rounded-full text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-500">Sign In</TabsTrigger>
                                    <TabsTrigger value="signup" className="h-full rounded-full text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-500">Register</TabsTrigger>
                                </TabsList>

                                <AnimatePresence mode="wait">
                                    <TabsContent value="login" className="mt-0 outline-none">
                                        <motion.form
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            onSubmit={handleLogin}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-2">Email Address</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="you@university.edu"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-12 px-5 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-semibold text-white placeholder:text-zinc-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5 relative">
                                                <div className="flex justify-between items-center ml-2">
                                                    <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Password</Label>
                                                    <button type="button" onClick={() => setShowResetDialog(true)} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Forgot?</button>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        className="h-12 px-5 pr-12 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-semibold text-white placeholder:text-zinc-700"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-[0.98] mt-2" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                                            </Button>
                                            
                                            <div className="relative flex items-center gap-4 py-3">
                                                <div className="flex-1 h-px bg-white/5" />
                                                <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-700">Or continue with</span>
                                                <div className="flex-1 h-px bg-white/5" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => handleOAuth('google')} className="h-11 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Google</span>
                                                </button>
                                                <button type="button" onClick={() => handleOAuth('github')} className="h-11 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                                                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-4 h-4 invert group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">GitHub</span>
                                                </button>
                                            </div>
                                        </motion.form>
                                    </TabsContent>

                                    <TabsContent value="signup" className="mt-0 outline-none">
                                        <motion.form
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            onSubmit={handleSignup}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-2">Full Name</Label>
                                                <Input
                                                    placeholder="John Doe"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                    className="h-12 px-5 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-semibold text-white placeholder:text-zinc-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-2">Email Address</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="you@university.edu"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-12 px-5 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-semibold text-white placeholder:text-zinc-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase ml-2">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        minLength={6}
                                                        className="h-12 px-5 pr-12 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-semibold text-white placeholder:text-zinc-700"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-[0.98] mt-2" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                                            </Button>

                                            <div className="relative flex items-center gap-4 py-3">
                                                <div className="flex-1 h-px bg-white/5" />
                                                <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-700">Or continue with</span>
                                                <div className="flex-1 h-px bg-white/5" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => handleOAuth('google')} className="h-11 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Google</span>
                                                </button>
                                                <button type="button" onClick={() => handleOAuth('github')} className="h-11 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                                                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-4 h-4 invert group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">GitHub</span>
                                                </button>
                                            </div>
                                        </motion.form>
                                    </TabsContent>
                                </AnimatePresence>
                            </Tabs>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => navigate("/")}
                                    className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-3 group"
                                >
                                    <div className="w-7 h-7 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                                    </div>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Identity Recovery Dialog */}
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogContent className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-2xl max-w-md">
                        <DialogHeader className="space-y-4">
                            <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                                <ShieldAlert className="w-8 h-8 text-white" />
                            </div>
                            <DialogTitle className="text-3xl font-display font-bold tracking-tight text-white">Identity Recovery</DialogTitle>
                            <DialogDescription className="text-zinc-500 font-medium leading-relaxed">
                                Enter your synchronized relay address to initiate credential recovery protocol.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-8 mt-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Verification Relay</Label>
                                <Input
                                    type="email"
                                    placeholder="relay@network.id"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/[0.08] transition-all font-bold text-white px-6"
                                />
                            </div>
                            <DialogFooter className="gap-3 pt-4">
                                <Button type="button" onClick={() => setShowResetDialog(false)} className="h-14 px-8 rounded-2xl bg-white/5 border-white/5 text-zinc-500 font-bold hover:text-white transition-all">Cancel</Button>
                                <Button type="submit" disabled={resetLoading} className="h-14 flex-1 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all active:scale-[0.98]">
                                    {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Dispatch Recovery Link"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Protocol Initialized Dialog (Success) */}
                <Dialog open={showSignupSuccess} onOpenChange={setShowSignupSuccess}>
                    <DialogContent className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-12 shadow-2xl max-w-md">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-8">
                                <Send className="w-10 h-10 text-black" />
                            </div>
                            <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-3">Sync Initiated</h2>
                            <p className="text-zinc-500 font-medium leading-relaxed mb-10">
                                A verification protocol has been dispatched to your digital relay. Activate your node to gain entry.
                            </p>

                            <div className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 mb-10 text-left">
                                <p className="text-[11px] text-zinc-600 font-black uppercase tracking-widest mb-2">Relay Information</p>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    If the sync packet does not arrive, audit your <span className="text-white font-bold">Spam</span> and <span className="text-white font-bold">Trash</span> filters.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowSignupSuccess(false)}
                                className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 shadow-2xl transition-all"
                            >
                                Acknowledge
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
