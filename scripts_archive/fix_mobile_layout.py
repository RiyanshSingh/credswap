import re

paths = ["src/components/CompanyOpportunitiesManager.tsx", "src/pages/AdminDashboard.tsx"]

for p in paths:
    try:
        with open(p, "r") as f:
            content = f.read()

        # 1. Dialog Height Constraint (Stop taking full screen if not needed, but keep scrollable)
        # Change max-h-[70vh] to handle mobile better
        content = content.replace('max-h-[70vh]', 'max-h-[80vh] md:max-h-[70vh]')

        # 2. Fix Section Headers (They should wrap nicely on small screens)
        # Ensure 'flex items-center justify-between' is flexible
        content = content.replace('flex items-center justify-between mb-4', 'flex flex-row items-center justify-between gap-4 mb-3 md:mb-4')

        # 3. Label sizes for readability
        content = content.replace('<Label>', '<Label className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">')

        # 4. Input Heights - Make sure h-10 applies everywhere including SelectTrigger
        content = content.replace('h-11 shadow-sm', 'h-10 shadow-sm')
        content = content.replace('h-12 shadow-sm', 'h-10 shadow-sm')
        
        # 5. Dialog Sizing
        # sm:rounded-[2rem] is okay but max-w-4xl is better for desktop, but lets make sure it fits
        content = content.replace('className="max-w-4xl p-0 overflow-hidden', 'className="w-[98vw] md:max-w-4xl p-0 overflow-hidden')

        # 6. Compact the AI buttons for mobile
        content = content.replace('h-8 px-3 rounded-full', 'h-7 px-2.5 rounded-full')
        content = content.replace('text-[10px] tracking-widest', 'text-[9px] tracking-wider')

        with open(p, "w") as f:
            f.write(content)
    except:
        pass

print("Mobile layout refined.")
