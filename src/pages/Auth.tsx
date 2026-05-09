import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Send, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useTheme } from "@/components/ThemeProvider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Star, Sparkles, ArrowRight } from "lucide-react";

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

    // ... existing ...

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
                redirectTo: window.location.origin + '/settings?tab=account',
            });
            if (error) throw error;
            toast({
                title: "Reset Link Sent",
                description: "A password reset link has been sent to your email. Please check your inbox (and spam folder).",
            });
            setShowResetDialog(false);
            setResetEmail("");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setResetLoading(false);
        }
    };

    const navigate = useNavigate();

    // Handle URL parameters for confirmation messages
    useEffect(() => {
        const handleRedirectMessages = () => {
            const hash = window.location.hash;
            const search = window.location.search;

            if (hash.includes('type=signup') || search.includes('type=signup')) {
                toast({
                    title: "Email Confirmed",
                    description: "Your email has been verified! You can now log in to your account.",
                    className: "bg-green-600 border-none text-white",
                });
                // Clear the hash/params to avoid re-showing
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (hash.includes('type=recovery') || search.includes('type=recovery')) {
                toast({
                    title: "Link Verified",
                    description: "Password reset link verified. Please update your password in settings.",
                });
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        handleRedirectMessages();
    }, [toast]);

    // Force redirect if session exists or when it changes to signed in
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Determine if we should redirect or if we just verified
                const hash = window.location.hash;
                if (!hash.includes('type=signup')) {
                    navigate("/dashboard", { replace: true });
                }
            }
        });

        // Listen for changes
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
            const loginPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });
            // Increased timeout to 20s for slow connections
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Login timed out. Please check connection.")), 20000));

            const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

            if (error) throw error;

            console.log("Login successful, navigating to dashboard...", data);
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security block for reserved names
        const reservedNames = ["admin", "credswap"];
        const adminEmails = ["itsyourriyansh@gmail.com", "credswap@gmail.com"];
        const isReserved = reservedNames.some(name => fullName.trim().toLowerCase() === name);
        const isAdminEmail = adminEmails.includes(email.trim().toLowerCase());

        if (isReserved && !isAdminEmail) {
            toast({
                title: "Invalid Name",
                description: "This name is reserved for system use. Please choose another name.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            // Check if user already exists (Supabase returns empty identities array if user exists but we shouldn't know)
            // But we can show a specific message if identities is empty and session is null
            if (data?.user && data.user.identities?.length === 0) {
                toast({
                    title: "Account exists",
                    description: "This email is already registered. Please try logging in instead.",
                    variant: "destructive",
                });
                return;
            }

            setShowSignupSuccess(true);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast({
                title: "Authentication Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast({
                title: "Authentication Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLinkedinLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'linkedin_oidc',
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast({
                title: "Authentication Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] flex flex-col overflow-hidden relative transition-colors duration-300">
            <Navbar />
            <SEO title="Join CredSwap - Student Hub" description="Join the ultimate campus companion app for notes, events, and more." />

            {/* Premium Background System */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Base Layer */}
                <div className="absolute inset-0 bg-background dark:bg-[#030303] transition-colors duration-500" />
                
                {/* Aurora Orbs */}
                <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/15 dark:bg-indigo-600/10 blur-[120px] rounded-full animate-aurora mix-blend-screen overflow-hidden" />
                <div className="absolute top-[10%] -right-[5%] w-[60%] h-[60%] bg-purple-500/15 dark:bg-purple-600/10 blur-[130px] rounded-full animate-float mix-blend-screen overflow-hidden" />
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 blur-[110px] rounded-full animate-pulse-slow overflow-hidden" />

                {/* The Particle Field */}
                <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.6] bg-grid-slate-800 dark:bg-grid-white bg-[size:32px_32px]" />
                
                {/* Premium Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.08] mix-blend-overlay" />
            </div>

            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <Card className="bg-card border-border backdrop-blur-2xl shadow-2xl rounded-3xl sm:rounded-[32px] overflow-hidden transition-all duration-300">
                        <CardHeader className="text-center pt-8 sm:pt-10 pb-2 flex flex-col items-center px-6 sm:px-8">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4 sm:mb-6 ring-1 ring-white/20"
                            >
                                <GraduationCap className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                            </motion.div>
                            <CardTitle className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight leading-tight transition-colors">
                                Welcome back
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium text-sm sm:text-base mt-2 max-w-[280px] mx-auto leading-relaxed transition-colors">
                                The ecosystem for the next generation of campus builders.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10">
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="flex w-full mb-6 sm:mb-8 bg-muted p-1 rounded-2xl h-12 sm:h-14 ring-1 ring-border shadow-inner">
                                    <TabsTrigger value="login" className="flex-1 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg transition-all h-10 sm:h-11 text-muted-foreground">Login</TabsTrigger>
                                    <TabsTrigger value="signup" className="flex-1 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg transition-all h-10 sm:h-11 text-muted-foreground">Join Now</TabsTrigger>
                                </TabsList>

                                <AnimatePresence mode="wait">
                                    <TabsContent value="login" className="mt-0 outline-none">
                                        <motion.form
                                            key="login-form"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            onSubmit={handleLogin}
                                            className="space-y-5"
                                        >
                                            <div className="space-y-1.5">
                                                <Label htmlFor="login-email" className="text-[10px] sm:text-[11px] font-black tracking-widest text-muted-foreground uppercase ml-1">Email Address</Label>
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-11 sm:h-13 px-4 rounded-xl border-border bg-muted/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-medium text-foreground placeholder:text-muted-foreground/40 text-sm sm:text-base"
                                                />
                                            </div>
                                            <div className="space-y-1.5 relative">
                                                <div className="flex justify-between items-center ml-1">
                                                    <Label htmlFor="login-password" className="text-[10px] sm:text-[11px] font-black tracking-widest text-muted-foreground uppercase">Password</Label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowResetDialog(true)}
                                                        className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                                                    >
                                                        Forgot Password?
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="login-password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        className="h-11 sm:h-13 px-4 pr-11 rounded-xl border-border bg-muted/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-medium text-foreground placeholder:text-muted-foreground/40 text-sm sm:text-base"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-11 sm:h-13 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to CredSwap"}
                                            </Button>
                                            
                                            <div className="relative py-2 hidden sm:block">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-border"></div>
                                                </div>
                                                <div className="relative flex justify-center text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                                                    <span className="bg-card px-4 text-muted-foreground/60">Or continue with</span>
                                                </div>
                                            </div>

                                            <div className="relative py-2 sm:hidden flex items-center justify-between gap-4">
                                                <div className="flex-1 border-t border-border"></div>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Or</span>
                                                <div className="flex-1 border-t border-border"></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleGoogleLogin}
                                                    disabled={loading}
                                                    className="w-full h-11 sm:h-13 rounded-xl border-border bg-card hover:bg-muted font-bold text-sm sm:text-base text-foreground transition-all flex items-center justify-center shadow-sm hover:border-indigo-500/30 group gap-3"
                                                >
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    Google
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleGithubLogin}
                                                    disabled={loading}
                                                    className="w-full h-11 sm:h-13 rounded-xl border-border bg-card hover:bg-muted font-bold text-sm sm:text-base text-foreground transition-all flex items-center justify-center shadow-sm hover:border-indigo-500/30 group gap-3"
                                                >
                                                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5 group-hover:scale-110 transition-transform dark:invert opacity-80 dark:opacity-100" />
                                                    GitHub
                                                </Button>
                                            </div>
                                        </motion.form>
                                    </TabsContent>

                                    <TabsContent value="signup" className="mt-0 outline-none">
                                        <motion.form
                                            key="signup-form"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            onSubmit={handleSignup}
                                            className="space-y-5"
                                        >
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-[10px] sm:text-[11px] font-black tracking-widest text-muted-foreground uppercase ml-1">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Enter your name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                    className="h-11 sm:h-13 px-4 rounded-xl border-border bg-muted/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-medium text-foreground placeholder:text-muted-foreground/40 text-sm sm:text-base"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="signup-email" className="text-[10px] sm:text-[11px] font-black tracking-widest text-muted-foreground uppercase ml-1">Email Address</Label>
                                                <Input
                                                    id="signup-email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-11 sm:h-13 px-4 rounded-xl border-border bg-muted/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-medium text-foreground placeholder:text-muted-foreground/40 text-sm sm:text-base"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="signup-password" className="text-[10px] sm:text-[11px] font-black tracking-widest text-muted-foreground uppercase ml-1">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="signup-password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        minLength={6}
                                                        className="h-11 sm:h-13 px-4 pr-11 rounded-xl border-border bg-muted/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-medium text-foreground placeholder:text-muted-foreground/40 text-sm sm:text-base"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-11 sm:h-13 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Your Account"}
                                            </Button>

                                            <div className="relative py-2 hidden sm:block">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-border"></div>
                                                </div>
                                                <div className="relative flex justify-center text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                                                    <span className="bg-card px-4 text-muted-foreground/60">Or continue with</span>
                                                </div>
                                            </div>

                                            <div className="relative py-2 sm:hidden flex items-center justify-between gap-4">
                                                <div className="flex-1 border-t border-border"></div>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Or</span>
                                                <div className="flex-1 border-t border-border"></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleGoogleLogin}
                                                    disabled={loading}
                                                    className="w-full h-11 sm:h-13 rounded-xl border-border bg-card hover:bg-muted font-bold text-sm sm:text-base text-foreground transition-all flex items-center justify-center shadow-sm hover:border-indigo-500/30 group gap-3"
                                                >
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    Google
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleGithubLogin}
                                                    disabled={loading}
                                                    className="w-full h-11 sm:h-13 rounded-xl border-border bg-card hover:bg-muted font-bold text-sm sm:text-base text-foreground transition-all flex items-center justify-center shadow-sm hover:border-indigo-500/30 group gap-3"
                                                >
                                                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5 group-hover:scale-110 transition-transform dark:invert opacity-80 dark:opacity-100" />
                                                    GitHub
                                                </Button>
                                            </div>
                                        </motion.form>
                                    </TabsContent>
                                </AnimatePresence>
                            </Tabs>

                            <div className="mt-10 pt-6 border-t border-border flex flex-col items-center gap-4">
                                <button
                                    onClick={() => navigate("/")}
                                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    Back to website
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Password Reset Dialog */}
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogContent className="sm:max-w-md rounded-[32px] bg-card border-border shadow-3xl p-8 backdrop-blur-xl transition-all">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-display font-bold text-foreground">Reset Password</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium text-base mt-2">
                                Enter your email and we'll send a secure link to reset your account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email" className="text-[11px] font-black tracking-widest text-muted-foreground uppercase ml-1">Verify Email</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className="h-12 px-4 rounded-xl border-border bg-muted/50 text-foreground"
                                />
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowResetDialog(false)} className="rounded-xl font-bold text-muted-foreground">Cancel</Button>
                                <Button type="submit" disabled={resetLoading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 shadow-indigo-500/20 flex-1 text-white">
                                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send Reset Link
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Signup Success Dialog */}
                <Dialog open={showSignupSuccess} onOpenChange={setShowSignupSuccess}>
                    <DialogContent className="w-[90vw] sm:max-w-md rounded-3xl sm:rounded-[32px] bg-card border-border shadow-3xl p-6 sm:p-8 backdrop-blur-xl border-none transition-all">
                        <div className="flex flex-col items-center text-center py-2 sm:py-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 ring-1 ring-green-500/20">
                                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Check your email</h2>
                            <p className="text-muted-foreground font-medium text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                                We've sent a verification link to your inbox. Please click it to activate your account.
                            </p>

                            <div className="w-full p-4 rounded-2xl bg-muted border border-border mb-6 sm:mb-8">
                                <p className="text-[11px] sm:text-sm text-muted-foreground font-medium leading-relaxed italic">
                                    "Can't find it? Please check your <span className="text-indigo-600 dark:text-indigo-400 font-bold">Spam</span> or <span className="text-indigo-600 dark:text-indigo-400 font-bold">Junk</span> folder as well."
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowSignupSuccess(false)}
                                className="w-full h-11 sm:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-500/20"
                            >
                                Got it
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
