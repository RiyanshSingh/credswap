
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "./HeroSearch";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NOISE_DATA_URL } from "@/lib/noise";

export function Hero() {
  const { data: heroStats } = useQuery({
    queryKey: ['heroStats'],
    queryFn: async () => {
      const [profilesRes, itemsRes, groupsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('communities').select('*', { count: 'exact', head: true })
      ]);

      return {
        students: profilesRes.count || 0,
        items: itemsRes.count || 0,
        groups: groupsRes.count || 0
      };
    }
  });

  return (
    <section className="relative overflow-hidden bg-background dark:bg-black pt-24 pb-8 md:pt-32 md:pb-12 transition-colors duration-300">
      {/* Premium Background System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Base Layer */}
        <div className="absolute inset-0 bg-background dark:bg-[#030303] transition-colors duration-500" />

        {/* Aurora Orbs - Desktop Animated, Mobile Static & Simplified */}
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[60px] md:blur-[80px] rounded-full sm:animate-aurora overflow-hidden will-change-[transform,opacity]" />
        <div className="absolute top-[10%] -right-[5%] w-[60%] h-[60%] bg-purple-500/5 dark:bg-purple-600/5 blur-[70px] md:blur-[90px] rounded-full sm:animate-float overflow-hidden will-change-[transform,opacity]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-blue-600/5 blur-[50px] md:blur-[70px] rounded-full sm:animate-pulse-slow overflow-hidden will-change-[transform,opacity]" />

        {/* The Particle/Star Field - Reduced opacity on mobile */}
        <div className="absolute inset-0 opacity-[0.2] md:opacity-[0.4] dark:opacity-[0.3] md:dark:opacity-[0.6] bg-grid-slate-800 dark:bg-grid-white bg-[size:32px_32px]" />

        {/* Beaming Light - Hidden on mobile for performance */}
        <div className="hidden md:block absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.02)_45%,transparent_55%)] bg-[length:200%_100%] animate-gradient-x opacity-30" />

        {/* Noise Texture - Hidden on mobile if laggy */}
        <div
          className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] dark:opacity-[0.04] md:dark:opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("${NOISE_DATA_URL}")`, transform: 'translateZ(0)' }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
        >
          {/* Release Pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[12px] sm:text-[13px] font-medium text-zinc-600 dark:text-zinc-300 mb-6 sm:mb-8 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer group shadow-sm z-20 relative"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="tracking-tight">CredSwap is live</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Massive Headline */}
          <h1
            className="text-[34px] xs:text-[38px] sm:text-[52px] md:text-[64px] lg:text-[76px] font-display font-bold tracking-tighter leading-[1.05] mb-5 sm:mb-6 text-zinc-900 dark:text-white z-20 relative px-2 will-change-[transform,opacity]"
          >
            The operating system <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">for your campus.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-[16px] sm:text-[18px] md:text-xl text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-[600px] font-medium leading-[1.6] z-20 relative px-4 will-change-[transform,opacity]"
          >
            Connect with peers, discover rooms, join communities, and explore the marketplace through an intentionally designed platform.
          </p>

          {/* Search Bar & Mobile Buttons */}
          <div className="w-full max-w-[640px] mx-auto z-50 relative mb-12 sm:mb-20 px-2">
            <HeroSearch />

            {/* Mobile Quick Actions */}
            <div className="flex sm:hidden flex-row items-center justify-center gap-3 mt-6">
              <Link to="/auth" className="flex-1">
                <Button className="w-full h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold rounded-xl shadow-sm">
                  Get Started
                </Button>
              </Link>
              <Link to="/about" className="flex-1">
                <Button variant="outline" className="w-full h-11 border-zinc-200 dark:border-white/10 dark:text-zinc-300 font-semibold rounded-xl bg-transparent">
                  Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Glowing Bento Grid App Mockup - Static on Mobile, Animated Perspective on Desktop */}
          <div
            className="relative w-full max-w-[900px] sm:perspective-[2000px] z-10 mt-4 sm:mt-0 px-2 sm:px-4"
          >
            {/* Background Accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[500px] h-[300px] bg-indigo-500/20 blur-[40px] md:blur-[80px] rounded-full pointer-events-none" />

            {/* Modern Mockup Glass Container */}
            <div className="relative rounded-xl sm:rounded-2xl bg-white/80 dark:bg-zinc-900/80 md:bg-white/40 md:dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 shadow-lg sm:shadow-2xl md:backdrop-blur-xl overflow-hidden transform-none sm:transform sm:rotate-x-[3deg] transition-transform hover:rotate-x-0 duration-700 will-change-transform">

              {/* Browser/Window Header */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] dark:opacity-80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] dark:opacity-80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] dark:opacity-80" />
                </div>
                <div className="mx-auto flex-1 max-w-[160px] sm:max-w-[200px] h-5 sm:h-6 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 flex items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium font-mono">CredSwap.in</span>
                </div>
              </div>

              {/* Dashboard Content Grid */}
              <div className="p-3 sm:p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 bg-zinc-50/50 dark:bg-background dark:bg-black/10">
                <div className="col-span-1 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm text-left hover:-translate-y-1 transition-transform">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                    {heroStats?.students.toLocaleString() ?? "0"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-1">Active Students</div>
                </div>

                <div className="col-span-2 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform group text-left hidden sm:flex">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">Engagement</div>
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="flex items-end gap-1.5 sm:gap-2 h-16 sm:h-20 w-full mt-2">
                    {[40, 60, 45, 90, 65, 30, 85].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-400 ${i === 3 ? "bg-indigo-500" : "bg-zinc-200 dark:bg-white/10"}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="col-span-1 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm text-left hover:-translate-y-1 transition-transform">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3 sm:mb-4">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                    {heroStats?.items.toLocaleString() ?? "0"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-1">Marketplace Items</div>
                </div>

                <div className="col-span-2 hidden lg:flex rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm justify-between items-center hover:-translate-y-1 transition-transform group/card">
                  <div className="flex-1 min-w-0 pr-3 text-left">
                    <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wide">Active Groups</div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {heroStats?.groups.toLocaleString() ?? "0"} Communities Joined
                    </div>
                  </div>
                  <Users className="w-8 h-8 shrink-0 text-zinc-300 dark:text-zinc-600 transition-colors group-hover/card:text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background dark:from-black to-transparent pointer-events-none z-10" />
    </section>
  );
}
