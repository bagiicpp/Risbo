import os
import re

dir_path = 'ai-backend/wiki/chunks/football_coaching_chunks_md'

# Clean formations.md
filepath = os.path.join(dir_path, 'formations.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'- "Inside PTFC" \(Press release\).*?ISBN 978-1-59164-136-0\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean goalkeeper_training.md
filepath = os.path.join(dir_path, 'goalkeeper_training.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\*\*Source:\*\* https://mypersonalfootballcoach\.com/position-specific-courses/.*?\n\n', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean high_defensive_line.md
filepath = os.path.join(dir_path, 'high_defensive_line.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'If you are interested in more blogs, or in our Strength Ratings and Forecasts, gladly check them out!\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean pressing_systems.md
filepath = os.path.join(dir_path, 'pressing_systems.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'Thank you! Your submission has been received!.*?Oops! Something went wrong while submitting the form\.\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean tactical_analysis.md
filepath = os.path.join(dir_path, 'tactical_analysis.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
# Removing the collaborative article signoff as it behaves like an author bio.
content = re.sub(r'Collaborative article by Addis Worku, Martin Rafelt, René Marić, George Jones & Judah Davies\n*', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Clean wing_play.md
filepath = os.path.join(dir_path, 'wing_play.md')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'You are viewing 1 of your 1 free articles ', '', content, flags=re.DOTALL)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

