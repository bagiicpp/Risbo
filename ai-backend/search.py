import asyncio
from urllib.parse import urlparse
from ddgs import DDGS

TRUSTED_DOMAINS = {
    # ─── TRAINING SCIENCE / METHODOLOGY ────────────────────────
    "simplifaster.com":                  3,  # Sprint, biomechanics, S&C — top tier
    "scienceforsport.com":               3,  # Practical sport science articles
    "pubmed.ncbi.nlm.nih.gov":           3,  # Peer-reviewed research
    "ncbi.nlm.nih.gov":                  3,  # Sister of pubmed, broader
    "examine.com":                       3,  # Supplements/nutrition, evidence-based
    "strengthandconditioningresearch.com": 3,  # Research summaries
    "elitefts.com":                      2,  # Strength training methodology
    "t-nation.com":                      2,  # Strength/hypertrophy
    "altis.world":                       2,  # Sprint/track coaching
    "justfly-sports.com":                2,  # Sprint & jump training
    "mysportscience.com":                2,  # Endurance/nutrition (Jeukendrup)
    "breakingmuscle.com":                1,  # General training, mixed quality

    # ─── SPORT STATS / ANALYTICS ───────────────────────────────
    "fbref.com":                         3,  # Football, deepest stats globally
    "basketball-reference.com":          3,  # Basketball reference standard
    "understat.com":                     3,  # xG and expected stats
    "theanalyst.com":                    3,  # Opta data analyses
    "statsbomb.com":                     3,  # Football analytics (paywall, snippets free)
    "sofascore.com":                     2,  # Multi-sport, lower leagues
    "transfermarkt.com":                 2,  # Players, transfers, market value
    "whoscored.com":                     2,  # Football advanced stats
    "baseball-reference.com":            3,  # Baseball reference
    "hockey-reference.com":              3,  # Hockey reference
    "flashscore.com":                    1,  # Live scores
    "proballers.com":                    1,  # Basket lower leagues

    # ─── COACHING / TACTICS ────────────────────────────────────
    "coachesvoice.com":                  3,  # Managers explaining tactics
    "spielverlagerung.com":              3,  # Tactical analysis (DE/EN)
    "theathletic.com":                   2,  # Paywall but snippets very useful

    # ─── MEDICAL / PHYSIOLOGY / RECOVERY ───────────────────────
    "nih.gov":                           3,  # NIH research portal
    "acsm.org":                          3,  # American College of Sports Medicine
    "nsca.com":                          3,  # National Strength & Conditioning Assoc.
    "mayoclinic.org":                    2,  # General medical reference
    "physio-pedia.com":                  2,  # Physio reference
    "hopkinsmedicine.org":               2,  # Johns Hopkins

    # ─── NEWS (for "why" / context queries) ────────────────────
    "bbc.com":                           2,  # Quality, free, global
    "theguardian.com":                   2,  # Long-form, multi-sport
    "reuters.com":                       2,  # Wire service
    "apnews.com":                        2,  # Wire service
    "skysports.com":                     1,  # Football-heavy
    "espn.com":                          1,  # US sports + global
}

LOW_QUALITY_DOMAINS = {
    # ─── USELESS / NOISE ──────────────────────────────────────
    "pinterest.com":                    -10,  # Always useless
    "quora.com":                         -5,  # Often wrong
    "answers.yahoo.com":                 -5,  # Defunct + spam
    "ehow.com":                          -5,  # Content farm
    "wikihow.com":                       -3,  # Surface-level

    # ─── BETTING / SEO FARMS ──────────────────────────────────
    "1xbet.com":                        -10,
    "bet365.com":                        -8,
    "bovada.lv":                         -8,
    "bettingexpert.com":                 -8,
    "sportsbettingdime.com":             -8,
    "aibettingtips.com":                -10,  # AI content farm
    "footballpredictions.com":           -5,

    # ─── CLICKBAIT / AGGREGATORS ──────────────────────────────
    "bleacherreport.com":                -2,  # Mixed quality, prone to clickbait
}


def get_host(url: str) -> str:
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host

def host_matches(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)

def score_result(result: dict) -> int:
    # text() returns "href", news() returns "url" — handle both
    host = get_host(result.get("href") or result.get("url", ""))
    if not host:
        return 0
    for domain, bonus in TRUSTED_DOMAINS.items():
        if host_matches(host, domain):
            return bonus  # return immediately on first trusted match
    for domain, penalty in LOW_QUALITY_DOMAINS.items():
        if host_matches(host, domain):
            return penalty
    return 0

def tier_label(score: int) -> str:
    if score >= 2:  return "✓ TRUSTED"
    if score < 0:   return "⚠ LOW-QUALITY"
    return "GENERAL"

async def smart_search(query: str, max_results: int = 8, intent: str = "general") -> list[dict]:
    """
    Search the web for `query`. Uses DDGS.news() for news intent,
    DDGS.text() for everything else. Results are scored and sorted
    by domain trust tier before returning.
    """
    if intent == "news":
        raw = await asyncio.to_thread(
            lambda: list(DDGS().news(query, max_results=max_results * 2))
        )
    else:
        raw = await asyncio.to_thread(
            lambda: list(DDGS().text(query, max_results=max_results * 2, backend="auto"))
        )
    scored = sorted(raw, key=score_result, reverse=True)
    return [
        {
            "title":   r.get("title", ""),
            "url":     r.get("href") or r.get("url", ""),
            "snippet": r.get("body", ""),
            "tier":    tier_label(score_result(r)),
        }
        for r in scored[:max_results]
    ]
