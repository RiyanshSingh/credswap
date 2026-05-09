import re

files_to_process = [
    "src/components/CompanyOpportunitiesManager.tsx",
    "src/pages/AdminDashboard.tsx"
]

for file_path in files_to_process:
    with open(file_path, "r") as f:
        content = f.read()

    # Find <Textarea ... className="..." />
    # We will just replace 'rounded-xl h-11"' with 'rounded-xl min-h-[100px]"' only when inside <Textarea
    
    # Simple regex to replace h-11 with min-h-[100px] specifically for Textareas
    def replacer(match):
        inner = match.group(1).replace('h-11', 'min-h-[100px]')
        return f'<Textarea{inner}>'

    content = re.sub(r'<Textarea([^>]+)>', replacer, content)

    with open(file_path, "w") as f:
        f.write(content)

print("Textareas fixed.")
