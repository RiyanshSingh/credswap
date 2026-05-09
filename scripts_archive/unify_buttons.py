import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    orig_content = f.read()

# 1. Define the components we need to insert accurately
header_section = '''
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/10 via-white to-indigo-600/5 dark:from-indigo-600/20 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/10 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="relative">
                    <h2 className="text-3xl md:text-4xl font-black font-display text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" />
                        Company Portal
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-3 text-base md:text-lg font-medium max-w-xl">
                        Launch your projects by posting <span className="text-indigo-600 dark:text-indigo-400 font-bold">Internships</span>, <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ambassador roles</span>, or <span className="text-indigo-600 dark:text-indigo-400 font-bold">Swags</span>.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg px-10 h-16 rounded-2xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => openCreate("Internship")}
                >
                    <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Create New Listing
                </Button>
            </div>
'''

# We need to replace the BROKEN block (the extra </td></tr>) and the header at the same time
# The broken block was around line 509. 
# Search for the whole return start that went wrong:

full_broken_block = r'return \(\s+<div className="space-y-8 animate-fade-in">.*?</div>\s+</td>\s+</tr>\s+\);\s+\}\s+return subset\.map'
# This is dangerous. Let's try to just find the core of the return and fix it.

# I will find 'return (' then the DIV, and I'll replace until I hit the map.
# Looking at the view_file, the map is at line 513. 

new_return_start = f'''
    return (
        <div className="space-y-8 animate-fade-in">
{header_section}

            {{sections.map((section) => {{
'''

# The pattern matches from the return down to the map
pattern = r'return \(\s+<div className="space-y-8 animate-fade-in">.*?\{sections\.map\(\(section\)\s+=>\s+\{'
orig_content = re.sub(pattern, new_return_start, orig_content, flags=re.DOTALL)

# Now remove the redundant sectional add buttons
redundant_btn = r'<Button onClick={() => openCreate\(section\.key\)>\s+<Plus className="w-4 h-4 mr-2" /> Add {section\.key}\s+</Button>'
# Since the prev regex might have failed due to syntax, let's just find and replace standard string
content = orig_content.replace('<Button onClick={() => openCreate(section.key)}>\n                                <Plus className="w-4 h-4 mr-2" /> Add {section.key}\n                            </Button>', '')

with open(file_path, "w") as f:
    f.write(content)

print("Final Unified CTA fix applied.")
