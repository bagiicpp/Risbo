import asyncio
import logging
import os
import re

import requests

from domains import LEAGUE_CODE_MAP, FOOTBALL_MATCHES_TOKENS, FOOTBALL_SCORERS_TOKENS

logger = logging.getLogger(__name__)

BASE_URL = "https://api.football-data.org/v4"


def detect_league_code(query: str) -> str | None:
    q = query.lower()
    for keyword, code in LEAGUE_CODE_MAP.items():
        if keyword in q:
            return code
    return None


def _classify_football_query(query: str) -> str:
    tokens = set(re.sub(r"[^\w\s]", " ", query.lower()).split())
    m = len(tokens & FOOTBALL_MATCHES_TOKENS)
    s = len(tokens & FOOTBALL_SCORERS_TOKENS)
    if s > m and s > 0:
        return "scorers"
    if m > 0:
        return "matches"
    return "standings"


def _get(endpoint: str, params: dict | None = None) -> dict | None:
    api_key = os.getenv("FOOTBALL_DATA_API_KEY", "")
    if not api_key:
        return None
    try:
        r = requests.get(
            f"{BASE_URL}{endpoint}",
            headers={"X-Auth-Token": api_key},
            params=params or {},
            timeout=10,
        )
        remaining = r.headers.get("X-RequestsAvailable", "?")
        logger.debug(f"[football-data] {endpoint} remaining={remaining}")
        if r.status_code == 429:
            logger.warning("[football-data] rate limit hit")
            return None
        if r.status_code == 403:
            logger.warning(f"[football-data] 403 — plan doesn't cover: {endpoint}")
            return None
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[football-data] {endpoint}: {e}")
        return None


async def _aget(endpoint: str, params: dict | None = None) -> dict | None:
    return await asyncio.to_thread(_get, endpoint, params)


async def _standings_block(code: str) -> str | None:
    data = await _aget(f"/competitions/{code}/standings")
    if not data:
        return None

    total = next(
        (s["table"] for s in data["standings"] if s["type"] == "TOTAL"), []
    )
    if not total:
        return None

    comp = data["competition"]["name"]
    matchday = data["season"].get("currentMatchday", "?")

    lines = [
        f"[FOOTBALL DATA — {comp}, Matchday {matchday}]",
        f"{'Poz':<4} {'Tim':<22} {'O':<4} {'P':<4} {'N':<4} {'I':<4} {'GR':<6} {'Bod'}",
        "-" * 56,
    ]
    for row in total:
        lines.append(
            f"{row['position']:<4} {row['team']['shortName']:<22}"
            f" {row['playedGames']:<4} {row['won']:<4} {row['draw']:<4}"
            f" {row['lost']:<4} {row['goalDifference']:<6} {row['points']}"
        )
    return "\n".join(lines)


async def _matches_block(code: str) -> str | None:
    finished, upcoming = await asyncio.gather(
        _aget(f"/competitions/{code}/matches", {"status": "FINISHED", "limit": 10}),
        _aget(f"/competitions/{code}/matches", {"status": "SCHEDULED", "limit": 5}),
    )

    lines = []

    if finished:
        matches = finished.get("matches", [])[-5:]
        if matches:
            comp = matches[0]["competition"]["name"]
            lines.append(f"[FOOTBALL DATA — {comp}, Posljednjih 5 utakmica]")
            for m in matches:
                h = m["homeTeam"]["shortName"]
                a = m["awayTeam"]["shortName"]
                sh = m["score"]["fullTime"]["home"]
                sa = m["score"]["fullTime"]["away"]
                score = f"{sh} - {sa}" if sh is not None else "- vs -"
                lines.append(f"  {h} {score} {a}")

    if upcoming:
        matches = upcoming.get("matches", [])[:5]
        if matches:
            lines.append("\n[Narednih 5 utakmica]")
            for m in matches:
                h = m["homeTeam"]["shortName"]
                a = m["awayTeam"]["shortName"]
                date = m["utcDate"][:10]
                lines.append(f"  {date}  {h} vs {a}")

    return "\n".join(lines) if lines else None


async def _scorers_block(code: str) -> str | None:
    data = await _aget(f"/competitions/{code}/scorers", {"limit": 10})
    if not data:
        return None

    scorers = data.get("scorers", [])
    if not scorers:
        return None

    comp = data["competition"]["name"]
    lines = [
        f"[FOOTBALL DATA — {comp}, Top strijelci]",
        f"{'#':<4} {'Igrač':<25} {'Tim':<18} {'Gol':<5} {'Ast'}",
        "-" * 56,
    ]
    for i, s in enumerate(scorers, 1):
        lines.append(
            f"{i:<4} {s['player']['name']:<25} {s['team']['shortName']:<18}"
            f" {s['goals']:<5} {s.get('assists') or 0}"
        )
    return "\n".join(lines)


async def get_football_context(query: str) -> str | None:
    """
    Entry point for main.py. Returns a formatted data block for LLM injection,
    or None if the query doesn't match a supported league (→ fall through to SearXNG).
    """
    code = detect_league_code(query)
    if not code:
        return None

    fq = _classify_football_query(query)
    logger.info(f"[football-data] code={code!r} type={fq!r}")

    if fq == "matches":
        block = await _matches_block(code)
    elif fq == "scorers":
        block = await _scorers_block(code)
    else:
        block = await _standings_block(code)

    if not block:
        return None

    return (
        "[STRUCTURED FOOTBALL DATA — live data from football-data.org]\n\n"
        f"{block}\n\n"
        "[END FOOTBALL DATA]"
    )
