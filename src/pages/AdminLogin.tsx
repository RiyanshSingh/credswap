import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
    // Login State
    const [adminId, setAdminId] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    // Login Handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);

        try {
            const normalizedId = adminId.trim();

            // Verify via the custom admin RPC
            const { data: isValid, error: authError } = await supabase.rpc('login_admin', {
                p_username: normalizedId,
                p_password: password,
            });

            if (authError) throw authError;
            if (!isValid) throw new Error("Invalid admin credentials.");

            // Store credentials for the AdminDashboard to use in its RPCs
            const adminData = {
                username: normalizedId,
                password: password,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem("admin_creds", JSON.stringify(adminData));
            localStorage.setItem("admin_auth", "true");

            // SUCCESS
            toast({
                title: "Access Granted",
                description: "You have logged in successfully as an administrator.",
            });

            // Navigate to admin dashboard
            navigate("/admin/dashboard");

        } catch (err: any) {
            console.error("Admin Login Error:", err);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: err.message || "An unexpected error occurred during login.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border/50 shadow-large">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-display font-bold">Admin Access</CardTitle>
                    <CardDescription>
                        Restricted area. Please verify your identity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adminId">Admin ID</Label>
                            <Input
                                id="adminId"
                                placeholder="Username"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" variant="gradient">
                            Enter Dashboard
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border pt-4">
                    <Button variant="link" size="sm" onClick={() => navigate("/")}>
                        Return to Home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
