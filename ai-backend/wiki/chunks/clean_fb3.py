import os
import re

filepath = 'ai-backend/wiki/chunks/football_coaching_chunks_md/goalkeeper_training.md'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove adidas promotional stuff
content = re.sub(r'Powered and protected by\n*', '', content, flags=re.DOTALL)
# Remove My Personal Football Coach stuff
content = re.sub(r'1on1 Technical Soccer Coaching, Elite football training programme.*?every striker needs in their locker\.\n*', '', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

