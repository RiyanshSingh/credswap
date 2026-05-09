import re

files_to_process = [
    "src/components/CompanyOpportunitiesManager.tsx",
    "src/pages/AdminDashboard.tsx",
    "src/pages/AdminClientsManager.tsx"
]

for file_path in files_to_process:
    try:
        with open(file_path, "r") as f:
            content = f.read()
    except FileNotFoundError:
        continue

    # 1. Dialog Component Overhaul
    # ----------------------------
    # Content
    content = content.replace('className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl"', 
                              'className="max-w-5xl p-0 overflow-hidden bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_100px_-20px_rgba(79,70,229,0.15)] sm:rounded-[2rem]"')
    
    # Header
    content = content.replace('className="px-6 py-6 bg-slate-900 dark:bg-black text-white"',
                              'className="px-8 py-8 bg-gradient-to-br from-indigo-950 via-[#0B1120] to-black text-white relative overflow-hidden border-b border-white/5"')
    
    # Title
    content = content.replace('className="text-xl font-bold"', 'className="text-2xl font-black tracking-tight"')
    
    # Description
    content = content.replace('className="text-slate-400"', 'className="text-indigo-200/70 font-medium"')

    # 2. Section Card Styling
    # -----------------------
    content = content.replace('className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 shadow-sm p-5"',
                              'className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-6 transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-500/20"')
    
    # 3. Form Typography & Labels
    # ---------------------------
    # Section Label (e.g., CORE)
    content = content.replace('className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500"',
                              'className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1"')
    
    # Section Title (e.g., Listing Identity)
    content = content.replace('className="text-sm font-semibold text-slate-900"',
                              'className="text-base font-bold font-display text-slate-900 dark:text-slate-100"')
    content = content.replace('className="text-sm font-semibold text-slate-900 dark:text-white"',
                              'className="text-base font-bold font-display text-slate-900 dark:text-slate-100"')
    
    # 4. Input & Select Field Modernization
    # -------------------------------------
    # Input
    content = content.replace('className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-indigo-500/20"',
                              'className="bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400/50 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-12 shadow-sm uppercase-none"')

    # URL Input variant
    content = content.replace('className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-indigo-500/20 text-xs"',
                              'className="bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11 text-sm shadow-sm"')

    # Select Trigger
    content = content.replace('className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"',
                              'className="bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-12 shadow-sm"')

    # Textarea (handled specifically via regex in next step or here)
    content = re.sub(r'<Textarea([^>]+)rows={(\d+)}([^>]+)className="([^"]+)"', 
                     r'<Textarea\1rows={\2}\3className="min-h-[120px] bg-slate-50/50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-2xl p-4 shadow-sm"', 
                     content)

    # 5. Buttons in Form
    # ------------------
    # Header Toggle Buttons
    content = content.replace('size="sm"\n                                        variant={formData.show_header ? "default" : "outline"}',
                              'size="sm"\n                                        variant={formData.show_header ? "default" : "outline"}\n                                        className="rounded-full px-4 h-8 font-bold text-[10px] uppercase tracking-wider"')

    # 6. Footer Layout
    # ----------------
    content = content.replace('className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"',
                              'className="px-8 py-6 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#070b14]/50 backdrop-blur-md flex items-center justify-between gap-4"')

    with open(file_path, "w") as f:
        f.write(content)

print("Visual upgrade complete.")
