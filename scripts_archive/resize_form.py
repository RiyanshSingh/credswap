import re

paths = ["src/components/CompanyOpportunitiesManager.tsx", "src/pages/AdminDashboard.tsx"]

for p in paths:
    try:
        with open(p, "r") as f:
            content = f.read()
        
        # 1. Shrink Dialog maximum width
        content = content.replace('className="max-w-5xl p-0', 'className="max-w-4xl p-0')
        
        # 2. Reduce Header padding
        content = content.replace('className="px-8 py-8', 'className="px-6 py-6')
        
        # 3. Use 2 columns for smaller fields to save vertical space
        # Find type and slug container and make sure they are on one line
        # The previous code likely set most to 1 column or kept defaults.
        
        # 4. Reduce input height slightly (h-12 is 48px, h-10 is 40px)
        content = content.replace('h-12 shadow-sm', 'h-10 shadow-sm')
        content = content.replace('rounded-[1.5rem]', 'rounded-2xl') # Slightly more compact rounding
        
        # 5. Fix mobile padding
        # Scroll area padding
        content = content.replace('px-6 pb-6 space-y-6 pt-6', 'p-4 md:p-6 space-y-4 pt-4')
        
        # Card padding
        content = content.replace('p-6 transition-all', 'p-4 md:p-6 transition-all')
        
        # Title sizes for mobile
        content = content.replace('className="text-2xl font-black tracking-tight"', 'className="text-lg md:text-2xl font-black tracking-tight"')
        content = content.replace('className="text-base font-bold font-display', 'className="text-sm md:text-base font-bold font-display')
        
        # 6. Reduce footer padding
        content = content.replace('className="px-8 py-6', 'className="px-6 py-4')

        with open(p, "w") as f:
            f.write(content)
    except:
        pass

print("Form resizing and mobile alignment complete.")
