import asyncio
import logging
import os
import random
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from ddgs import DDGS

from domains import TRUSTED_DOMAINS, LOW_QUALITY_DOMAINS, STATIC_STATS_DOMAINS

logger = logging.getLogger(__name__)

SEARXNG_URL = os.getenv("SEARX_URL", "http://localhost:8080")

_FETCH_EXTRA = 4
_MAX_RETRIES = 3
_RETRY_BASE  = 1.5


# ---------------------------------------------------------------------------
# Domain scoring helpers
# ---------------------------------------------------------------------------

def get_host(url: str) -> str:
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host

def host_matches(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)

def score_result(result: dict, intent: str = "general") -> int:
    host = get_host(result.get("href") or result.get("url", ""))
    if not host:
        return 0
    base = 0
    for domain, bonus in TRUSTED_DOMAINS.items():
        if host_matches(host, domain):
            base = bonus
            break
    else:
        for domain, penalty in LOW_QUALITY_DOMAINS.items():
            if host_matches(host, domain):
                return penalty
    if intent == "stats":
        for domain in STATIC_STATS_DOMAINS:
            if host_matches(host, domain):
                base += 2
                break
    return base

def tier_label(score: int) -> str:
    if score >= 2: return "✓ TRUSTED"
    if score < 0:  return "⚠ LOW-QUALITY"
    return "GENERAL"


# ---------------------------------------------------------------------------
# Page content fetcher — replaces DDGS.extract()
# Direct HTTP fetch + BeautifulSoup, same approach as the Cheerio YT demos.
# Works on static HTML (news articles, FBRef, worldfootball, soccerway).
# JS-rendered sites (sofascore, live widgets) still return empty/skeleton.
# ---------------------------------------------------------------------------

async def _fetch_page_content(url: str, max_chars: int = 6000) -> str | None:
    if not url:
        return None
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: requests.get(
                    url,
                    timeout=8,
                    headers={"User-Agent": "Mozilla/5.0 (compatible; Risbo/1.0; +https://risbo.app)"},
                )
            ),
            timeout=10.0,
        )
        if response.status_code != 200:
            return None
        soup = BeautifulSoup(response.text, "lxml")
        for tag in soup(["script", "style", "img", "svg", "form", "link",
                          "iframe", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        text = " ".join(text.split())
        return text[:max_chars] if text else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# SearXNG — primary provider
# ---------------------------------------------------------------------------

async def _search_searxng(query: str, max_results: int, intent: str) -> list[dict]:
    """
    Search via local SearXNG instance. Aggregates Google, Bing, Brave, DDG
    simultaneously with no rate limits. For news/stats, fetches full page
    content from top-2 results using BeautifulSoup.
    Raises on failure so smart_search() can fall back to DDGS.
    """
    categories = "news" if intent == "news" else "general"
    time_range = "week" if intent == "news" else None

    params = {
        "q":          query,
        "format":     "json",
        "categories": categories,
        "language":   "en",
        "safesearch": "0",
    }
    if time_range:
        params["time_range"] = time_range

    response = await asyncio.wait_for(
        asyncio.to_thread(
            lambda: requests.get(f"{SEARXNG_URL}/search", params=params, timeout=10)
        ),
        timeout=12.0,
    )
    response.raise_for_status()
    raw = response.json().get("results", [])

    if not raw:
        raise ValueError("SearXNG returned empty results")

    scored = sorted(raw, key=lambda r: score_result(r, intent), reverse=True)
    top = scored[:max_results]

    # Fetch full page content for news and stats (static HTML sites)
    if intent in ("news", "stats") and top:
        urls = [r.get("url", "") for r in top[:2]]
        contents = await asyncio.gather(*[_fetch_page_content(u) for u in urls])
        for result, content in zip(top[:2], contents):
            if content:
                result["fetched_content"] = content

    return [
        {
            "title":   r.get("title", ""),
            "url":     r.get("url", ""),
            "snippet": r.get("content", ""),
            "content": r.get("fetched_content"),
            "tier":    tier_label(score_result(r)),
        }
        for r in top
    ]


# ---------------------------------------------------------------------------
# DDGS — fallback provider
# ---------------------------------------------------------------------------

async def _search_ddgs(query: str, max_results: int, intent: str) -> list[dict]:
    """
    DDGS fallback when SearXNG is unreachable.
    Uses the same BeautifulSoup fetcher for content extraction.
    """
    fetch_n = max_results + _FETCH_EXTRA
    last_exc: Exception | None = None
    raw: list = []

    for attempt in range(_MAX_RETRIES):
        try:
            if intent == "news":
                raw = await asyncio.to_thread(
                    lambda: list(DDGS().news(query, max_results=fetch_n, timelimit="w"))
                )
            else:
                raw = await asyncio.to_thread(
                    lambda: list(DDGS().text(query, max_results=fetch_n, backend="bing,duckduckgo"))
                )
            break
        except Exception as e:
            last_exc = e
            if attempt < _MAX_RETRIES - 1:
                wait = _RETRY_BASE * (2 ** attempt) + random.uniform(0, 0.5)
                await asyncio.sleep(wait)

    if not raw and last_exc:
        raise last_exc

    scored = sorted(raw, key=lambda r: score_result(r, intent), reverse=True)
    top = scored[:max_results]

    if intent in ("news", "stats") and top:
        urls = [r.get("url", "") or r.get("href", "") for r in top[:2]]
        contents = await asyncio.gather(*[_fetch_page_content(u) for u in urls])
        for result, content in zip(top[:2], contents):
            if content:
                result["fetched_content"] = content

    return [
        {
            "title":   r.get("title", ""),
            "url":     r.get("href") or r.get("url", ""),
            "snippet": r.get("body", ""),
            "content": r.get("fetched_content"),
            "tier":    tier_label(score_result(r)),
        }
        for r in top
    ]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def smart_search(query: str, max_results: int = 8, intent: str = "general") -> list[dict]:
    """
    Primary: SearXNG (self-hosted, no rate limits, aggregates multiple engines).
    Fallback: DDGS (if SearXNG unreachable).
    Both paths use BeautifulSoup for full page content on news/stats intents.
    """
    try:
        results = await _search_searxng(query, max_results, intent)
        logger.info(f"[search] SearXNG OK — {len(results)} results")
        return results
    except Exception as e:
        logger.warning(f"[search] SearXNG failed ({e}), falling back to DDGS")

    return await _search_ddgs(query, max_results, intent)


async def bilingual_search(
    original_query: str,
    english_query: str,
    max_results: int = 8,
    intent: str = "general",
) -> list[dict]:
    """
    Search the user's ORIGINAL language first, then English, and combine the best of both.

    Original-language queries can surface local/regional sources; English broadens
    coverage. Both runs go through smart_search() (SearXNG → DDGS) concurrently, then
    results are merged and de-duplicated by host+path so the strongest unique hits win.
    No LLM call — english_query is reused from main._make_search_query().
    """
    original_query = (original_query or "").strip()
    english_query = (english_query or "").strip()

    # If they're effectively the same (query already English), one search is enough.
    queries = [q for q in {original_query, english_query} if q] or [english_query]

    settled = await asyncio.gather(
        *[smart_search(q, max_results=max_results, intent=intent) for q in queries],
        return_exceptions=True,
    )

    merged: list[dict] = []
    seen: set[str] = set()
    for res in settled:
        if isinstance(res, Exception):
            logger.warning(f"[search] bilingual leg failed: {res}")
            continue
        for r in res:
            url = r.get("url") or ""
            key = get_host(url) + urlparse(url).path.rstrip("/")
            if key in seen:
                continue
            seen.add(key)
            merged.append(r)

    merged.sort(key=lambda r: score_result(r, intent), reverse=True)
    return merged[:max_results]
