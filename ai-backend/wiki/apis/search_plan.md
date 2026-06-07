# Risbo Wiki Search System — Technical Plan v2

## Overview

Local-first knowledge retrieval system for Risbo sports AI assistant.
Searches curated `.md` wiki files before falling back to web search.
Uses user's onboarding profile to prioritize relevant folders.
Gemma 4 (via Ollama) generates the final answer.

---

## Stack

- **Language:** Python
- **Search:** `rank_bm25` library (BM25Okapi) — no LLM needed
- **Translation:** Gemma 4 via Ollama (short call)
- **Router:** Pure Python — keyword mapping + onboarding profile, no LLM
- **Answer generation:** Gemma 4 via Ollama
- **Web fallback:** DDGS (already integrated in Risbo)

---

## File Structure

```
risbo/
├── wiki/
│   ├── basketball_coaching_chunks_md/
│   ├── basketball_scouting_chunks_md/
│   ├── football_coaching_chunks_md/
│   ├── football_scouting_chunks_md/
│   ├── sports_nutrition_chunks_md/
│   └── athleticism_coaching_chunks_md/
├── wiki_search/
│   ├── __init__.py
│   ├── router.py        # keyword mapping + onboarding profile → folder selection
│   ├── searcher.py      # BM25 index + search logic
│   ├── translator.py    # query → English via Gemma 4
│   └── pipeline.py      # orchestrates all steps
```

---

## Step 0 — BEFORE WRITING CODE: Read Onboarding Options

**Claude Code must do this first before implementing router.py.**

1. Find the onboarding files in the Risbo project. Look in:
   - Frontend: components with names like `Onboarding`, `AccountSetup`, `ProfileSetup`
   - Backend: models/schemas with fields like `role`, `sport`, `position`, `level`
   - Database: user table/collection for profile fields

2. List every possible value for each onboarding field:
   - What roles can a user pick? (e.g. player, coach, analyst, fan...)
   - What sports? (basketball, football, both...)
   - Any other relevant fields? (position, age group, professional level...)

3. Build `ROLE_FOLDER_PRIORITY` using this exact template:

```python
# TEMPLATE — fill in based on what you find in onboarding
# Every role+sport combination gets its own entry
# Folder order matters — first = highest priority in BM25

ROLE_FOLDER_PRIORITY = {
    # FORMAT: "sport_role" : [ordered list of wiki folders]

    "basketball_player": [
        "basketball_coaching_chunks_md",    # tactics they face/use
        "sports_nutrition_chunks_md",       # diet, recovery
        "athleticism_coaching_chunks_md",   # speed, strength, conditioning
    ],
    "basketball_coach": [
        "basketball_coaching_chunks_md",    # primary — drills, plays, tactics
        "basketball_scouting_chunks_md",    # opponent analysis
        "sports_nutrition_chunks_md",       # player nutrition management
        "athleticism_coaching_chunks_md",   # conditioning programs
    ],
    "basketball_analyst": [
        "basketball_scouting_chunks_md",    # primary — scouting reports
        "basketball_coaching_chunks_md",    # tactical context
    ],
    "football_player": [
        "football_coaching_chunks_md",
        "sports_nutrition_chunks_md",
        "athleticism_coaching_chunks_md",
    ],
    "football_coach": [
        "football_coaching_chunks_md",
        "football_scouting_chunks_md",
        "sports_nutrition_chunks_md",
        "athleticism_coaching_chunks_md",
    ],
    "football_analyst": [
        "football_scouting_chunks_md",
        "football_coaching_chunks_md",
    ],

    # ADD more combinations based on what you find in onboarding
    # If onboarding has "both sports" option, add combined entries
    # If onboarding has "general" or no sport selected, use:
    "general": [
        "sports_nutrition_chunks_md",
        "athleticism_coaching_chunks_md",
        "basketball_coaching_chunks_md",
        "football_coaching_chunks_md",
    ],
}

# KEY NAMING CONVENTION: always "sport_role" lowercase with underscore
# If user has no sport selected yet: use "general"
# If sport is known but role is unknown: use "sport_general"
```

---

## Step 1 — Query Translation (translator.py)

**What:** Translate query to English before searching wiki.
**Why:** All `.md` files are in English. BM25 keyword matching requires same language.
**Who:** Gemma 4 — but ONLY if query is not already English (saves latency).
**Note:** Save the original query — needed later for web search and final answer.

```python
from langdetect import detect

def translate_if_needed(query: str) -> tuple[str, str]:
    """
    Returns (original_query, english_query).
    If already English, both are the same string.
    """
    try:
        lang = detect(query)
    except:
        lang = "en"  # default to english if detection fails

    if lang == "en":
        return query, query

    prompt = f"Translate to English. Return ONLY the translation, nothing else:\n{query}"
    english = call_gemma(prompt)
    return query, english
```

---

## Step 2 — Router (router.py)

**What:** Decide which wiki folders to search.
**How:** Two layers combined — onboarding profile (primary) + keyword matching (secondary).
**Who:** Pure Python, zero LLM calls.

```python
FOLDER_KEYWORDS = {
    "basketball_coaching_chunks_md": [
        "basketball", "dribble", "dribbling", "shoot", "shooting", "defense",
        "offense", "drill", "drills", "play", "plays", "coach", "coaching",
        "transition", "fastbreak", "pick", "screen", "closeout", "zone",
        "man-to-man", "press", "trap", "rebound", "post", "guard", "forward",
        "nba", "half court", "full court"
    ],
    "basketball_scouting_chunks_md": [
        "scout", "scouting", "opponent", "report", "tendency", "tendencies",
        "film", "analysis", "breakdown", "matchup", "weakness", "strengths"
    ],
    "football_coaching_chunks_md": [
        "football", "soccer", "formation", "pressing", "possession", "tactic",
        "tactics", "striker", "midfielder", "defender", "goalkeeper", "set piece",
        "corner", "freekick", "offside", "buildup", "counter", "winger"
    ],
    "football_scouting_chunks_md": [
        "football scout", "soccer scout", "player report", "football opponent",
        "football analysis", "football breakdown"
    ],
    "sports_nutrition_chunks_md": [
        "nutrition", "diet", "eat", "eating", "protein", "carb", "carbs",
        "calorie", "calories", "supplement", "creatine", "hydration", "water",
        "meal", "food", "fat", "muscle", "weight", "macro", "macros",
        "vitamin", "pre-workout", "post-workout", "caffeine", "recovery food"
    ],
    "athleticism_coaching_chunks_md": [
        "speed", "sprint", "sprinting", "strength", "power", "jump", "jumping",
        "agility", "vo2", "vo2max", "endurance", "conditioning", "plyometric",
        "vertical", "mobility", "flexibility", "warmup", "warm up", "load",
        "explosive", "acceleration", "deceleration"
    ],
}

def route(english_query: str, user_role: str = None) -> list[str]:
    """
    Returns ordered list of folders to search.
    Profile folders come first (higher priority in BM25).
    Keyword folders are appended if they bring additional folders.
    """
    # Layer 1: profile-based priority folders
    profile_folders = ROLE_FOLDER_PRIORITY.get(user_role, [])

    # Layer 2: keyword-based folders
    query_words = set(english_query.lower().split())
    keyword_folders = [
        folder for folder, keywords in FOLDER_KEYWORDS.items()
        if query_words & set(keywords)
    ]

    # Merge: profile first, then any additional from keywords
    all_folders = profile_folders + [
        f for f in keyword_folders if f not in profile_folders
    ]

    # Fallback: if nothing matched at all, search everything
    if not all_folders:
        all_folders = list(FOLDER_KEYWORDS.keys())

    return all_folders
```

---

## Step 3 — BM25 Search (searcher.py)

**What:** Search `.md` files within matched folders.
**Important:** Index is built ONCE at startup, not on every query.
**Returns:** Combined text of top matches, or None if below threshold.

```python
from rank_bm25 import BM25Okapi
import os

WIKI_BASE_PATH = "./wiki"
SCORE_THRESHOLD = 1.0   # below this = not relevant enough
TOP_N_RESULTS = 2        # how many files to combine as context

class WikiSearcher:
    def __init__(self):
        self.docs = []    # raw text of each .md file
        self.names = []   # file paths
        self.bm25 = None
        self._build_index()

    def _build_index(self):
        """Runs once at startup. Loads all .md files into BM25."""
        tokenized = []
        for folder_name in os.listdir(WIKI_BASE_PATH):
            folder_path = os.path.join(WIKI_BASE_PATH, folder_name)
            if not os.path.isdir(folder_path):
                continue
            for filename in os.listdir(folder_path):
                if not filename.endswith(".md"):
                    continue
                path = os.path.join(folder_path, filename)
                text = open(path, encoding="utf-8").read()
                self.docs.append(text)
                self.names.append(path)
                tokenized.append(text.lower().split())

        self.bm25 = BM25Okapi(tokenized)
        print(f"[WikiSearcher] Indexed {len(self.docs)} files.")

    def search(self, english_query: str, folders: list[str]) -> str | None:
        """Search only within specified folders. Returns context or None."""
        folder_indices = [
            i for i, name in enumerate(self.names)
            if any(folder in name for folder in folders)
        ]

        if not folder_indices:
            return None

        tokens = english_query.lower().split()
        all_scores = self.bm25.get_scores(tokens)

        folder_scores = [
            (i, all_scores[i]) for i in folder_indices
        ]
        folder_scores.sort(key=lambda x: x[1], reverse=True)

        results = [
            self.docs[i]
            for i, score in folder_scores[:TOP_N_RESULTS]
            if score >= SCORE_THRESHOLD
        ]

        if not results:
            return None  # triggers web fallback

        return "\n\n---\n\n".join(results)
```

---

## Step 4 — Web Search Fallback (with language strategy)

**What:** Called when BM25 finds nothing relevant.
**Language strategy:**
- Wiki search → always English (files are in English)
- Web search → try **original language first**, then English fallback
- Why: original language may surface local/regional relevant sources first

```python
def web_fallback(original_query: str, english_query: str) -> str:
    # Try original language first (local/regional sources)
    results = ddgs_search(original_query)

    if not results or len(results) < 2:
        # Fallback to English for broader coverage
        results = ddgs_search(english_query)

    return results
```

---

## Step 5 — Full Pipeline (pipeline.py)

```python
searcher = WikiSearcher()  # built once at app startup

def answer_query(user_query: str, user_role: str = None) -> str:
    # 1. Translate to English for search (keep original for answer)
    original_query, english_query = translate_if_needed(user_query)

    # 2. Route to folders using profile + keywords
    folders = route(english_query, user_role=user_role)

    # 3. BM25 search in those folders
    context = searcher.search(english_query, folders)
    source = "wiki"

    # 4. Web fallback if wiki has no relevant content
    if context is None:
        context = web_fallback(original_query, english_query)
        source = "web"

    # 5. Gemma 4 answers in user's original language
    prompt = f"""You are Risbo, a sports AI assistant.
Use the following context to answer the question.
Respond in the same language the question was asked in.

Context (source: {source}):
{context}

Question: {user_query}

Answer:"""

    return call_gemma(prompt)
```

---

## Initialization (FastAPI)

```python
from contextlib import asynccontextmanager
from wiki_search.searcher import WikiSearcher

searcher = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global searcher
    searcher = WikiSearcher()  # build index at startup
    yield

app = FastAPI(lifespan=lifespan)
```

---

## What Is NOT Needed

- No vector database (ChromaDB, Pinecone, etc.)
- No embedding model (sentence-transformers, OpenAI embeddings)
- No LLM for routing
- No LLM for BM25 search
- LLM used ONLY for: translation (optional) + final answer generation

---

## Dependencies to Install

```bash
pip install rank-bm25 langdetect
```

Everything else already exists in Risbo.

---

## Known Limitations

1. **BM25 is keyword-based** — semantic mismatches possible, mitigated by translation.
2. **Router keyword list needs manual updates** when new wiki folders are added.
3. **Onboarding role must be passed** to `answer_query()` — wire it from user session/JWT.
4. **Gemma 4 reasoning** — sufficient for sports Q&A, not suited for complex multi-step tasks.