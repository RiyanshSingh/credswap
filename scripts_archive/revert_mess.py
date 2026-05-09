import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Undo my bad transformations
content = content.replace('dark : ', 'dark:')
content = content.replace('focus : ', 'focus:')
content = content.replace(' / ', '/')
content = content.replace(' : ', ':')

with open(file_path, "w") as f:
    f.write(content)

print("Bad sanitization reverted.")
