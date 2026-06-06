import os
import re

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'

# training_programs_and_strength.md
filepath = os.path.join(dir_path, 'training_programs_and_strength.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r' for the best season of your life.*pay nothing\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# transition_defense.md
filepath = os.path.join(dir_path, 'transition_defense.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\*\*Please do not change the values in the following 4 fields.*?Other Category\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# zone_offense_main.md
filepath = os.path.join(dir_path, 'zone_offense_main.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\*\*Learn more about\*\*\*\*The Complete Zone Offense Blueprint with Ryan Schultz\*\*\*\*!\*\*\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

