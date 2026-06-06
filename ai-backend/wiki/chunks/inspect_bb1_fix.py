import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'
files = [
    'general_drills_30.md',
    'general_drills_overview.md', 'general_drills_usa.md', 'half_court_offense.md'
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
