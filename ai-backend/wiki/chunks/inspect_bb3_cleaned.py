import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'
files = [
    'post_moves_and_paint_game.md', 'rebounding_drills.md',
    'shooting_drills_team_tips.md', 'training_programs_and_strength.md',
    'transition_defense.md', 'zone_offense_main.md',
    'zone_offense_tactics.md'
]

for filename in files:
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f'\n--- {filename} ---')
        print('TAIL:')
        print(''.join(lines[-15:]).strip())
