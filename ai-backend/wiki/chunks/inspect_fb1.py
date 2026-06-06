import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

dir_path = 'ai-backend/wiki/chunks/football_coaching_chunks_md'
files = [
    'attacking_principles.md', 'defensive_transition.md', 'drills_123_collections.md',
    'drills_40_best.md', 'drills_academies_preseason.md', 'drills_passing.md',
    'drills_session_platforms.md', 'drills_sessions_fitness.md', 'formations.md'
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
