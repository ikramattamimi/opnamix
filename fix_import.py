import sys

# Read the file
with open('components/StockInForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the malformed import
content = content.replace(
    "import { useProducts } from '../hooks/useProducts';\\r\\nimport { Button } from './ui/button';",
    "import { useProducts } from '../hooks/useProducts';\nimport { Button } from './ui/button';"
)

# Write back
with open('components/StockInForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed import statement")
