import os
import re

search_dir = r"C:\Users\ASUS\Documents\GitHub\phoneswitchhub\src"
keywords = ["payout", "commission", "margin", "stock", "settlement", "정산", "재고", "마진"]

results = []

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.json')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for idx, line in enumerate(lines):
                        for kw in keywords:
                            if re.search(r'\b' + re.escape(kw) + r'\b', line, re.IGNORECASE) or kw in line:
                                relative_path = os.path.relpath(filepath, search_dir)
                                results.append((relative_path, idx + 1, line.strip(), kw))
                                break
            except Exception as e:
                pass

# Print top 100 results
print(f"Total matches: {len(results)}")
for r in results[:100]:
    print(f"File: {r[0]} | Line {r[1]} [{r[3]}]: {r[2][:120]}")
