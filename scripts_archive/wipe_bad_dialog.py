import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# The broken part is AFTER the main return ends. 
# return ( ... ); } <-- ends at line 467

# Everything between line 467 and line 726 (Dialog start) needs to be cleaned or checked.

# Searching for the specific broken fragment found in the build error:
broken_header_fragment = r'</CardDescription>\s+</CardHeader>'
# If it finds this outside of a proper return, it's bad.

# Actually, I'll just find the "All Applications" card which is definitely misplaced and delete it.
pattern = r'<CardDescription>Global view of all interest submissions\.</CardDescription>.*?</CardContent>\s+</Card>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Misplaced Applications card removed.")
