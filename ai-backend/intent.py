"""
Lightweight keyword-based intent classifier.
Routes web search queries to the appropriate DDGS backend.

Returns one of:
  "stats"    → DDGS.text()  — player stats, standings, records
  "news"     → DDGS.news()  — transfers, results, injuries, latest
  "training" → DDGS.text()  — methodology, biomechanics, nutrition
  "general"  → DDGS.text()  — fallback for anything else
"""
import re

_STATS_TOKENS = {
    "stats", "statistics", "xg", "goals", "assists", "appearances",
    "minutes", "ppg", "standings", "table", "position", "scorer",
    "rating", "ratings", "season", "career", "per90", "p90", "shots",
    "passes", "tackles", "interceptions", "dribbles", "saves",
    "cleansheets", "rebounds", "steals", "blocks", "points",
    "value", "salary", "wages", "ranked", "ranking", "h2h",
    "versus", "record", "average", "total", "tally", "percentage",
    "wins", "losses", "draws", "goals_scored", "goals_conceded",
    # BCS/HR/SR keywords
    "tabela", "poredak", "bodovi", "stanje", "liga", "ligu",
    "strijelci", "strijelac", "strelac", "strijelaca",
    "rezultat", "rezultati", "utakmica", "utakmice",
    "prvak", "prvaci", "relegacija", "pozicija", "sezona",
}

_NEWS_TOKENS = {
    "news", "latest", "recent", "today", "tonight", "yesterday",
    "transfer", "signed", "signing", "moved", "joined", "deal",
    "injury", "injured", "return", "comeback", "ban", "suspension",
    "sacked", "fired", "resigned", "appointed", "hired",
    "confirmed", "official", "announced", "breaking",
    "result", "score", "won", "lost", "draw", "final",
    "semifinal", "playoff", "cup", "upcoming", "fixture",
    "rumor", "rumour", "linked", "target", "arrested", "controversy",
}

_TRAINING_TOKENS = {
    "training", "workout", "exercise", "drill", "programme", "program",
    "strength", "speed", "agility", "endurance", "conditioning",
    "nutrition", "diet", "protein", "calories", "carbs", "macros",
    "sprint", "jump", "squat", "bench", "deadlift", "vo2", "hrv",
    "rehab", "rehabilitation", "biomechanics", "technique", "form",
    "periodization", "recovery", "warm", "cooldown",
}


def classify_intent(query: str) -> str:
    """
    Classifies a search query's intent.
    Returns "stats" | "news" | "training" | "general".
    On tie: stats > news > training > general.
    """
    tokens = set(re.sub(r"[^\w\s]", " ", query.lower()).split())

    s = len(tokens & _STATS_TOKENS)
    n = len(tokens & _NEWS_TOKENS)
    t = len(tokens & _TRAINING_TOKENS)

    if s == 0 and n == 0 and t == 0:
        return "general"
    if s >= n and s >= t:
        return "stats"
    if n >= t:
        return "news"
    return "training"
