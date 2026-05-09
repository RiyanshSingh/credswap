import re

file_path = "src/pages/AdminDashboard.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Polish Tabs Appearance
tabs_list_old = 'TabsList className="grid grid-cols-4"'
tabs_list_new = 'TabsList className="grid grid-cols-4 p-1.5 bg-slate-100/50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-inner h-auto"'
content = content.replace(tabs_list_old, tabs_list_new)

tabs_trigger_old = 'TabsTrigger'
tabs_trigger_new = 'TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300"'
# Replace only the triggers that follow the new list
content = content.replace('TabsTrigger', tabs_trigger_new)

# 2. Add AI logic highlights
ai_btn = 'className="h-8 px-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"'
ai_btn_new = 'className="h-8 px-3 rounded-full text-indigo-600 dark:text-indigo-400 font-black text-[10px] tracking-widest hover:bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm transition-all duration-300"'
content = content.replace(ai_btn, ai_btn_new)

# Apply to Company Dashboard as well
with open(file_path, "w") as f:
    f.write(content)

file_path_comp = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path_comp, "r") as f:
    content_comp = f.read()
content_comp = content_comp.replace(ai_btn, ai_btn_new)
with open(file_path_comp, "w") as f:
    f.write(content_comp)

print("Final polish applied.")
