# football-data.org API v4 — Claude Code Reference
> Kompletna referenca za integraciju football-data.org u Risbo AI backend

---

## Što je football-data.org

Besplatan (freemium) REST API za football podatke. Vraća strukturirani JSON sa
standings, match rezultatima, scorerima, timovima i igračima za 100+ liga.

**Zašto je ovo bolje od web searcha za standings:**
```
Web search → snippet → LLM ne može pročitati tabelu
football-data.org → strukturirani JSON → direktni podaci
```

**Base URL:** `https://api.football-data.org/v4/`

---

## Autentifikacija

Sve zahtjeve šalješ sa API key-om u headeru:

```python
headers = {"X-Auth-Token": "YOUR_API_KEY"}
```

Registracija je besplatna: https://www.football-data.org/client/register

---

## Rate Limits (VAŽNO)

| Plan | Limit |
|------|-------|
| Free (bez tokena) | 100 req/24h, samo area i competition list |
| Free (registriran) | **10 req/minuta** |
| Standard | 30 req/minuta |
| Premium+ | 60 req/minuta |

**Pratи `X-RequestsAvailable` header u svakom response-u** da znaš koliko poziva ti je ostalo.

---

## 4 Glavna Resursa

```
Competition  → liga/kup (standings, matches, scorers, teams)
Match        → jedan utakmice (live score, lineup, goals, cards)
Team         → tim (squad, matches, historija)
Person       → igrač/trener/sudija (statistike, matches)
```

---

## Endpoints — Kompletna Lista

### Competitions

```
GET /v4/competitions                    → lista svih liga
GET /v4/competitions/{code}             → jedna liga (PL, SA, BL1...)
GET /v4/competitions/{code}/standings   → tabela
GET /v4/competitions/{code}/matches     → utakmice
GET /v4/competitions/{code}/scorers     → top strijelci
GET /v4/competitions/{code}/teams       → timovi u ligi
```

### Matches

```
GET /v4/matches                         → danas (default)
GET /v4/matches/{id}                    → jedna utakmica
GET /v4/teams/{id}/matches              → sve utakmice tima
GET /v4/persons/{id}/matches            → sve utakmice igrača
```

### Teams & Persons

```
GET /v4/teams/{id}                      → tim + squad
GET /v4/persons/{id}                    → igrač detalji
```

---

## Python Implementacija

### Osnovna klasa

```python
import os
import asyncio
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_URL = "https://api.football-data.org/v4"
API_KEY = os.getenv("FOOTBALL_DATA_API_KEY")

HEADERS = {
    "X-Auth-Token": API_KEY,
    # Unfold detalje u match listama (po defaultu su skriveni)
    "X-Unfold-Goals": "true",
    "X-Unfold-Subs": "false",
    "X-Unfold-Lineups": "false",
}


def _get(endpoint: str, params: dict = None) -> dict | None:
    """Blocking HTTP GET — koristi asyncio.to_thread() za async kontekst."""
    try:
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers=HEADERS,
            params=params,
            timeout=10
        )

        # Logiraj preostale requestove
        remaining = response.headers.get("X-RequestsAvailable", "?")
        logger.debug(f"[football-data] {endpoint} | remaining: {remaining}")

        if response.status_code == 429:
            logger.warning("[football-data] Rate limit hit!")
            return None

        if response.status_code == 403:
            logger.error("[football-data] 403 — Plan ne podržava ovaj endpoint")
            return None

        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        logger.error(f"[football-data] Timeout: {endpoint}")
        return None
    except Exception as e:
        logger.error(f"[football-data] Error {endpoint}: {e}")
        return None


async def get_async(endpoint: str, params: dict = None) -> dict | None:
    """Async wrapper."""
    return await asyncio.to_thread(_get, endpoint, params)
```

---

### Standings (Tabela)

```python
async def get_standings(competition_code: str, season: int = None) -> dict | None:
    """
    Dohvati tabelu za ligu.
    
    Args:
        competition_code: PL, SA, BL1, PD, FL1, CL... (vidi League Codes ispod)
        season: godina početka sezone (npr. 2024 za 2024/25)
    
    Returns:
        Dict sa TOTAL, HOME, AWAY standings tablicama
    """
    params = {}
    if season:
        params["season"] = season

    data = await get_async(f"/competitions/{competition_code}/standings", params)
    if not data:
        return None

    # Parsir TOTAL standings u čitljivi format
    total_standings = next(
        (s["table"] for s in data["standings"] if s["type"] == "TOTAL"),
        []
    )

    return {
        "competition": data["competition"]["name"],
        "season": data["season"]["startDate"][:4],
        "matchday": data["season"].get("currentMatchday"),
        "table": [
            {
                "position":  row["position"],
                "team":      row["team"]["shortName"],
                "played":    row["playedGames"],
                "won":       row["won"],
                "draw":      row["draw"],
                "lost":      row["lost"],
                "goals_for": row["goalsFor"],
                "goals_against": row["goalsAgainst"],
                "goal_diff": row["goalDifference"],
                "points":    row["points"],
                "form":      row.get("form", ""),
            }
            for row in total_standings
        ]
    }


def format_standings_for_llm(standings: dict) -> str:
    """Pretvori standings u tekst koji LLM može čitati."""
    if not standings:
        return "Standings nisu dostupni."

    lines = [
        f"**{standings['competition']} — Sezona {standings['season']}**",
        f"*Matchday: {standings['matchday']}*\n",
        f"{'Poz':<4} {'Tim':<20} {'O':<4} {'P':<4} {'N':<4} {'I':<4} {'GD':<6} {'Bod':<5} {'Forma'}",
        "-" * 60
    ]

    for row in standings["table"]:
        lines.append(
            f"{row['position']:<4} {row['team']:<20} {row['played']:<4} "
            f"{row['won']:<4} {row['draw']:<4} {row['lost']:<4} "
            f"{row['goal_diff']:<6} {row['points']:<5} {row['form']}"
        )

    return "\n".join(lines)
```

---

### Matches (Utakmice)

```python
async def get_today_matches(competitions: str = None) -> list[dict]:
    """
    Dohvati utakmice za danas.
    
    Args:
        competitions: comma-separated kodovi liga (npr. "PL,SA,BL1")
    """
    params = {}
    if competitions:
        params["competitions"] = competitions

    data = await get_async("/matches", params)
    if not data:
        return []

    return [
        {
            "id":           m["id"],
            "competition":  m["competition"]["name"],
            "home":         m["homeTeam"]["shortName"],
            "away":         m["awayTeam"]["shortName"],
            "status":       m["status"],
            "score_home":   m["score"]["fullTime"]["home"],
            "score_away":   m["score"]["fullTime"]["away"],
            "matchday":     m.get("matchday"),
            "utc_date":     m["utcDate"],
        }
        for m in data.get("matches", [])
    ]


async def get_competition_matches(
    competition_code: str,
    matchday: int = None,
    date_from: str = None,
    date_to: str = None,
    status: str = None
) -> list[dict]:
    """
    Dohvati utakmice za ligu.
    
    Args:
        status: SCHEDULED | TIMED | IN_PLAY | FINISHED | POSTPONED
        date_from/date_to: format yyyy-MM-dd
    """
    params = {}
    if matchday:  params["matchday"] = matchday
    if date_from: params["dateFrom"] = date_from
    if date_to:   params["dateTo"] = date_to
    if status:    params["status"] = status

    data = await get_async(f"/competitions/{competition_code}/matches", params)
    if not data:
        return []

    return data.get("matches", [])


async def get_match_detail(match_id: int) -> dict | None:
    """
    Detalji jedne utakmice — score, goals, lineups, cards.
    Koristi X-Unfold headere za više detalja.
    """
    return await get_async(f"/matches/{match_id}")
```

---

### Top Scorers

```python
async def get_top_scorers(competition_code: str, season: int = None, limit: int = 10) -> list[dict]:
    """
    Top strijelci za ligu.
    
    Returns lista sa: player name, team, goals, assists, penalties
    """
    params = {"limit": limit}
    if season:
        params["season"] = season

    data = await get_async(f"/competitions/{competition_code}/scorers", params)
    if not data:
        return []

    return [
        {
            "rank":      i + 1,
            "player":    s["player"]["name"],
            "team":      s["team"]["shortName"],
            "goals":     s["goals"],
            "assists":   s.get("assists", 0),
            "penalties": s.get("penalties", 0),
        }
        for i, s in enumerate(data.get("scorers", []))
    ]
```

---

### Team & Person

```python
async def get_team(team_id: int) -> dict | None:
    """Tim detalji + squad za trenutnu sezonu."""
    return await get_async(f"/teams/{team_id}")


async def get_person(person_id: int) -> dict | None:
    """Igrač/trener detalji."""
    return await get_async(f"/persons/{person_id}")


async def get_person_matches(
    person_id: int,
    competitions: str = None,
    date_from: str = None,
    date_to: str = None,
    lineup: str = None
) -> list[dict]:
    """
    Utakmice igrača.
    
    Args:
        lineup: STARTING | BENCH
    """
    params = {}
    if competitions: params["competitions"] = competitions
    if date_from:    params["dateFrom"] = date_from
    if date_to:      params["dateTo"] = date_to
    if lineup:       params["lineup"] = lineup

    data = await get_async(f"/persons/{person_id}/matches", params)
    return data.get("matches", []) if data else []
```

---

## Intent Routing za Risbo

Dodaj u `intent.py` i `search.py`:

```python
# intent.py — novi intent
STANDINGS_KEYWORDS = [
    "tabela", "standings", "stanje", "poredak", "bodovi",
    "koji vodi", "lider", "prvak", "relegacija", "top liga"
]

MATCHES_KEYWORDS = [
    "utakmica", "rezultat", "score", "ko igra", "kad igra",
    "danas", "sutra", "juče", "live", "uživo"
]

SCORERS_KEYWORDS = [
    "strijelci", "scorers", "golovi", "ko je dao", "top scorer",
    "strelac", "asistencije"
]
```

```python
# U main.py — prije LLM poziva
async def get_football_data_context(query: str, intent: str) -> str:
    """
    Ako intent zahtjeva strukturirane podatke — dohvati ih direktno
    umjesto web searcha.
    """
    code = detect_league_code(query)  # vidi LEAGUE_MAP ispod

    if not code:
        return ""  # fallback na web search

    if intent == "standings":
        standings = await get_standings(code)
        return format_standings_for_llm(standings)

    elif intent == "scorers":
        scorers = await get_top_scorers(code)
        return format_scorers_for_llm(scorers)

    elif intent == "matches":
        matches = await get_competition_matches(code, status="FINISHED")
        return format_matches_for_llm(matches[-5:])  # zadnjih 5

    return ""
```

---

## League Code Mapa (za intent routing)

```python
LEAGUE_CODE_MAP = {
    # Engleski
    "premier liga": "PL",
    "premier league": "PL",
    "championship": "ELC",

    # Španski
    "la liga": "PD",
    "primera division": "PD",
    "primera división": "PD",

    # Njemački
    "bundesliga": "BL1",
    "bundesliga 2": "BL2",

    # Talijanski
    "serie a": "SA",
    "serie b": "SB",

    # Francuski
    "ligue 1": "FL1",
    "ligue 2": "FL2",

    # Evropski
    "liga prvaka": "CL",
    "champions league": "CL",
    "uefa champions league": "CL",
    "europa league": "EL",
    "konferencijska liga": "ECL",

    # Ostalo
    "mls": "MLS",
    "eredivisie": "DED",
    "primeira liga": "PPL",
    "süper lig": "TSL",
    "super lig": "TSL",
}

def detect_league_code(query: str) -> str | None:
    q = query.lower()
    for keyword, code in LEAGUE_CODE_MAP.items():
        if keyword in q:
            return code
    return None
```

**NAPOMENA:** football-data.org FREE tier nema Superligu Srbije, ABA ligu i slične
regionalne/niže lige. Za te ligе koristi SearXNG ili footystats.org.

---

## Response Headers — Pratiti

```python
# Nakon svakog poziva provjeri:
response.headers["X-RequestsAvailable"]  # preostali requestovi
response.headers["X-RequestCounter-Reset"]  # sekundi do reseta
response.headers["X-API-Version"]  # verzija API-ja
```

---

## Unfold Headers (za match detalje)

Po defaultu match liste vraćaju minimalne podatke. Da dobiješ više:

```python
# U headers dictu po potrebi:
"X-Unfold-Goals":    "true"   # Ko je dao gol i kada
"X-Unfold-Bookings": "true"   # Kartoni
"X-Unfold-Subs":     "true"   # Izmjene
"X-Unfold-Lineups":  "true"   # Postave (samo za jedan match, ne liste)
```

---

## Error Codes

| Status | Uzrok | Rješenje |
|--------|-------|----------|
| 400 | Loš filter format | Provjeri format datuma (yyyy-MM-dd) |
| 403 | Plan ne podržava endpoint | Free plan = ograničene lige |
| 404 | Liga/tim ne postoji | Provjeri league code |
| 429 | Rate limit | Čekaj do X-RequestCounter-Reset |

---

## Match Status Enum

```
SCHEDULED       → zakazana, datum poznat
TIMED           → zakazana, tačno vrijeme poznato
IN_PLAY         → live
PAUSED          → poluvrijeme
EXTRA_TIME      → produžeci
PENALTY_SHOOTOUT → penali
FINISHED        → završena
POSTPONED       → odgođena
CANCELLED       → otkazana
SUSPENDED       → prekinuta
AWARDED         → dosuđena (bez igranja)
```

---

## Minimalni Test

```python
import asyncio

async def test():
    # Test 1 — standings
    standings = await get_standings("PL")
    assert standings and len(standings["table"]) > 0
    print(f"✓ Standings: {standings['competition']}")
    print(format_standings_for_llm(standings)[:500])

    # Test 2 — top scorers
    scorers = await get_top_scorers("SA", limit=5)
    assert len(scorers) > 0
    print(f"\n✓ Scorers: {scorers[0]['player']} - {scorers[0]['goals']} golova")

    # Test 3 — today matches
    matches = await get_today_matches()
    print(f"\n✓ Danas: {len(matches)} utakmice")

    print("\nfootball-data.org radi ispravno.")

if __name__ == "__main__":
    asyncio.run(test())
```

---

## Env varijable

```env
FOOTBALL_DATA_API_KEY=your_key_here
```

---

## Napomene za Claude Code

- **Free plan = 10 req/minuta** — ne zovi API u petlji bez sleep-a
- **Free plan ne pokriva sve lige** — Superliga Srbije, ABA liga i sl. NISU dostupni
- **Default je trenutna sezona** — ne treba slati `season` parametar za live podatke
- **`score.fullTime`** može biti `null` ako utakmica nije završena — uvijek provjeri
- **Standings vraća TOTAL, HOME i AWAY** — za Risbo koristi TOTAL (index 0)
- **`format` za datume je yyyy-MM-dd** — ne dd.MM.yyyy
- **League code je case-sensitive** — `PL` ne `pl`
- Ako dobiješ 403 za neku ligu, znači da free plan ne pokriva — koristi SearXNG fallback