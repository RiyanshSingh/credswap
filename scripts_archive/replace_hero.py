with open("src/pages/Index.tsx", "r") as f:
    lines = f.readlines()

new_content = """      {/* Hardcore Two-Column MNC/SaaS Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-[#060608] min-h-[92vh] flex items-center pt-24 pb-16 border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 rounded-full blur-[100px]" />
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 w-full mt-8 md:mt-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-[1400px] mx-auto">
            
            {/* Left Column: Copy & Conversions */}
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5 }}
               className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
            >
              {/* Release Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[13px] font-medium text-zinc-600 dark:text-zinc-300 mb-8 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer group shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="tracking-tight">Campulsy OS 2.0 is now live</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Massive Headline */}
              <h1 className="text-[46px] sm:text-[56px] md:text-[68px] lg:text-[76px] font-display font-semibold tracking-tighter leading-[1.05] mb-6 text-zinc-900 dark:text-white">
                The operating system <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">for your campus.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-[540px] font-medium leading-[1.6]">
                Connect with peers, organize your notes, track attendance, and discover exclusive campus opportunities through an intentionally designed, unified platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center lg:justify-start">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-[52px] px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[15px] font-semibold tracking-tight rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.12)] transition-all hover:scale-[1.02]">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-[52px] px-8 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 text-[15px] font-semibold tracking-tight rounded-xl bg-transparent transition-all">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> View Features
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 text-[13px] md:text-sm text-zinc-500 font-medium pb-8 lg:pb-0">
                <div className="flex -space-x-2.5">
                  <img className="w-9 h-9 rounded-full border-2 border-white dark:border-[#060608] shadow-sm" src="https://i.pravatar.cc/100?img=11" alt="Student" />
                  <img className="w-9 h-9 rounded-full border-2 border-white dark:border-[#060608] shadow-sm" src="https://i.pravatar.cc/100?img=32" alt="Student" />
                  <img className="w-9 h-9 rounded-full border-2 border-white dark:border-[#060608] shadow-sm" src="https://i.pravatar.cc/100?img=43" alt="Student" />
                </div>
                <p>Trusted by <strong className="text-zinc-900 dark:text-zinc-200">50,000+</strong> students globally.</p>
              </div>
            </motion.div>

            {/* Right Column: High-End UI Mockup */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95, rotateY: 10, x: 20 }}
               animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
               transition={{ duration: 0.7, delay: 0.2 }}
               className="relative lg:ml-auto w-full max-w-[600px] perspective-[2000px] hidden lg:block"
            >
              {/* Glass Mockup Container */}
              <div className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transform lg:rotate-y-[-8deg] lg:rotate-x-[5deg] transition-transform hover:rotate-0 duration-700 hover:shadow-[0_30px_60px_rgba(79,70,229,0.2)]">
                
                {/* Mockup Top Bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/80" />
                  </div>
                  <div className="mx-auto w-1/2 h-6 md:h-7 rounded-md bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center shadow-sm">
                    <span className="text-[10px] md:text-[11px] text-zinc-500 font-mono font-medium">campulsy.app/dashboard</span>
                  </div>
                </div>

                {/* Mockup Body */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  
                  {/* Embedded Hero Search Component! */}
                  <div className="w-full relative pointer-events-auto shadow-sm overflow-hidden bg-white dark:bg-transparent rounded-lg">
                     <HeroSearch />
                  </div>

                  {/* Mock Data Grid */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 p-4 space-y-3">
                      <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">Safe</span>
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">78%</div>
                        <div className="text-[11px] md:text-xs text-zinc-500 mt-1 font-medium tracking-wide uppercase">Current Attendance</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 p-4 space-y-3">
                      <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] md:text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">New</span>
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">1.2k</div>
                        <div className="text-[11px] md:text-xs text-zinc-500 mt-1 font-medium tracking-wide uppercase">Recent Notes</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mock Chart / Activity */}
                  <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[13px] font-semibold text-zinc-900 dark:text-white">Weekly Activity</div>
                      <Sparkles className="w-4 h-4 text-zinc-400" />
                    </div>
                    {/* Abstract Bar Chart */}
                    <div className="flex items-end gap-2 h-16 md:h-20 max-w-sm">
                       {[40, 70, 45, 90, 65, 30, 85].map((h, i) => (
                         <div key={i} className={`flex-1 rounded-sm w-full transition-all hover:opacity-80 ${i === 3 ? "bg-indigo-500" : "bg-zinc-200 dark:bg-white/10"}`} style={{ height: f"{h}%" }} />
                       ))}
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Floating Decorative Elements */}
              <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 md:p-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-2xl flex items-center gap-3 backdrop-blur-xl z-20 pointer-events-none"
              >
                 <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div>
                    <div className="text-[13px] md:text-sm font-bold text-zinc-900 dark:text-white leading-tight">Assignment Marked</div>
                    <div className="text-[10px] md:text-xs text-zinc-500 font-medium">Just now</div>
                 </div>
              </motion.div>

              <motion.div 
                 animate={{ y: [0, 10, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                 className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 md:p-3 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-2xl flex items-center gap-2.5 backdrop-blur-xl z-20 pointer-events-none"
              >
                 <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div>
                    <div className="text-[11px] md:text-xs font-bold text-zinc-900 dark:text-white leading-tight">+3 Community Joins</div>
                 </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>
"""

lines[286:363] = [new_content + "\n"]

with open("src/pages/Index.tsx", "w") as f:
    f.writelines(lines)
