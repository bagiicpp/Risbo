import os
import re

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'

# post_moves_and_paint_game.md
filepath = os.path.join(dir_path, 'post_moves_and_paint_game.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'#### \*\*100\+ Workouts.*?\n#### For Ages 11 and Up\n*', '', content, flags=re.DOTALL)
content = re.sub(r'_The previous clips can be seen on Championship Productions’ DVD.*?click here._\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# rebounding_drills.md
filepath = os.path.join(dir_path, 'rebounding_drills.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\[\]\(https://jr\.nba\.com/video/.*?\n*', '', content, flags=re.DOTALL)
content = re.sub(r'NBA Organization\n*NBA Social Impact Across The League\n*Shop Subscriptions\n*If you are having difficulty accessing any content on this website, please visit ourAccessibility page.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# shooting_drills_team_tips.md
filepath = os.path.join(dir_path, 'shooting_drills_team_tips.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'There are \*\*6 more drills in\*\*the complete article in the members section.*?This could also be a good pre-game warm-up drill\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# training_programs_and_strength.md
filepath = os.path.join(dir_path, 'training_programs_and_strength.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Give this week of training a try first, or jump right into the \*Built 2 Ball training.*?\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# transition_defense.md
filepath = os.path.join(dir_path, 'transition_defense.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'## _FREE BONUS PDF_.*?Other Category\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# zone_offense_main.md
filepath = os.path.join(dir_path, 'zone_offense_main.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'## _FREE BONUS PDF_.*?## Zone Offense Comprehensive Resource\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# zone_offense_tactics.md
filepath = os.path.join(dir_path, 'zone_offense_tactics.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Ihope the ideas Ihave given here are found to be useful\..*?where all content is 100% free\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

