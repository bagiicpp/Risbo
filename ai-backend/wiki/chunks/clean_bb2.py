import os
import re

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'

# Clean pick_roll_drills_tips.md
filepath = os.path.join(dir_path, 'pick_roll_drills_tips.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Check out more coach.*?Nike Basketball Camp\.', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean player_dev_program.md
filepath = os.path.join(dir_path, 'player_dev_program.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'- Home\n- Blog\n- Player Development\n- The Complete Guide to Basketball Player Development\n*', '', content)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

