import os

dir_path = 'ai-backend/wiki/chunks/basketball_coaching_chunks_md'
files = [
    'closeout_defense.md', 'defense_basics.md', 'defense_concepts.md',
    'defense_schemes.md', 'driblling_and_ball_handling.md',
    'fastbreak_and_transition.md', 'general_drills_30.md',
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
