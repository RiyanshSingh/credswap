
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
  Map
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
    refetchInterval: 30000 // Fallback polling every 30s
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
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled ? "glass border-b border-border/50 shadow-sm" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Cred<span className="text-gradient">Swap</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-zinc-600 dark:text-zinc-300 hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search dialog"
              >
                <Search className="w-5 h-5" />
              </Button>

              <NotificationDropdown />

              <Link to="/inbox" aria-label="Check your messages">
                <Button variant="ghost" size="icon" className="text-muted-foreground relative" aria-hidden="true">
                  <Mail className="w-5 h-5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center shadow-sm animate-in zoom-in-50">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </Button>
              </Link>

              {!authLoading && (
                session ? (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                )
              )}
            </div>

            {/* Mobile Actions (Visible on Mobile) */}
            <div className="flex md:hidden items-center gap-1">
              <NotificationDropdown />

              <Link to="/inbox" aria-label="Check your messages">
                <Button variant="ghost" size="icon" className="text-muted-foreground w-9 h-9 relative" aria-hidden="true">
                  <Mail className="w-5 h-5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full border border-background flex items-center justify-center shadow-sm">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
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
