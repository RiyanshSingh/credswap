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
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.warn("Featured Items: Profiles join failed, falling back to basic fetch.", error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('status', 'approved')
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
    <div className="min-h-screen bg-background dark:bg-black text-foreground selection:bg-primary/20 overflow-x-hidden">
      <SEO title="CredSwap - Your Campus Operating System" />
      <Navbar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >

      <Hero />



            {/* Categories Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 -mt-10 sm:-mt-20 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Explore Categories
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6">
          <Link to="/community">
            <CategoryCard
              icon={Users}
              label="Groups"
              count={stats.groups}
              gradient="gradient-primary"
              className="h-full"
            />
          </Link>
          <Link to="/rooms">
            <CategoryCard
              icon={BedDouble}
              label="Rooms"
              count={stats.rooms}
              gradient="bg-accent"
              className="h-full"
            />
          </Link>
          <Link to="/marketplace">
            <CategoryCard
              icon={ShoppingBag}
              label="Marketplace"
              count={stats.items}
              gradient="bg-warning"
              className="h-full"
            />
          </Link>
        </div>
      </section>

      

      

      {/* Featured Marketplace Items */}
      <section ref={itemsRef} className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-primary shrink-0">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
              Featured Items
            </h2>
          </div>
          <Link to="/marketplace">
            <Button variant="ghost" className="text-primary">
              Browse Market
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoadingItems ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : featuredItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredItems.map((item: any, i: number) => (
              <div key={item.id} className="flex w-full h-full">
                <ItemCard item={item} isLoggedIn={true} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items currently available.</p>
            <Link to="/marketplace">
              <Button variant="outline" className="mt-4">Check Marketplace</Button>
            </Link>
          </div>
        )}
      </section>



      {/* Community Section (New) */}
      <section ref={communitiesRef} className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <div className="text-blue-600 shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground truncate">
                Find Your Tribe
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate hidden sm:block">Connect with students who share your interests</p>
            </div>
          </div>
          <Link to="/community" className="shrink-0">
            <Button variant="ghost" className="text-primary text-xs md:text-sm px-2 md:px-4 h-8 md:h-10">
              <span className="hidden sm:inline">Explore Groups</span>
              <span className="sm:hidden">Explore</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CommunitySectionLoader />
        </div>
      </section>

      


      

      

      {/* Redesigned Student Housing Section */}
      <section ref={roomsRef} className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Details & Features */}
          <div className="space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[12px] md:text-sm font-bold tracking-wide uppercase shadow-sm"
            >
              <BedDouble className="w-4 h-4" />
              <span>Verified Stays</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-display font-black text-foreground leading-[1.15] tracking-tight"
            >
              Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Student Housing</span> near campus.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl font-medium"
            >
              Say goodbye to stressful room hunting. Discover verified PG accommodations, hostels, and shared flats directly from owners and seniors, without any broker fees.
            </motion.p>

            {/* Mobile-Only Listing Card (Inserted between Text) */}
            <div className="block lg:hidden w-full max-w-[250px] sm:max-w-[280px] mx-auto py-2 relative z-10 transition-transform">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none -z-10" />
              {isLoadingRooms ? (
                Array(1).fill(0).map((_, i) => <div key={i} className="h-56 w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl animate-pulse shadow-xl" />)
              ) : featuredRooms.length > 0 ? (
                featuredRooms.slice(0, 1).map((room: any) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    key={room.id} 
                    className="w-full scale-95 origin-center"
                  >
                    <RoomCard room={room} />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-white/50 dark:bg-secondary/30 backdrop-blur-md rounded-3xl border border-border/50 shadow-inner w-full scale-90">
                  <BedDouble className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-medium text-sm">No rooms available right now.</p>
                </div>
              )}
            </div>

            <motion.ul 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-3 md:space-y-4"
            >
              {[
                "Zero brokerage fees & hidden costs",
                "Student-friendly environments only",
                "Transparent pricing & honest reviews"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="pt-2 md:pt-4"
            >
              <Link to="/rooms">
                <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-500/20 group transition-all active:scale-95">
                  View All Rentals
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Listings (Desktop Only) */}
          <div className="hidden lg:flex relative h-full items-center justify-center mt-0 perspective-[2000px]">
            {/* Background decorative blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-[380px] mx-auto relative z-10 group">
              
              {/* Decorative Stack Layers */}
              {featuredRooms.length > 0 && !isLoadingRooms && (
                <div className="absolute inset-0 pointer-events-none -z-10">
                  {/* Bottom Layer */}
                  <div className="absolute top-8 -right-8 w-full h-[98%] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 dark:from-violet-500/10 dark:to-fuchsia-500/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 rotate-[8deg] scale-[0.92] origin-bottom-left transition-all duration-700 ease-out group-hover:rotate-[12deg] group-hover:translate-x-2 group-hover:-translate-y-2" />
                  
                  {/* Middle Layer */}
                  <div className="absolute top-4 -right-4 w-full h-[99%] bg-gradient-to-br from-indigo-500/30 to-violet-500/30 dark:from-indigo-500/10 dark:to-violet-500/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-white/10 rotate-[4deg] scale-[0.96] origin-bottom-left transition-all duration-500 ease-out group-hover:rotate-[6deg] group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              )}

              {/* The Actual Card */}
              <div className="relative z-10 w-full transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
                {isLoadingRooms ? (
                  Array(1).fill(0).map((_, i) => <div key={i} className="h-64 md:h-[400px] w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl animate-pulse shadow-xl" />)
                ) : featuredRooms.length > 0 ? (
                  featuredRooms.slice(0, 1).map((room: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 }}
                      key={room.id} 
                      className="w-full rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 bg-background"
                    >
                      <RoomCard room={room} />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-white/50 dark:bg-secondary/30 backdrop-blur-md rounded-3xl border border-border/50 shadow-inner w-full">
                    <BedDouble className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium text-lg">No rooms available right now.</p>
                    <p className="text-sm mt-1 opacity-70">Check back later for new listings!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Hero-Inspired Focused CTA Section */}
      <section className="container mx-auto px-4 py-24 md:py-32 relative text-center">
        {/* Subtle Background Glow - Inspired by Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Release-Style Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[12px] sm:text-[13px] font-bold text-indigo-600 dark:text-indigo-400 mb-8 sm:mb-10 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="tracking-tight uppercase">Join the community</span>
          </motion.div>

          {/* Impactful Typography */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[32px] sm:text-[48px] md:text-[60px] font-display font-black tracking-tight leading-[1.05] mb-6 text-zinc-900 dark:text-white"
          >
            Ready to redesign your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">campus experience?</span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[16px] sm:text-[18px] md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 sm:mb-12 max-w-[640px] font-medium leading-[1.6]"
          >
            Everything you need for college life is just a click away. Connect, discover, and excel with CredSwap.
          </motion.p>

          {/* High-Impact Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4"
          >
            <Link to="/auth" className="w-full sm:w-auto">
              <Button 
                size="xl" 
                className="w-full sm:w-auto h-14 md:h-16 px-12 rounded-[20px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black text-base md:text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-all group"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to="/about" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="xl" 
                className="w-full sm:w-auto h-14 md:h-16 px-12 rounded-[20px] border-zinc-200 dark:border-white/10 dark:text-zinc-300 font-bold text-base md:text-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
              >
                View Features
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <MobileNav />
      <Footer />
      </motion.main>
    </div>
  );
}
