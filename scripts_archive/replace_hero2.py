with open("src/pages/Index.tsx", "r") as f:
    lines = f.readlines()

new_content = """      {/* Responsive SaaS Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-[#060608] pt-24 pb-16 md:pt-32 md:pb-32 border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-40 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 rounded-full blur-[100px]" />
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 w-full flex flex-col items-center">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto w-full">
            
            {/* Release Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[12px] sm:text-[13px] font-medium text-zinc-600 dark:text-zinc-300 mb-6 sm:mb-8 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer group shadow-sm z-20 relative"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="tracking-tight">Campulsy OS 2.0 is live</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.div>

            {/* Massive Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[40px] sm:text-[52px] md:text-[64px] lg:text-[76px] font-display font-bold tracking-tighter leading-[1.05] mb-5 sm:mb-6 text-zinc-900 dark:text-white z-20 relative px-2"
            >
              The operating system <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">for your campus.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[16px] sm:text-[18px] md:text-xl text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-[600px] font-medium leading-[1.6] z-20 relative px-4"
            >
              Connect with peers, organize your notes, track attendance, and discover campus opportunities through an intentionally designed platform.
            </motion.p>

            {/* Search Bar & Mobile Buttons */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="w-full max-w-[640px] mx-auto z-50 relative mb-12 sm:mb-20 px-2"
            >
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
            </motion.div>

            {/* Glowing Bento Grid App Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="relative w-full max-w-[900px] perspective-[2000px] z-10 mt-4 sm:mt-0 px-2 sm:px-4"
            >
               {/* Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#060608] dark:via-[#060608]/80 to-transparent bottom-0 h-2/3 z-20 pointer-events-none" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[500px] h-[300px] bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

               {/* Modern Mockup Glass Container */}
               <div className="relative rounded-xl sm:rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden transform sm:rotate-x-[3deg] transition-transform hover:rotate-x-0 duration-700">
                  
                  {/* Browser/Window Header */}
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
                    <div className="flex gap-1.5 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    </div>
                    <div className="mx-auto flex-1 max-w-[160px] sm:max-w-[200px] h-5 sm:h-6 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 flex items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium font-mono">campulsy.app</span>
                    </div>
                  </div>

                  {/* Dashboard Content Grid */}
                  <div className="p-3 sm:p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 bg-zinc-50/50 dark:bg-black/10">
                     
                     <div className="col-span-1 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm text-left hover:-translate-y-1 transition-transform">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3 sm:mb-4">
                         <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                       </div>
                       <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">50k+</div>
                       <div className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-1">Active Students</div>
                     </div>

                     <div className="col-span-2 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform group text-left hidden sm:flex">
                        <div className="flex items-center justify-between mb-2">
                           <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">Engagement</div>
                           <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div className="flex items-end gap-1.5 sm:gap-2 h-16 sm:h-20 w-full mt-2">
                           {[40, 60, 45, 90, 65, 30, 85].map((h, i) => (
                             <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-400 ${i === 3 ? "bg-indigo-500" : "bg-zinc-200 dark:bg-white/10"}`} style={{ height: f"{h}%" }} />
                           ))}
                        </div>
                     </div>

                     <div className="col-span-1 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm text-left hover:-translate-y-1 transition-transform">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3 sm:mb-4">
                         <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                       </div>
                       <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">10k+</div>
                       <div className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-1">Study Resources</div>
                     </div>

                     {/* Extra App Data point for wide layouts */}
                     <div className="col-span-2 hidden lg:flex rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 p-3 sm:p-5 shadow-sm justify-between items-center hover:-translate-y-1 transition-transform">
                        <div>
                           <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wide">Next Event</div>
                           <div className="text-sm font-semibold text-zinc-900 dark:text-white">Campus Tech Fest '24</div>
                        </div>
                        <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                     </div>

                  </div>
               </div>
            </motion.div>

          </div>
        </div>
      </section>
"""

lines[286:454] = [new_content.replace('f"{h}%"', '`${h}%`') + "\n"]

with open("src/pages/Index.tsx", "w") as f:
    f.writelines(lines)
