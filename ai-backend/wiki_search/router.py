"""
Folder routing for the Risbo wiki search.

Pure Python, zero LLM calls. Decides WHICH wiki chunk folders to search based on
the user's onboarding profile (role + sport + focus) and, secondarily, keywords
found in the (already English) query.

Onboarding values mirror the frontend (OnboardingPage.tsx):
  role  : "coach" | "athlete" | "scout" | "analyst"
  sport : list of "football" | "basketball"
  focus : list of "tactics" | "player_analysis" | "training" | "scouting" | "nutrition"
"""

# Sport-agnostic folders (shared across every sport)
_NUTRITION = "sports_nutrition_chunks_md"
_ATHLETICISM = "athleticism_coaching_chunks_md"

# Every wiki chunk folder — used as the ultimate fallback
ALL_FOLDERS = [
    "basketball_coaching_chunks_md",
    "basketball_scouting_chunks_md",
    "football_coaching_chunks_md",
    "football_scouting_chunks_md",
    _NUTRITION,
    _ATHLETICISM,
]


def _sport_folders(sport: str, role: str) -> list[str]:
    """Ordered folder priority for a single sport + role. First = highest priority."""
    coaching = f"{sport}_coaching_chunks_md"
    scouting = f"{sport}_scouting_chunks_md"

    if role == "coach":
        return [coaching, scouting, _NUTRITION, _ATHLETICISM]
    if role == "athlete":
        return [coaching, _NUTRITION, _ATHLETICISM]
    if role in ("scout", "analyst"):
        return [scouting, coaching]
    # Unknown role but known sport
    return [coaching, scouting, _NUTRITION, _ATHLETICISM]


# Focus option -> the folder it should boost (sport filled in per selected sport;
# nutrition/athleticism are sport-agnostic).
_FOCUS_BOOST = {
    "tactics": "{sport}_coaching_chunks_md",
    "player_analysis": "{sport}_scouting_chunks_md",
    "scouting": "{sport}_scouting_chunks_md",
    "training": _ATHLETICISM,
    "nutrition": _NUTRITION,
}


# Secondary signal: keyword -> folder. Lifted from search_plan.md and trimmed.
FOLDER_KEYWORDS = {
    "basketball_coaching_chunks_md": [
        "basketball", "dribble", "dribbling", "shoot", "shooting", "defense",
        "offense", "drill", "drills", "play", "plays", "coach", "coaching",
        "transition", "fastbreak", "pick", "screen", "closeout", "zone",
        "man-to-man", "press", "trap", "rebound", "post", "guard", "forward",
        "nba", "court",
    ],
    "basketball_scouting_chunks_md": [
        "scout", "scouting", "opponent", "report", "tendency", "tendencies",
        "film", "breakdown", "matchup", "prospect", "draft",
    ],
    "football_coaching_chunks_md": [
        "football", "soccer", "formation", "pressing", "possession", "tactic",
        "tactics", "striker", "midfielder", "defender", "goalkeeper", "winger",
        "corner", "freekick", "offside", "buildup", "counter", "gegenpressing",
    ],
    "football_scouting_chunks_md": [
        "talent", "recruitment", "transfer", "monchi", "moneyball",
    ],
    _NUTRITION: [
        "nutrition", "diet", "eat", "eating", "protein", "carb", "carbs",
        "calorie", "calories", "supplement", "creatine", "hydration", "water",
        "meal", "food", "fat", "macro", "macros", "vitamin", "caffeine",
    ],
    _ATHLETICISM: [
        "speed", "sprint", "sprinting", "strength", "power", "jump", "jumping",
        "agility", "vo2", "endurance", "conditioning", "plyometric", "vertical",
        "mobility", "flexibility", "warmup", "explosive", "acceleration",
        "recovery", "injury", "rehab", "periodization",
    ],
}


def _dedup(folders: list[str]) -> list[str]:
    """Remove duplicates while preserving first-seen order."""
    seen: set[str] = set()
    out: list[str] = []
    for f in folders:
        if f not in seen:
            seen.add(f)
            out.append(f)
    return out


def route(
    english_query: str,
    role: str | None = None,
    sports: list[str] | None = None,
    focus: list[str] | None = None,
) -> list[str]:
    """
    Returns an ordered list of folders to search.
    Profile folders (sport + role) come first, then focus boosts, then any extra
    folders surfaced by query keywords. Falls back to every folder if nothing matches.
    """
    role = (role or "").lower().strip()
    sports = [s.lower().strip() for s in (sports or []) if s]
    focus = [f.lower().strip() for f in (focus or []) if f]

    folders: list[str] = []

    # Layer 1: profile (sport x role)
    for sport in sports:
        if sport in ("basketball", "football"):
            folders.extend(_sport_folders(sport, role))

    # Layer 2: focus boosts (resolved per selected sport; sport-agnostic ones pass through)
    for f in focus:
        template = _FOCUS_BOOST.get(f)
        if not template:
            continue
        if "{sport}" in template:
            for sport in sports:
                if sport in ("basketball", "football"):
                    folders.append(template.format(sport=sport))
        else:
            folders.append(template)

    # Layer 3: keyword-matched folders (dopuna)
    query_words = set(english_query.lower().split())
    for folder, keywords in FOLDER_KEYWORDS.items():
        if query_words & set(keywords):
            folders.append(folder)

    folders = _dedup(folders)

    # Fallback: nothing matched -> search everything
    if not folders:
        return list(ALL_FOLDERS)

    return folders
