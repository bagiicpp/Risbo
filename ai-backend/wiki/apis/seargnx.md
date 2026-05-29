# SearXNG — Claude Code Reference
> Sve što trebaš znati za integraciju SearXNG u Risbo AI backend

---

## Što je SearXNG

SearXNG je **self-hosted metasearch engine** — pokrećeš ga sam na svom serveru/Dockeru.
Kada ga pozoveš, on istovremeno pretražuje 245 search engine-a (Google, Bing, Brave, DuckDuckGo, itd.)
i vraća agregirane rezultate kao JSON.

```
tvoj Python kod → HTTP GET → SearXNG (tvoj Docker) → 245 engine-a → JSON response
```

**Zašto umjesto DDGS:**
- Nema rate limita — ti kontrolišeš server
- Nema API key-a
- Više engine-a istovremeno = bolji rezultati
- Radi i na VPS-u zajedno sa ostalim servisima

---

## Docker Setup — Preporučeni način (Compose)

### Korak 1 — Kreiraj direktorij i fetchaj config

```bash
mkdir -p ./searxng/core-config/
cd ./searxng/

curl -fsSL \
    -O https://raw.githubusercontent.com/searxng/searxng/master/container/docker-compose.yml \
    -O https://raw.githubusercontent.com/searxng/searxng/master/container/.env.example

cp -i .env.example .env
```

### Korak 2 — Pokreni

```bash
docker compose up -d
```

SearXNG je dostupan na `http://localhost:8080`

### Korak 3 — Omogući JSON format (OBAVEZNO)

Edituj `core-config/settings.yml`:

```yaml
search:
  formats:
    - html
    - json    # ← ovo mora biti uključeno, inače API vraća 403
```

Restart nakon promjene:
```bash
docker compose down && docker compose up -d
```

---

## Integracija u postojeći docker-compose.yml (Risbo)

Dodaj SearXNG kao servis u tvoj `docker-compose.yml`:

```yaml
services:

  app-backend:
    build: ./app-backend
    ports:
      - "8000:8000"
    environment:
      - SEARXNG_URL=http://searxng:8080  # internal Docker network

  ai-backend:
    build: ./ai-backend
    ports:
      - "8001:8001"
    environment:
      - SEARXNG_URL=http://searxng:8080  # koristi ime servisa, ne localhost!
    depends_on:
      - searxng

  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"       # opcionalno — samo ako hoćeš direktan pristup
    volumes:
      - ./searxng/core-config:/etc/searxng:rw
    restart: unless-stopped

```

**VAŽNO:** U Dockeru servisi komuniciraju po imenu, ne po `localhost`.
`http://searxng:8080` je ispravno, `http://localhost:8080` ne radi između kontejnera.

---

## Search API — Kompletna Referenca

### Endpoint

```
GET  /search?q=query&format=json
POST /search  (form data: q=query&format=json)
```

### Parametri

| Parametar | Obavezno | Vrijednosti | Opis |
|-----------|----------|-------------|------|
| `q` | ✅ Da | string | Search query |
| `format` | ✅ Da | `json`, `csv`, `rss` | Format odgovora — mora biti u settings.yml |
| `categories` | Ne | `general`, `news`, `images`, `videos`, `science` | Tip pretrage |
| `engines` | Ne | `google`, `bing`, `brave`, `duckduckgo`... | Specifični engine-i |
| `language` | Ne | `en`, `hr`, `sr`, `bs`, `sl`... | Jezik rezultata |
| `pageno` | Ne | `1`, `2`... | Stranica rezultata |
| `time_range` | Ne | `day`, `month`, `year` | Vremenski filter |
| `safesearch` | Ne | `0`, `1`, `2` | 0=off, 1=moderate, 2=strict |

### Primjeri poziva

```python
import requests

SEARXNG_URL = "http://searxng:8080"  # u Dockeru
# SEARXNG_URL = "http://localhost:8080"  # lokalno van Dockera

# Osnovni search
response = requests.get(
    f"{SEARXNG_URL}/search",
    params={
        "q": "Serbian SuperLiga football standings 2025",
        "format": "json",
        "language": "en"
    }
)
data = response.json()

# News search
response = requests.get(
    f"{SEARXNG_URL}/search",
    params={
        "q": "Mbappe injury news",
        "format": "json",
        "categories": "news",
        "time_range": "month"
    }
)

# Specifični engine-i
response = requests.get(
    f"{SEARXNG_URL}/search",
    params={
        "q": "sprint mechanics biomechanics",
        "format": "json",
        "engines": "google,brave,bing"
    }
)
```

### Response format

```json
{
  "query": "Serbian SuperLiga football standings",
  "number_of_results": 1430000,
  "results": [
    {
      "title": "SuperLiga Srbije 2024/25 — Tabela i Rezultati",
      "url": "https://footystats.org/serbia/superliga",
      "content": "snippet teksta...",
      "engine": "google",
      "score": 1.0,
      "category": "general",
      "parsed_url": ["https", "footystats.org", "/serbia/superliga", "", "", ""]
    }
  ],
  "answers": [],
  "corrections": [],
  "infoboxes": [],
  "suggestions": []
}
```

**Ključna polja u result objektu:**
- `url` → link stranice
- `content` → snippet teksta (150-300 chars)
- `title` → naslov stranice
- `engine` → koji engine je vratio ovaj rezultat
- `score` → relevance score (1.0 = max)

---

## Python Implementacija za Risbo

### Osnovna klasa — zamjenjuje DDGS

```python
import os
import logging
import asyncio
import requests
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:8080")

# Trust scoring (isto kao u search.py)
TRUSTED_DOMAINS = {
    "fbref.com": 3,
    "footystats.org": 3,
    "worldfootball.net": 3,
    "soccerway.com": 3,
    "scienceforsport.com": 3,
    "simplifaster.com": 3,
    "basketball-reference.com": 3,
    "basketball.realgm.com": 3,
    "eurobasket.com": 3,
    "examine.com": 3,
    "sofascore.com": 2,
    "transfermarkt.com": 2,
    "bbc.com": 2,
    "theguardian.com": 2,
}

LOW_QUALITY_DOMAINS = {
    "pinterest.com": -10,
    "quora.com": -5,
    "bet365.com": -8,
    "1xbet.com": -10,
}

def get_host(url: str) -> str:
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host

def host_matches(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)

def score_result(result: dict) -> int:
    host = get_host(result.get("url", ""))
    if not host:
        return 0
    for domain, bonus in TRUSTED_DOMAINS.items():
        if host_matches(host, domain):
            return bonus
    for domain, penalty in LOW_QUALITY_DOMAINS.items():
        if host_matches(host, domain):
            return penalty
    return 0

def tier_label(score: int) -> str:
    if score >= 3:  return "✓✓ TOP"
    if score == 2:  return "✓ TRUSTED"
    if score == 1:  return "~ GENERAL"
    if score < 0:   return "⚠ LOW-QUALITY"
    return "NEUTRAL"


async def searxng_search(
    query: str,
    max_results: int = 10,
    categories: str = "general",
    time_range: str = None,
    engines: str = None,
    language: str = "en"
) -> list[dict]:
    """
    Async wrapper za SearXNG search.
    Vraća listu scorovanih i sortiranih rezultata.
    """
    params = {
        "q": query,
        "format": "json",
        "categories": categories,
        "language": language,
        "safesearch": "0",
    }
    if time_range:
        params["time_range"] = time_range
    if engines:
        params["engines"] = engines

    try:
        # requests je blocking — wrapaj u thread
        response = await asyncio.to_thread(
            requests.get,
            f"{SEARXNG_URL}/search",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        raw_results = data.get("results", [])

        # Score i sortiraj
        scored = sorted(raw_results, key=score_result, reverse=True)

        return [
            {
                "title":   r.get("title", ""),
                "url":     r.get("url", ""),
                "snippet": r.get("content", ""),
                "engine":  r.get("engine", ""),
                "tier":    tier_label(score_result(r)),
            }
            for r in scored[:max_results]
        ]

    except requests.exceptions.ConnectionError:
        logger.error(f"[searxng] Cannot connect to SearXNG at {SEARXNG_URL}")
        return []
    except Exception as e:
        logger.error(f"[searxng] Search failed: {e}")
        return []


async def searxng_news(
    query: str,
    max_results: int = 5,
    time_range: str = "month"
) -> list[dict]:
    """News search — koristi 'news' kategoriju."""
    return await searxng_search(
        query=query,
        max_results=max_results,
        categories="news",
        time_range=time_range
    )
```

### Intent-based routing (zamjenjuje smart_search iz search.py)

```python
from intent import classify_intent

async def smart_search(
    query: str,
    max_results: int = 8,
    intent: str = None
) -> list[dict]:
    """
    Glavni search entry point — routira na pravi tip searcha.
    Zamjenjuje DDGS-based smart_search.
    """
    if intent is None:
        intent = classify_intent(query)

    logger.info(f"[searxng] intent={intent!r} query={query[:80]!r}")

    if intent == "news":
        return await searxng_news(query, max_results=max_results, time_range="week")

    elif intent == "training":
        # Preferiraj science/health engine-e
        return await searxng_search(
            query=query,
            max_results=max_results,
            engines="google,brave,bing",
            time_range="year"
        )

    elif intent == "stats":
        return await searxng_search(
            query=query,
            max_results=max_results,
            engines="google,bing"
        )

    else:
        # general
        return await searxng_search(query=query, max_results=max_results)
```

---

## Settings.yml — Konfiguracija za Risbo

Spremi kao `searxng/core-config/settings.yml`:

```yaml
use_default_settings: true

general:
  debug: false
  instance_name: "Risbo Search"

search:
  safe_search: 0
  autocomplete: ""
  default_lang: "en"
  formats:
    - html
    - json      # OBAVEZNO za API
    - csv
    - rss

server:
  secret_key: "PROMIJENI_OVO_U_RANDOM_STRING"
  limiter: false     # isključi rate limiter (ti kontrolišeš ko ima pristup)
  public_instance: false

# Engine-i za sports/science use case
engines:
  - name: google
    engine: google
    categories: general
    use_mobile_ui: false
    disabled: false

  - name: bing
    engine: bing
    categories: general
    disabled: false

  - name: brave
    engine: brave
    categories: general, news
    disabled: false

  - name: duckduckgo
    engine: duckduckgo
    categories: general, news
    disabled: false

  - name: google news
    engine: google_news
    categories: news
    disabled: false

  - name: pubmed
    engine: pubmed
    categories: science
    disabled: false

  - name: semantic scholar
    engine: semantic_scholar
    categories: science
    disabled: false
```

---

## Zdravstvena provjera (health check)

```python
async def check_searxng_health() -> bool:
    """Provjeri da li je SearXNG dostupan."""
    try:
        response = await asyncio.to_thread(
            requests.get,
            f"{SEARXNG_URL}/search",
            params={"q": "test", "format": "json"},
            timeout=5
        )
        return response.status_code == 200
    except Exception:
        return False

# U FastAPI startup event:
@app.on_event("startup")
async def startup():
    healthy = await check_searxng_health()
    if not healthy:
        logger.warning(f"[searxng] NOT REACHABLE at {SEARXNG_URL}")
    else:
        logger.info(f"[searxng] OK at {SEARXNG_URL}")
```

---

## Fallback strategija (DDGS backup)

Ako SearXNG nije dostupan, fallback na DDGS:

```python
async def smart_search_with_fallback(query: str, max_results: int = 8, intent: str = None):
    # Pokušaj SearXNG
    results = await smart_search(query, max_results, intent)

    if not results:
        logger.warning("[searxng] No results, falling back to DDGS")
        try:
            from ddgs import DDGS
            raw = await asyncio.to_thread(
                lambda: list(DDGS().text(query, max_results=max_results * 2))
            )
            results = [
                {
                    "title":   r.get("title", ""),
                    "url":     r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "engine":  "ddgs",
                    "tier":    tier_label(score_result({"url": r.get("href", "")})),
                }
                for r in raw[:max_results]
            ]
        except Exception as e:
            logger.error(f"[ddgs fallback] also failed: {e}")

    return results
```

---

## Česte greške i rješenja

| Greška | Uzrok | Fix |
|--------|-------|-----|
| `403 Forbidden` | JSON format nije u settings.yml | Dodaj `json` u `search.formats` |
| `ConnectionRefused` | SearXNG nije pokrenut | `docker compose up -d` |
| `ConnectionRefused` u Dockeru | Koristiš `localhost` umjesto service name | Promijeni u `http://searxng:8080` |
| Prazni rezultati `[]` | Engine timeout ili blokiran | Provjeri `docker compose logs searxng` |
| Spori odgovori | Previše engine-a paralelno | Smanji broj engine-a u query |

---

## Docker Management komande

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs (live)
docker compose logs -f searxng

# Restart (nakon promjene settings.yml)
docker compose restart searxng

# Update na novu verziju
docker compose down
docker compose pull
docker compose up -d

# Shell u kontejneru (debugging)
docker compose exec -it --user root searxng /bin/sh
```

---

## Minimalni test — provjeri da radi

```python
import asyncio

async def test():
    # Test 1 — basic search
    results = await searxng_search("Serbian SuperLiga football standings 2025")
    assert len(results) > 0, "Search returned no results"
    print(f"✓ Text search: {len(results)} rezultata")
    print(f"  Top: {results[0]['url']} [{results[0]['tier']}]")

    # Test 2 — news
    news = await searxng_news("Mbappe injury", time_range="week")
    assert len(news) > 0, "News returned no results"
    print(f"✓ News search: {len(news)} vijesti")

    # Test 3 — health check
    healthy = await check_searxng_health()
    assert healthy, "SearXNG health check failed"
    print(f"✓ Health check: OK")

    print("\nSearXNG radi ispravno.")

if __name__ == "__main__":
    asyncio.run(test())
```

---

## Env varijable

`.env` fajl u ai-backendu:

```env
SEARXNG_URL=http://searxng:8080   # u Docker Compose setup-u
# SEARXNG_URL=http://localhost:8080  # lokalno van Dockera
```

---

## Napomene za Claude Code

- **Uvijek koristi `asyncio.to_thread()`** za `requests.get()` pozive — requests je blocking library
- **Nikad ne koristiš `localhost`** za SearXNG URL unutar Docker Compose-a, uvijek ime servisa
- **JSON format mora biti u `settings.yml`** — bez toga API vraća 403
- **`limiter: false`** u settings.yml — jer je ovo privatna instanca, ne public
- **SearXNG vraća `url` ne `href`** — razlika od DDGS response formata
- Ako implementiraš fallback na DDGS, pazi da score_result() handla oba formata (`href` i `url`)