import sys

file_path = "src/components/CompanyOpportunitiesManager.tsx"
with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
    content = f.read()

def check_balance(text):
    stack = []
    pairs = { '}': '{', ')': '(', ']': '[' }
    in_str = False
    quote = None
    escaped = False
    in_jsx_expr = 0
    
    i = 0
    while i < len(text):
        c = text[i]
        
        if in_str:
            if c == quote and not escaped:
                in_str = False
            escaped = (c == '\\' and not escaped)
        else:
            if c in '"\'`':
                in_str = True
                quote = c
            elif c in '{(':
                stack.append((c, i))
            elif c in '})':
                if not stack:
                    print(f"Extra closing '{c}' at position {i}")
                    # Print context
                    print(text[max(0, i-50):min(len(text), i+50)])
                else:
                    last, start_pos = stack.pop()
                    if pairs[c] != last:
                        print(f"Mismatch: '{last}' at {start_pos} closed by '{c}' at {i}")
                        print(text[max(0, start_pos-20):min(len(text), start_pos+20)])
                        print("---")
                        print(text[max(0, i-20):min(len(text), i+20)])
        i += 1
    
    if stack:
        for char, pos in stack:
            print(f"Unclosed '{char}' at position {pos}")
            # Print context
            snippet = text[max(0, pos-40):min(len(text), pos+40)]
            print(f"Context: {snippet}")

check_balance(content)
