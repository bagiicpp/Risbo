"""
Orchestration glue for the wiki search.

Takes an already-English query (reused from main._make_search_query, so no extra LLM
call) plus the onboarding profile, routes to the right folders, runs BM25, and returns
a prompt-ready context block — or None when nothing relevant is found (so the caller
lets the LLM answer from its own knowledge / web search).
"""
import logging

from .router import route
from .searcher import WikiSearcher

logger = logging.getLogger(__name__)


def _extract_profile(profile: dict | None) -> tuple[str, list[str], list[str]]:
    """Pull (role, sports, focus) out of the profile, handling the nested sport_profile."""
    if not isinstance(profile, dict):
        return "", [], []

    sport_profile = profile.get("sport_profile")
    if not isinstance(sport_profile, dict):
        sport_profile = profile  # tolerate a flat profile shape

    role = profile.get("role") or ""
    sports = [s for s in (sport_profile.get("sport") or []) if s]
    focus = [f for f in (sport_profile.get("focus") or []) if f]
    return role, sports, focus


def build_wiki_context(
    searcher: WikiSearcher | None,
    english_query: str,
    profile: dict | None,
) -> str | None:
    """
    Returns a labelled knowledge-base block to inject into the prompt, or None.
    """
    if not searcher or not english_query:
        return None

    role, sports, focus = _extract_profile(profile)
    folders = route(english_query, role=role, sports=sports, focus=focus)

    context = searcher.search(english_query, folders)
    if not context:
        return None

    logger.info("[wiki] hit — folders=%s", folders[:3])
    return (
        "[RISBO KNOWLEDGE BASE — curated reference, use as primary grounding]\n"
        f"{context}\n"
        "[END KNOWLEDGE BASE]"
    )
