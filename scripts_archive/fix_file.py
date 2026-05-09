import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
    content = f.read()

# I will find the last '</div>' before the function end and replace it with a string.
# Esbuild thinks line 1627 is a regex.
# 1627:          </div>

# If I change </div> to <div /> or add a space, maybe it helps.
# Or if I replace the entire ending with a clean version.

pattern = r'</Dialog>\s+</div>\s+\);\s+\}'
replacement = r'''</Dialog>
        {" "}
        </div>
    );
}'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Space added before final div closure.")
