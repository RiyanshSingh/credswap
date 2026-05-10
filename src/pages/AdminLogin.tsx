import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function AdminLogin() {
    const [adminId, setAdminId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);

        try {
            const { data: isValid, error: authError } = await supabase.rpc('login_admin', {
                p_username: adminId.trim(),
                p_password: password,
            });

            if (authError) throw authError;
            if (!isValid) throw new Error("Invalid administrative credentials.");

            localStorage.setItem("admin_creds", JSON.stringify({
                username: adminId.trim(),
                password: password,
                loginTime: new Date().toISOString()
            }));
            localStorage.setItem("admin_auth", "true");

            toast({ title: "Access Granted", description: "Identity verified. Protocol engaged." });
            navigate("/admin/dashboard");
        } catch (err: any) {
            toast({ variant: "destructive", title: "Access Denied", description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden selection:bg-white selection:text-black">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-white/[0.03] blur-[150px] rounded-full animate-aurora" />
                <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-white/[0.02] blur-[130px] rounded-full animate-float" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[380px] relative z-10"
            >
                <div className="bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl shadow-[0_32px_120px_rgba(0,0,0,0.8)] rounded-[32px] overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="p-8 sm:p-10">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-6">
                                <Lock className="w-6 h-6 text-black" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
                                Security Nexus
                            </h1>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-2">
                                Administrative Protocol
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase ml-1">Authority ID</Label>
                                <Input
                                    placeholder="Enter administrative handle"
                                    value={adminId}
                                    onChange={(e) => setAdminId(e.target.value)}
                                    required
                                    className="h-12 px-5 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-bold text-white placeholder:text-zinc-700 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase ml-1">Access Key</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter secure key"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 px-5 rounded-xl border-white/5 bg-white/5 focus:bg-white/[0.08] focus:border-white/20 transition-all font-bold text-white placeholder:text-zinc-700 text-sm"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_15px_40px_rgba(255,255,255,0.05)] transition-all active:scale-[0.98]" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Engagement Sequence"}
                            </Button>
                        </form>

                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={() => navigate("/")}
                                className="text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-7 h-7 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                    <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                                </div>
                                Exit Terminal
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3 px-8 opacity-50">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                        End-to-End Cryptographic Verification
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
