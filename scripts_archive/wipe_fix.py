import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
    content = f.read()

# I will find the EXACT string esbuild is complaining about.
# Line 1627:14 Unterminated regular expression at '</div>'
# This often happens when there's a '/' used in a way that looks like a regex start.
# E.g. </div>);

# I'll replace '</div>\n    );' with '</div>\n    );' but ensuring no weird characters.

pattern = '</div>\n    \);\n}'
# I suspect maybe there's a hidden char before '</div>' at 1627.

# Let's just find the last return and replace it entirely with a safe version.
# Looking at tail output:
# 1625:                  </DialogContent>
# 1626:              </Dialog>
# 1627:          </div>
# 1628:      );
# 1629:  }

target_block = r'</Dialog>\s+</div>\s+\);\s+\}'
replacement = r'''</Dialog>
        </div>
    );
}'''

content = re.sub(target_block, replacement, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Tail block replaced.")
