import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

dir_path = 'ai-backend/wiki/chunks/football_coaching_chunks_md'
files = [
    'gegenpressing.md', 'goalkeeper_training.md', 'high_defensive_line.md',
    'patterns_formations_styles.md', 'pressing_systems.md', 'set_pieces.md',
    'tactical_analysis.md', 'wing_play.md'
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
