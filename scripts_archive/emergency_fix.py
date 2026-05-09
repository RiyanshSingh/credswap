import re

paths = ["src/pages/AdminDashboard.tsx", "src/components/CompanyOpportunitiesManager.tsx"]
trigger_broken = 'TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300"'

for p in paths:
    try:
        with open(p, "r") as f:
            content = f.read()
        
        # 1. Fix the import
        content = content.replace(f'import {{ Tabs, TabsContent, TabsList, {trigger_broken} }}', 
                                  'import { Tabs, TabsContent, TabsList, TabsTrigger }')
        
        # 2. Fix the usage in JSX
        # The script likely replaced all occurrences of TabsTrigger with the broken version
        content = content.replace(f'<{trigger_broken}', f'<TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300"')
        
        with open(p, "w") as f:
            f.write(content)
    except:
        pass

print("Emergency fix applied.")
