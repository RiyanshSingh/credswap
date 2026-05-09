import re

files_to_process = [
    "src/components/CompanyOpportunitiesManager.tsx",
    "src/pages/AdminDashboard.tsx"
]

for file_path in files_to_process:
    with open(file_path, "r") as f:
        content = f.read()

    # Fix card container
    old_card = 'className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 shadow-sm p-5"'
    new_card = 'className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl shadow-lg p-6 transition-all duration-300"'
    content = content.replace(old_card, new_card)

    # Fix Section Titles which are pure text-slate-900 making them invisible in dark mode (from screenshot)
    # The header title currently is 'text-sm font-semibold text-slate-900'
    old_section_title = 'className="text-sm font-semibold text-slate-900"'
    new_section_title = 'className="text-base font-bold font-display text-slate-900 dark:text-slate-100"'
    content = content.replace(old_section_title, new_section_title)

    # Fix Section subheader
    old_section_sub = 'className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500"'
    new_section_sub = 'className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1"'
    content = content.replace(old_section_sub, new_section_sub)

    # Fix generic Input styles
    old_input = 'className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-indigo-500/20"'
    new_input = 'className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11"'
    content = content.replace(old_input, new_input)
    
    # Fix SelectTrigger styles
    content = content.replace('SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"',
                              'SelectTrigger className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 rounded-xl h-11"')

    # Fix the banner image input
    content = content.replace('className="cursor-pointer bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white file:cursor-pointer file:bg-indigo-50 dark:file:bg-indigo-900/40 file:text-indigo-700 dark:file:text-indigo-300 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:font-semibold hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60"',
                              'className="cursor-pointer bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl file:cursor-pointer file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-600 dark:file:text-indigo-400 file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-3 file:font-bold hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/20 file:h-full file:mt-[-8px]"')
    
    # URL paste input which uses text-xs
    old_url_input = 'className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-indigo-500/20 text-xs"'
    new_url_input = 'className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-300 rounded-xl h-11 text-sm"'
    content = content.replace(old_url_input, new_url_input)
    
    with open(file_path, "w") as f:
        f.write(content)

