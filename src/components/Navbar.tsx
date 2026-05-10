
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Briefcase,
  Home,
  Menu,
  User,
  X,
  Search,

  GraduationCap,
  MapPin,
  Users,
  ShoppingBag,
  Mail,
  BedDouble, // [NEW]
  ClipboardCheck,
  Map,
  Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/SearchDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/contexts/AuthContext";


const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Rooms", href: "/rooms", icon: BedDouble },
  { label: "Community", href: "/community", icon: Users },
  { label: "Blog & News", href: "/blog", icon: Newspaper },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, loading: authLoading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread messages
  const { data: unreadChatCount = 0 } = useQuery({
    queryKey: ['unread-messages', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      // Get all conversations for user
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`);

      if (!convos || convos.length === 0) return 0;

      const convoIds = convos.map(c => c.id);

      // Count unread messages in those conversations where sender is not current user
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convoIds)
        .neq('sender_id', session.user.id)
        .eq('is_read', false);

      if (error) {
        console.error("Error fetching unread messages:", error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 10000, // Poll every 10s as fallback
    refetchOnWindowFocus: true, // Immediately re-check when user focuses the tab
    staleTime: 0 // Always treat as stale so it refetches immediately on invalidate
  });

  useEffect(() => {
    // Keyboard shortcut for search
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
    };
  }, []);

  // Real-time Subscription for Messages
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('navbar-messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERTs (new messages) and UPDATEs (read status changes)
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-messages', session.user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);
  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans",
        scrolled ? "bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 shadow-sm py-4" : "bg-transparent py-6"
      )}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo - Minimalist White */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded flex items-center justify-center border-2 border-white text-white">
                <div className="w-3 h-3 bg-white rounded-[1px] transform rotate-45" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">
                CredSwap
              </span>
            </Link>

            {/* Desktop Nav Links - Centered, Text Only, Dot for active */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              <NotificationDropdown />

              <Link to="/inbox" className="relative group">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
                  <Mail className="w-4 h-4" />
                </Button>
                {unreadChatCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </Link>

               {!authLoading && (
                session ? (
                  <Link to="/dashboard">
                    <Button className="h-10 px-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="h-10 px-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2">
                      Sign In
                    </Button>
                  </Link>
                )
              )}
            </div>

            {/* Mobile Actions (Visible on Mobile) */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-card shadow-large animate-slide-down">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display font-bold text-lg">Menu</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 mb-4"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                <Search className="w-4 h-4" />
                Search...
              </Button>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border mt-4">
                {!authLoading && (
                  session ? (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gradient" className="w-full" size="lg">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gradient" className="w-full" size="lg">
                        <User className="w-4 h-4" />
                        Sign In / Sign Up
                      </Button>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed nav */}
      {location.pathname !== '/' && <div className="h-16" />}
    </>
  );
}
