import re

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Pattern to find and remove the Section Visibility card
# It starts at <Card className="border-border/50 shadow-sm"> and contains "Section Visibility"
# Just before {sections.map((section) => {

start_str = '<Card className="border-border/50 shadow-sm">'
middle_str = '<CardTitle>Section Visibility</CardTitle>'
end_str = '</Card>'

# We need to find the specific Card that has Section Visibility
pattern = r'<Card className="border-border/50 shadow-sm">\s*<CardHeader>\s*<CardTitle>Section Visibility</CardTitle>.*?</Card>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)

print("Section Visibility feature removed for clients.")
