import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SignInPopup } from "@/components/auth/SignInPopup";
import { ChatBot } from "@/components/ChatBot";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Standard Imports for Core Pages (Immediate Navigation)
import Marketplace from "./pages/Marketplace";
import RoomFinder from "./pages/RoomFinder";
import RoomDetails from "./pages/RoomDetails";
import ListingDetails from "./pages/ListingDetails";

// Lazy Loaded Pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Community = lazy(() => import("./pages/Community"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const DisputeDetails = lazy(() => import("./pages/DisputeDetails"));
const Inbox = lazy(() => import("./pages/Inbox"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const Careers = lazy(() => import("./pages/Careers"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Do not refetch when switching browser tabs
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fire and forget logging to avoid blocking auth flow
        logActivity(session.user.id, "Logged In", "User signed in to the session").catch(e =>
          console.error("Failed to log activity silently", e)
        );
      } else if (event === 'SIGNED_OUT') {
        // Clear all cached data when user logs out
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <SignInPopup />

              {/* ── Global Page Background — fixed, behind everything ── */}
              <div
                aria-hidden="true"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 0,
                  backgroundColor: '#000000', // Absolute black base
                  background: 'radial-gradient(ellipse 40% 80% at 0% 20%, #1a1a1a 0%, #0f0f0f 40%, #050505 70%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              >
                {/* ── Crystal Grain / Noise Overlay ── */}
                <div 
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    opacity: 0.03, // Reduced slightly for better performance
                    transform: 'translateZ(0)', // Force GPU acceleration
                    pointerEvents: 'none',
                  }}
                />

                {/* Dark vignette on corners to focus the light */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 130% 130% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)',
                }} />

                {/* ── Ambient Glow System — Left Side Only ── */}
                {/* Massive left-side bloom */}
                <div style={{
                  position: 'absolute',
                  top: '-10%', left: '-20%',
                  width: '70%', height: '120%',
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 50%, transparent 75%)',
                  filter: 'blur(100px)',
                  mixBlendMode: 'screen',
                }} />
              </div>
              {/* App content — sits above the fixed background */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 z-50">
                      {/* Ambient blobs - Monochrome */}
                      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px] animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-white/[0.01] rounded-full blur-[100px] animate-pulse delay-700" />

                      {/* Logo ring + spinner */}
                      <div className="relative w-24 h-24">
                        {/* Outer spinning monochrome ring */}
                        <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 80 80">
                          <defs>
                            <linearGradient id="spin-grad-mono" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                          <circle cx="40" cy="40" r="36" stroke="url(#spin-grad-mono)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="140 80" />
                        </svg>

                        {/* Center logo icon - Minimalist */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-[22px] bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20">
                            <span className="text-black font-black text-xl tracking-tighter">C</span>
                          </div>
                        </div>
                      </div>

                      {/* Brand name */}
                      <div className="flex flex-col items-center gap-2 mt-4">
                        <span className="text-xl font-display font-bold text-white tracking-tight">CredSwap</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-500">Initializing</span>
                        </div>
                      </div>

                      {/* Slim progress bar at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer bg-[length:200%_100%] w-full" />
                      </div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/community/:id" element={<CommunityFeed />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/marketplace/:id" element={<ListingDetails />} />
                      <Route path="/rooms" element={<RoomFinder />} />
                      <Route path="/rooms/:id" element={<RoomDetails />} />
                      <Route path="/inbox" element={<Inbox />} />

                      {/* Protected Routes */}

                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile/:id" element={<Profile />} />

                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminLogin />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/dispute/:id" element={<DisputeDetails />} />
                      


                      {/* Static Pages */}
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogDetails />} />

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </div>
              <ChatBot />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
