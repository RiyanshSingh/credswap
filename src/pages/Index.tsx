import { Link } from "react-router-dom";
import { HeroSearch } from "@/components/HeroSearch";
import { Hero } from "@/components/Hero";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { MobileNav } from "@/components/MobileNav";

import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileQuestion,
  Calendar,
  Briefcase,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  GraduationCap,
  ShoppingBag,
  Clock, // Added Clock
  BedDouble, // Added BedDouble
  MapPin, // Added MapPin
  Star,
  CheckCircle,
  LayoutDashboard,
  Bot,
  ClipboardCheck,
  Zap,
  Rocket,
  ShieldCheck,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils"; // Added cn utility
import { Badge } from "@/components/ui/badge"; // Added Badge
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion"; // Added motion
import { Card, CardContent } from "@/components/ui/card";




import { ItemCard } from "@/components/marketplace/ItemCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";

import { RoomCard } from "@/components/rooms/RoomCard";
import { useRef } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export default function Index() {
  const itemsRef = useRef(null);
  const roomsRef = useRef(null);
  const communitiesRef = useRef(null);

  const itemsInView = useIntersectionObserver(itemsRef, { freezeOnceVisible: true, rootMargin: '400px' });
  const roomsInView = useIntersectionObserver(roomsRef, { freezeOnceVisible: true, rootMargin: '400px' });
  const communitiesInView = useIntersectionObserver(communitiesRef, { freezeOnceVisible: true, rootMargin: '400px' });

  
  const { data: featuredItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['featuredItems', 'limit-4'],
    enabled: !!itemsInView?.isIntersecting || !window.IntersectionObserver,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*, profiles(full_name, avatar_url, email)')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.warn("Featured Items: Profiles join failed, falling back to basic fetch.", error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('status', 'approved')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (fallbackError) {
          console.error("Featured Items: Basic fetch failed too.", fallbackError);
          return [];
        }
        return fallbackData || [];
      }

      return data || [];
    }
  });

  
  
  // [NEW] Queries for Homepage
  const { data: featuredRooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['featuredRooms'],
    enabled: !!roomsInView?.isIntersecting || !window.IntersectionObserver,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, profiles!owner_id(full_name)')
        .eq('status', 'available')
        .limit(5);

      if (error || (data && data.length > 0 && !data[0].profiles)) {
        console.warn("Featured Rooms join failed, falling back", error);
        const { data: basicData } = await supabase
          .from('rooms')
          .select('*')
          .eq('status', 'available')
          .limit(5);
        if (!basicData) return [];

        // Manual fetch
        const ownerIds = Array.from(new Set(basicData.map(r => r.owner_id).filter(Boolean)));
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', ownerIds);
          const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || []);
          return basicData.map(r => ({ ...r, profiles: profileMap[r.owner_id] }));
        }
        return basicData;
      }
      return data || [];
    }
  });

  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({
    queryKey: ['featuredCommunities'],
    enabled: !!communitiesInView?.isIntersecting || !window.IntersectionObserver,
    queryFn: async () => {
      const { data } = await supabase
        .from('communities')
        .select('*, community_members(count)')
        .order('members_count', { ascending: false })
        .limit(3);

      return data?.map((c: any) => ({
        ...c,
        members_count: c.members_count || (c.community_members?.[0]?.count || 0)
      })) || [];
    }
  });

  
  // Fetch Real Stats for Categories
    const { data: stats = { groups: 0, rooms: 0, items: 0 } } = useQuery({
    queryKey: ['homepageStats'],
    queryFn: async () => {
      try {
        const [groupsRes, roomsRes, itemsRes] = await Promise.all([
          supabase.from('communities').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true }),
          supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        ]);

        return {
          groups: groupsRes.count || 0,
          rooms: roomsRes.count || 0,
          items: itemsRes.count || 0,
        };
      } catch (err) {
        console.error("Home Stats error:", err);
        return { groups: 0, rooms: 0, items: 0 };
      }
    }
  });

  // Section Skeletons
  
  const RoomSectionLoader = () => (
    <>
      {isLoadingRooms ? (
        Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)
      ) : featuredRooms.length > 0 ? (
        featuredRooms.map((room: any) => <RoomCard key={room.id} room={room} />)
      ) : (
        <div className="col-span-full text-center py-10 text-muted-foreground bg-secondary/30 rounded-xl">
          No rooms available at the moment.
        </div>
      )}
    </>
  );

  const CommunitySectionLoader = () => {
    const gradients = [
      { bg: "bg-blue-500/10", text: "text-blue-600", border: "hover:border-blue-500/50", glow: "group-hover:shadow-blue-500/20" },
      { bg: "bg-purple-500/10", text: "text-purple-600", border: "hover:border-purple-500/50", glow: "group-hover:shadow-purple-500/20" },
      { bg: "bg-amber-500/10", text: "text-amber-600", border: "hover:border-amber-500/50", glow: "group-hover:shadow-amber-500/20" },
      { bg: "bg-rose-500/10", text: "text-rose-600", border: "hover:border-rose-500/50", glow: "group-hover:shadow-rose-500/20" },
    ];

    if (isLoadingCommunities) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="p-6 border border-border/50 rounded-[2rem] space-y-4">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
          <div className="pt-4 border-t flex justify-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ));
    }

    return (
      <>
        {communities.length > 0 ? communities.map((comm: any, idx: number) => {
          const theme = gradients[idx % gradients.length];
          return (
            <Link key={comm.id} to={`/community/${comm.id}`} className="block h-full animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className={cn(
                "group relative bg-transparent border border-border/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl md:hover:shadow-2xl cursor-pointer h-full overflow-hidden",
                theme.border,
                theme.glow
              )}>
                {/* Background Accent */}
                <div className={cn("absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 blur-2xl md:blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700", theme.bg)} />

                <div className={cn(
                  "w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm",
                  theme.bg
                )}>
                  {comm.image_url ? (
                    <img src={comm.image_url} alt={comm.name} className="w-full h-full rounded-xl md:rounded-2xl object-cover" />
                  ) : (
                    <Users className={cn("w-7 h-7 md:w-10 md:h-10", theme.text)} />
                  )}
                </div>

                <div className="space-y-1 md:space-y-2 mb-4 md:mb-6">
                  <h3 className="font-display font-bold text-base md:text-xl line-clamp-1 group-hover:text-primary transition-colors">{comm.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed px-1 md:px-2">{comm.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-center gap-2 md:gap-3 w-full pt-3 md:pt-4 border-t border-border/30">
                  <Badge variant="secondary" className="capitalize bg-secondary/50 font-medium text-[10px] md:text-xs">
                    {comm.type}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-muted-foreground">
                    <span className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse", theme.bg.replace('/10', ''))} />
                    {comm.members_count} Members
                  </div>
                </div>
              </div>
            </Link>
          );
        }) : (
          <div className="col-span-full text-center py-20 text-muted-foreground bg-secondary/10 rounded-[2rem] border border-dashed border-border">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No communities found matching your criteria.</p>
          </div>
        )}
      </>
    );
  };

  
  
  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-white/20 overflow-x-hidden font-sans">
      <SEO title="CredSwap - Your Campus Operating System" />
      <Navbar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Hero />

        {/* Categories Section styled as 'Why Choose Us' */}
        <section className="container mx-auto px-4 py-20 md:py-32 relative z-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Why Choose Us
          </div>
          
          <h2 className="text-3xl md:text-[42px] font-display font-bold text-white mb-6 max-w-2xl mx-auto leading-tight">
            Why CredSwap is the Right Choice for Your Campus
          </h2>
          
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16 text-sm md:text-[15px] leading-relaxed">
            We combine campus networking, a dedicated marketplace, and verified student housing to deliver a platform that not only connects you but performs flawlessly over time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-8 text-left hover:bg-[#111] transition-colors group flex flex-col h-full">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vibrant Groups</h3>
              <p className="text-sm text-zinc-400 mb-8 line-clamp-3 flex-1">Join {stats.groups} active communities. Whether it's study groups or hobby clubs, find your tribe instantly and connect with peers.</p>
              <Link to="/community" className="text-xs font-semibold text-zinc-300 group-hover:text-white flex items-center gap-2 transition-colors mt-auto">
                Learn More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {/* Card 2 */}
            <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-8 text-left hover:bg-[#111] transition-colors group flex flex-col h-full">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Campus Marketplace</h3>
              <p className="text-sm text-zinc-400 mb-8 line-clamp-3 flex-1">Buy and sell within your college. Explore {stats.items} items listed exclusively by students, ensuring safe and quick transactions.</p>
              <Link to="/marketplace" className="text-xs font-semibold text-zinc-300 group-hover:text-white flex items-center gap-2 transition-colors mt-auto">
                Learn More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-8 text-left hover:bg-[#111] transition-colors group flex flex-col h-full">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
                <BedDouble className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Verified Housing</h3>
              <p className="text-sm text-zinc-400 mb-8 line-clamp-3 flex-1">Discover {stats.rooms} verified student rooms and PGs without the hassle of brokers. Find the perfect stay near your campus.</p>
              <Link to="/rooms" className="text-xs font-semibold text-zinc-300 group-hover:text-white flex items-center gap-2 transition-colors mt-auto">
                Learn More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          
          <div className="mt-12">
            <Link to="/about">
               <Button variant="outline" className="h-10 px-6 rounded-full bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white text-xs font-medium">
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-2" /> Explore All Services <ArrowRight className="w-3 h-3 ml-2" />
               </Button>
            </Link>
          </div>
        </section>

        {/* About Section - Matches "About Bit Lura" */}
        <section className="container mx-auto px-4 py-20 md:py-24 border-t border-zinc-900">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
            <div className="w-full lg:w-1/2">
               <div className="aspect-[4/5] md:aspect-video lg:aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                 <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay z-10" />
                 <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop" alt="Students collaborating" className="w-full h-full object-cover filter brightness-[0.8]" />
               </div>
            </div>
            
            <div className="w-full lg:w-1/2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                About Us
              </div>
              
              <h2 className="text-3xl md:text-[42px] font-display font-bold text-white mb-6 leading-tight">
                About CredSwap
              </h2>
              
              <p className="text-zinc-400 mb-10 text-[15px] leading-[1.7]">
                At CredSwap, we design and develop modern, high-performance platforms that help ambitious students grow. Our team blends creativity with cutting-edge technology to deliver scalable, future-ready digital solutions for the campus.
              </p>
              
              <div className="grid grid-cols-3 gap-6 mb-10 pb-10 border-b border-zinc-900">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">20+</div>
                  <div className="text-[10px] md:text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Universities</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">5k+</div>
                  <div className="text-[10px] md:text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Active Students</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">10k+</div>
                  <div className="text-[10px] md:text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Connections</div>
                </div>
              </div>
              
              <Link to="/about">
                <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-sm font-semibold flex items-center gap-2">
                  More About Us <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Items - Matches "Our Core Services" */}
        <section ref={itemsRef} className="container mx-auto px-4 py-20 md:py-32 border-t border-zinc-900 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Our Marketplace
          </div>
          
          <h2 className="text-3xl md:text-[42px] font-display font-bold text-white mb-6 max-w-2xl mx-auto leading-tight">
            Essentials to Power Your Campus Life
          </h2>
          
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16 text-[15px]">
            From modern textbooks to electronics – we provide everything your student life needs to succeed online.
          </p>

          {isLoadingItems ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[340px] w-full rounded-[24px] bg-[#0a0a0a] border border-zinc-800/50" />)}
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto">
              {featuredItems.map((item: any, i: number) => (
                <div key={item.id} className="flex w-full h-full text-left bg-[#0a0a0a] border border-zinc-800/50 rounded-[24px] overflow-hidden hover:border-zinc-700 transition-colors group [&_article]:border-none [&_article]:bg-transparent [&_article]:shadow-none">
                  <ItemCard item={item} isLoggedIn={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">No items currently available.</p>
            </div>
          )}
          
          <div className="mt-12">
            <Link to="/marketplace">
               <Button variant="outline" className="h-10 px-6 rounded-full bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white text-xs font-medium">
                 View All Items <ArrowRight className="w-3 h-3 ml-2" />
               </Button>
            </Link>
          </div>
        </section>

        {/* Student Housing - Matches "Our Work. Your Growth" */}
        <section ref={roomsRef} className="container mx-auto px-4 py-20 md:py-32 border-t border-zinc-900 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Housing
          </div>
          
          <h2 className="text-3xl md:text-[42px] font-display font-bold text-white mb-6 max-w-2xl mx-auto leading-tight">
            Your Perfect Stay. Your Growth
          </h2>
          
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16 text-[15px]">
            We partner with verified landlords to build fast, scalable housing solutions that fuel student comfort. Here's a glimpse of what's available.
          </p>

          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingRooms ? (
               Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-[24px] bg-[#0a0a0a] border border-zinc-800/50" />)
            ) : featuredRooms.length > 0 ? (
               featuredRooms.slice(0, 3).map((room: any) => (
                  <div key={room.id} className="w-full text-left bg-[#0a0a0a] border border-zinc-800/50 rounded-[24px] overflow-hidden hover:border-zinc-700 transition-colors [&_div]:border-none [&_div]:shadow-none">
                     <RoomCard room={room} />
                  </div>
               ))
            ) : (
               <div className="col-span-full text-zinc-500 text-center">No rooms available.</div>
            )}
          </div>
          
          <div className="mt-12">
            <Link to="/rooms">
               <Button variant="outline" className="h-10 px-6 rounded-full bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white text-xs font-medium">
                 View Full Portfolio <ArrowRight className="w-3 h-3 ml-2" />
               </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24 md:py-32 border-t border-zinc-900 relative text-center">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              Powered by CredSwap
            </div>

            <h2 className="text-[36px] sm:text-[48px] md:text-[60px] font-display font-bold tracking-tight leading-[1.1] mb-6 text-white">
              Let's build something <br />
              <span className="text-white/80">future-ready.</span>
            </h2>

            <p className="text-[15px] md:text-lg text-zinc-400 mb-10 max-w-[600px] font-medium leading-[1.6]">
              Partner with CredSwap to create a student experience that grows with your campus and sets you apart from the rest.
            </p>

            <Link to="/auth">
              <Button className="h-12 md:h-14 px-8 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-black" />
                Schedule Consultation <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer Navigation */}
        <MobileNav />
        <Footer />
      </motion.main>
    </div>
  );
}
