import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "rb") as f:
    content = f.read().decode('utf-8', 'ignore')

# I will find the EXACT string near the end that esbuild hates.
# Esbuild says line 1242:14 Unterminated regular expression at '</div>'

# Let's search for '</div>' followed by ');'
pattern = '</div>\r?\n\s+\);\r?\n\}'
# If that looks weird, I'll just find the last 3 tags and redo them.

# Actually, esbuild might be confused by a preceding unclosed string or tag.
# I'll replace the block from </Dialog> to the end of the function with hardcoded clean code.

# First find </Dialog>
target = '</Dialog>'
idx = content.rfind(target)
if idx != -1:
    tail = content[idx:]
    new_tail = '</Dialog>\n        </div>\n    );\n}\n\n// --- BLOG & NEWS MANAGER ---'
    content = content[:idx] + new_tail
    with open(file_path, "w") as f:
        f.write(content)
    print("Function tail reset with raw string.")
else:
    print("Dialog tag not found.")

