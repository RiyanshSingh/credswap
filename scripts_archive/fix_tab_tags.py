import re

paths = ["src/pages/AdminDashboard.tsx", "src/components/CompanyOpportunitiesManager.tsx"]
broken_tag = 'TabsTrigger className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-2.5 font-bold transition-all duration-300"'

for p in paths:
    try:
        with open(p, "r") as f:
            content = f.read()
        
        # Fixing </TabsTrigger className="..."> back to </TabsTrigger>
        content = content.replace(f'</{broken_tag}>', '</TabsTrigger>')
        
        with open(p, "w") as f:
            f.write(content)
    except:
        pass

print("Closing tags fixed.")
