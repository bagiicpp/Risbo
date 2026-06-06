import os
import re

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'

# Clean general_drills_30.md
filepath = os.path.join(dir_path, 'general_drills_30.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\[thrive_leads id=\’\d+\’\]', '', content)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean general_drills_usa.md
filepath = os.path.join(dir_path, 'general_drills_usa.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Choose team Team Prev Slide Next Slide.*?Open Search Search Search Close Search\n*Open Menu\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean closeout_defense.md
filepath = os.path.join(dir_path, 'closeout_defense.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Free eBooks Free eBooks\n*Coaching Resources Coaching Resources\n*Player Resources Player Resources\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
