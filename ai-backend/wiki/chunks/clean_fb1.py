import os
import re

dir_path = 'ai-backend/wiki/chunks/football_coaching_chunks_md'

# Clean attacking_principles.md
filepath = os.path.join(dir_path, 'attacking_principles.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Available in Full Colour Print and eBook!.*?info@soccertutor\.com\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean defensive_transition.md
filepath = os.path.join(dir_path, 'defensive_transition.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'## Get Personalised Advice.*?Try FootballGPT Free\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean drills_123_collections.md
filepath = os.path.join(dir_path, 'drills_123_collections.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'UltimateplayerHQ is Designed to Help Coaches Reach Their Full Potential.*?See all the benefits of our membership today\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean drills_academies_preseason.md
filepath = os.path.join(dir_path, 'drills_academies_preseason.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\[\]\(https://www\.soccerdrive\.com/soccer-drills\).*?Category drop down will go here\.\n*', '', content, flags=re.DOTALL)
content = re.sub(r'★★★★★ "Excellent - Very useful for better understanding in periodization of warm ups and training sessions".*?by world leading professional coaches\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean drills_session_platforms.md
filepath = os.path.join(dir_path, 'drills_session_platforms.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'## Explore Our\n*Practices & Sessions Easily search through.*?graphic coaching points and HD footage\.\n*', '', content, flags=re.DOTALL)
content = re.sub(r'Browse the world\'s leading library of professional coaching session plans.*? delivered direct to you from the coach\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean drills_sessions_fitness.md
filepath = os.path.join(dir_path, 'drills_sessions_fitness.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Features Club Management\n*Sports Development Sports\n*Resources en\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

