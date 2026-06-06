import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'
files = [
    'late_game.md', 'nba_tactics_and_strategy.md', 'pick_roll_coaching_guide.md',
    'pick_roll_drills_tips.md', 'pick_roll_fundamentals.md', 'player_dev_pdf_1.md',
    'player_dev_pdf_2.md', 'player_dev_principles.md', 'player_dev_program.md',
    'player_dev_usa_curriculum.md'
]

for filename in files:
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f'\n--- {filename} ---')
        print('HEAD:')
        print(''.join(lines[:10]).strip())
        print('\nTAIL:')
        print(''.join(lines[-15:]).strip())
