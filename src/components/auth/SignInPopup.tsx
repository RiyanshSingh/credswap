import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SignInPopup() {
    const [open, setOpen] = useState(false);
    const { session, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const checkRequirement = async () => {
            // Don't show on admin routes
            if (location.pathname.startsWith('/admin')) {
                setOpen(false);
                return;
            }

            // 1. Check if user is already logged in
            if (session) {
                return;
            }

            // 2. Check if the popup is enabled in system settings
            const { data: setting } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'show_signin_popup')
                .maybeSingle();

            // Default to true if setting is missing (or false if you prefer safe-fail)
            // But here we rely on the DB setting. If data is missing (table issue), skip.
            const isEnabled = setting?.value === 'true';

            if (isEnabled) {
                // optional: check localStorage if user dismissed it recently?
                // For now, per requirement "they can close it also", we just show it.
                // We'll set a larger timeout so it doesn't appear too early.
                setTimeout(() => setOpen(true), 5000);
            }
        };

        checkRequirement();
    }, [location.pathname, session]);

    if (loading) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md w-[85vw] rounded-3xl border-0 shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-3xl font-display font-bold text-foreground">Welcome to Campusly</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        Join your college community to access notes, events, and marketplace deals!
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                        <Button className="w-full text-lg h-12 shadow-lg shadow-primary/20">
                            Sign In / Sign Up
                        </Button>
                    </Link>
                    <Button variant="ghost" className="text-muted-foreground" onClick={() => setOpen(false)}>
                        Continue as Guest
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
