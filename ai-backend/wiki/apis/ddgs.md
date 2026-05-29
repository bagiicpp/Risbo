# DDGS Implementation Reference
> Kompletna referenca za Claude Code — sve što trebaš znati za maksimalne rezultate

---

## Što je DDGS

**DDGS (Dux Distributed Global Search)** je metasearch Python library koji agregira rezultate iz više search engine-a odjednom. Nema API key-a, nema registracije, radi odmah nakon instalacije.

```
tvoj kod → DDGS → [bing, brave, duckduckgo, google, startpage, yahoo, yandex...]
                           ↓
                   agregirani rezultati
```

GitHub: https://github.com/deedy5/ddgs  
Disclaimer: Library je za edukativne svrhe — direktno scrapeuje search engine-e (grey area).

---

## Instalacija

```bash
pip install -U ddgs          # osnovno — uvijek ovo
pip install -U ddgs[api]     # ako trebaš REST API server (FastAPI)
pip install -U ddgs[mcp]     # ako trebaš MCP server za Claude Desktop
```

---

## DDGS Class

```python
from ddgs import DDGS

# Osnovno — bez argumenata
ddgs = DDGS()

# Sa proxy-jem (ako te throttlaju)
ddgs = DDGS(
    proxy="socks5h://127.0.0.1:9150",  # http/https/socks5
    timeout=10,                         # default: 5 sekundi
    verify=True                         # SSL verify: True/False/path-to-pem
)
```

DDGS je lazy-loaded — inicijalizacija ne pravi request.  
Koristi `with` ili direktno: `DDGS().text(...)` — oba su ispravna.

---

## 6 Metoda — Potpuna Referenca

---

### 1. `text()` — Web Search

Glavni alat. Podržava najviše backends.

```python
results = DDGS().text(
    query="sprint mechanics first step",
    region="us-en",        # us-en, uk-en, de-de, hr-hr, bs-ba...
    safesearch="moderate", # "on" | "moderate" | "off"
    timelimit=None,        # None | "d" (dan) | "w" (tjedan) | "m" (mjesec) | "y" (godina)
    max_results=10,        # broj rezultata
    page=1,                # paginacija
    backend="auto"         # vidi Backends sekciju
)
```

**Response format:**
```python
[
    {
        "title": "Sprint Mechanics: The First Step",
        "href": "https://simplifaster.com/articles/sprint-mechanics/",
        "body": "snippet teksta sa stranice..."
    },
    ...
]
```

**Primjeri query-ja:**
```python
# Standardni search
DDGS().text("inseason load management football")

# Fileype filter — samo PDF-ovi
DDGS().text("periodization strength training filetype:pdf")

# Site filter — samo jedan sajt
DDGS().text("plyometrics site:simplifaster.com")

# Vremenski ograničen — zadnji tjedan
DDGS().text("Vinicius performance", timelimit="w")

# Maksimalni coverage — više backends
DDGS().text("sprint mechanics", backend="google,brave,bing", max_results=20)
```

---

### 2. `news()` — News Search

Za live vijesti o igračima, transferima, formama.

```python
results = DDGS().news(
    query="Mbappe injury update",
    region="us-en",
    safesearch="off",
    timelimit="w",    # "d" | "w" | "m" — nema "y"
    max_results=10,
    page=1,
    backend="auto"    # bing | duckduckgo | yahoo
)
```

**Response format:**
```python
[
    {
        "date": "2025-01-15T14:30:00+00:00",
        "title": "Mbappe returns to training",
        "body": "Real Madrid forward...",
        "url": "https://bbc.com/sport/...",
        "image": "https://...",
        "source": "BBC Sport"
    },
    ...
]
```

---

### 3. `extract()` — Fetchaj i Parsiraj URL

**Najvažnija metoda za wiki building.** Zamjenjuje requests + BeautifulSoup.

```python
result = DDGS().extract(
    url="https://simplifaster.com/articles/load-management-sport/",
    fmt="text_markdown"  # vidi formate ispod
)

print(result["url"])      # originalni URL
print(result["content"])  # sadržaj u traženom formatu
```

**Formati:**
| fmt | Opis | Kada koristiti |
|-----|------|---------------|
| `"text_markdown"` | HTML → Markdown, čuva linkove/headere/liste | **Default — za wiki** |
| `"text_plain"` | HTML → plain text, bez formatiranja | Za LLM processing |
| `"text_rich"` | HTML → headeri i liste, bez URL-ova | Za čitljivost |
| `"text"` | Raw HTML | Ako trebaš parsirati sam |
| `"content"` | Raw bytes | Za binarne fajlove |

**Praktičan workflow — search + extract:**
```python
from ddgs import DDGS
import time

def search_and_extract(query, trusted_domains=None, max_results=5):
    ddgs = DDGS()
    
    # 1. Pretraži
    raw = ddgs.text(query, max_results=max_results * 2, backend="auto")
    
    # 2. Prioritiziraj pouzdane domene
    if trusted_domains:
        def score(r):
            return next((v for k, v in trusted_domains.items() if k in r["href"]), 0)
        raw = sorted(raw, key=score, reverse=True)
    
    results = []
    for r in raw[:max_results]:
        try:
            # 3. Fetchaj sadržaj
            content = ddgs.extract(r["href"], fmt="text_markdown")
            r["full_content"] = content["content"]
            results.append(r)
            time.sleep(0.5)  # pauza između requestova
        except Exception as e:
            r["full_content"] = r["body"]  # fallback na snippet
            results.append(r)
    
    return results
```

---

### 4. `images()` — Image Search

```python
results = DDGS().images(
    query="sprint mechanics diagram",
    region="us-en",
    safesearch="moderate",
    timelimit=None,
    max_results=10,
    page=1,
    backend="auto",           # bing | duckduckgo
    size=None,                # "Small" | "Medium" | "Large" | "Wallpaper"
    color=None,               # "color" | "Monochrome" | "Red" | ...
    type_image=None,          # "photo" | "clipart" | "gif" | "transparent" | "line"
    layout=None,              # "Square" | "Tall" | "Wide"
    license_image=None        # "any" | "Public" | "Share" | "Modify" | ...
)
```

**Response:** `[{title, image(url), thumbnail, url, height, width, source}, ...]`

---

### 5. `videos()` — Video Search

```python
results = DDGS().videos(
    query="plyometrics progression tutorial",
    region="us-en",
    safesearch="off",
    timelimit="m",
    max_results=5,
    page=1,
    backend="auto",          # samo duckduckgo
    resolution=None,         # "high" | "standart"
    duration=None,           # "short" | "medium" | "long"
    license_videos=None      # "creativeCommon" | "youtube"
)
```

**Response:** `[{title, content(url), duration, embed_url, description, publisher, ...}, ...]`

---

### 6. `books()` — Book Search (Anna's Archive)

```python
results = DDGS().books(
    query="Tudor Bompa periodization",
    max_results=10,
    page=1,
    backend="auto"  # samo annasarchive
)
```

**Response:** `[{title, author, publisher, info, url, thumbnail}, ...]`

Korisno za pronalaženje S&C knjiga u PDF formatu.

---

## Backends — Detaljno

### Dostupni backends po metodi

| Metoda | Backends |
|--------|----------|
| `text()` | `bing`, `brave`, `duckduckgo`, `google`, `grokipedia`, `mojeek`, `startpage`, `yandex`, `yahoo`, `wikipedia` |
| `news()` | `bing`, `duckduckgo`, `yahoo` |
| `images()` | `bing`, `duckduckgo` |
| `videos()` | `duckduckgo` |
| `books()` | `annasarchive` |

### Kako koristiti backends

```python
# Auto — DDGS bira, rotira backends
DDGS().text("query", backend="auto")

# Jedan specifičan
DDGS().text("query", backend="google")

# Više odjednom — bolji coverage
DDGS().text("query", backend="google,brave,bing")

# Za vijesti — sve backends
DDGS().news("player news", backend="bing,duckduckgo,yahoo")
```

### Preporuke po use case-u

| Use case | Preporučeni backend |
|----------|-------------------|
| S&C wiki knowledge | `"google,brave"` |
| Live player news | `"bing,duckduckgo"` |
| Academic/research | `"google,startpage"` |
| Broad coverage | `"auto"` |

---

## Soft Trust Signaling — Implementacija

Preferiraj poznate pouzdane domene bez hard whitelist-e:

```python
TRUSTED_DOMAINS = {
    # Training/S&C
    "simplifaster.com": 3,
    "scienceforsport.com": 3,
    "elitefts.com": 2,
    "t-nation.com": 2,
    "altis.world": 2,
    "strengthcoach.com": 2,
    
    # Nutrition
    "examine.com": 3,
    "precisionnutrition.com": 2,
    
    # Football Analytics
    "statsbomb.com": 3,
    "fbref.com": 2,
    "americansocceranalysis.com": 2,
    
    # Academic
    "pubmed.ncbi.nlm.nih.gov": 3,
    "journals.lww.com": 2,
}

SPAM_PENALTIES = {
    "pinterest.com": -10,
    "quora.com": -5,
    "reddit.com": -3,
    "wikihow.com": -3,
}

def score_result(result):
    url = result.get("href", result.get("url", ""))
    score = 0
    for domain, bonus in TRUSTED_DOMAINS.items():
        if domain in url:
            score += bonus
            break
    for domain, penalty in SPAM_PENALTIES.items():
        if domain in url:
            score += penalty
            break
    return score

def smart_search(query, max_results=10):
    raw = DDGS().text(query, max_results=max_results * 2, backend="auto")
    scored = sorted(raw, key=score_result, reverse=True)
    return scored[:max_results]
```

---

## Throttling i Rate Limiting

DDGS scrapeuje direktno — ponekad search engine-i throttlaju.

### Znakovi throttlinga
- Prazni rezultati (`[]`)
- Exception s 202/429 status kodom
- Sporiji odgovori

### Rješenja

```python
import time
from ddgs import DDGS

# 1. Sleep između upita
results = []
for query in queries:
    r = DDGS().text(query, max_results=5)
    results.extend(r)
    time.sleep(1)  # minimum 1 sekunda

# 2. Proxy rotacija
ddgs = DDGS(proxy="socks5h://127.0.0.1:9150")

# 3. Retry logika
import time

def safe_search(query, retries=3):
    for attempt in range(retries):
        try:
            return DDGS().text(query, max_results=10)
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # exponential backoff
            else:
                return []
```

---

## MongoDB Caching Integracija

Kombiniraj DDGS sa MongoDB cache-om da izbjegneš ponovljene upite:

```python
from pymongo import MongoClient
from ddgs import DDGS
from datetime import datetime, timedelta
import time

client = MongoClient("mongodb://localhost:27017/")
db = client.risbo

# TTL index — automatski briše stare podatke
db.search_cache.create_index("fetched_at", expireAfterSeconds=86400)  # 24h

def cached_search(query, cache_hours=24):
    # Provjeri cache
    cached = db.search_cache.find_one({
        "query": query,
        "fetched_at": {"$gte": datetime.now() - timedelta(hours=cache_hours)}
    })
    
    if cached:
        return cached["results"]
    
    # Nije u cache-u — pretraži
    results = DDGS().text(query, max_results=10, backend="auto")
    
    # Spremi u cache
    db.search_cache.insert_one({
        "query": query,
        "results": results,
        "fetched_at": datetime.now()
    })
    
    return results

def cached_news(player_name, cache_hours=6):
    cached = db.news_cache.find_one({
        "player": player_name,
        "fetched_at": {"$gte": datetime.now() - timedelta(hours=cache_hours)}
    })
    
    if cached:
        return cached["results"]
    
    results = DDGS().news(f"{player_name} latest news", timelimit="w", max_results=5)
    
    db.news_cache.insert_one({
        "player": player_name,
        "results": results,
        "fetched_at": datetime.now()
    })
    
    return results
```

---

## CrewAI Integracija

### Opcija A — Custom Tool (preporučeno za kontrolu)

```python
from crewai.tools import BaseTool
from ddgs import DDGS
from pydantic import BaseModel, Field
import time

class SearchInput(BaseModel):
    query: str = Field(description="Search query")
    search_type: str = Field(default="text", description="text | news | books")
    timelimit: str = Field(default=None, description="d | w | m | y")

class DDGSSearchTool(BaseTool):
    name: str = "ddgs_search"
    description: str = "Search the web for sports science, S&C protocols, player news"
    args_schema: type[BaseModel] = SearchInput
    
    TRUSTED = {
        "simplifaster.com": 3, "scienceforsport.com": 3,
        "examine.com": 3, "statsbomb.com": 3,
        "elitefts.com": 2, "pubmed.ncbi.nlm.nih.gov": 2,
    }
    
    def _run(self, query: str, search_type: str = "text", timelimit: str = None):
        ddgs = DDGS()
        
        if search_type == "news":
            results = ddgs.news(query, timelimit=timelimit or "w", max_results=5)
        elif search_type == "books":
            results = ddgs.books(query, max_results=5)
        else:
            raw = ddgs.text(query, timelimit=timelimit, max_results=20, backend="auto")
            results = sorted(raw, 
                           key=lambda r: next((v for k,v in self.TRUSTED.items() 
                                             if k in r["href"]), 0), 
                           reverse=True)[:10]
        
        time.sleep(0.5)
        return results


class DDGSExtractTool(BaseTool):
    name: str = "ddgs_extract"
    description: str = "Fetch full content of a URL and return as markdown"
    
    def _run(self, url: str):
        try:
            result = DDGS().extract(url, fmt="text_markdown")
            return result["content"][:5000]  # limit za context window
        except Exception as e:
            return f"Failed to extract: {str(e)}"
```

### Opcija B — Native CrewAI DDG Tool

```python
from crewai_tools import DuckDuckGoSearchRun

# Jednostavno, ali manje kontrole
search_tool = DuckDuckGoSearchRun()
```

### Agent setup

```python
from crewai import Agent

teoreticar = Agent(
    role="Sports Science Researcher",
    goal="Find evidence-based S&C protocols and training methodologies",
    backstory="Expert in strength and conditioning, sports nutrition, and athletic performance",
    tools=[DDGSSearchTool(), DDGSExtractTool()],
    verbose=True
)

operativac = Agent(
    role="Player Intelligence Analyst", 
    goal="Find latest news, form, injuries and performance data for specific players",
    backstory="Scout with access to live sports news and analytics",
    tools=[DDGSSearchTool()],
    verbose=True
)
```

---

## Wiki Builder — Kompletna Implementacija

```python
import os
import time
from pathlib import Path
from ddgs import DDGS

WIKI_SOURCES = {
    "training/sprint_mechanics.md": [
        "sprint mechanics first step acceleration",
        "sprint technique biomechanics coaching cues site:simplifaster.com",
        "speed development drills acceleration",
    ],
    "training/strength_periodization.md": [
        "5/3/1 program westside conjugate periodization",
        "block periodization strength sports site:simplifaster.com",
        "strength training periodization football basketball",
    ],
    "training/plyometrics_progression.md": [
        "plyometrics progression beginner to advanced",
        "reactive strength index plyometric training site:simplifaster.com",
        "jump training progression athletes",
    ],
    "training/inseason_load_management.md": [
        "inseason load management team sports",
        "acute chronic workload ratio monitoring site:simplifaster.com",
        "training load management football season",
    ],
}

TRUSTED_DOMAINS = {
    "simplifaster.com": 3, "scienceforsport.com": 3,
    "elitefts.com": 2, "altis.world": 2,
    "pubmed.ncbi.nlm.nih.gov": 2, "t-nation.com": 1,
}

def score(r):
    return next((v for k, v in TRUSTED_DOMAINS.items() if k in r["href"]), 0)

def build_wiki_file(filepath, queries):
    ddgs = DDGS()
    content = f"# {Path(filepath).stem.replace('_', ' ').title()}\n\n"
    content += f"*Auto-generated — review before use*\n\n---\n\n"
    
    seen_urls = set()
    
    for query in queries:
        print(f"Searching: {query}")
        
        try:
            raw = ddgs.text(query, max_results=10, backend="auto", timelimit="y")
            top = sorted(raw, key=score, reverse=True)[:2]
            
            for r in top:
                if r["href"] in seen_urls:
                    continue
                seen_urls.add(r["href"])
                
                print(f"  Extracting: {r['href']}")
                try:
                    extracted = ddgs.extract(r["href"], fmt="text_markdown")
                    article_content = extracted["content"][:3000]
                    
                    content += f"## Source: {r['title']}\n"
                    content += f"*URL: {r['href']}*\n\n"
                    content += article_content
                    content += "\n\n---\n\n"
                    
                    time.sleep(1)
                except Exception as e:
                    # Fallback na snippet
                    content += f"## {r['title']}\n"
                    content += f"*URL: {r['href']}*\n\n"
                    content += r["body"] + "\n\n---\n\n"
                    
        except Exception as e:
            print(f"  Search failed: {e}")
        
        time.sleep(1.5)
    
    # Spremi fajl
    os.makedirs(os.path.dirname(f"wiki/{filepath}"), exist_ok=True)
    with open(f"wiki/{filepath}", "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"✓ Saved: wiki/{filepath}")

def build_all():
    for filepath, queries in WIKI_SOURCES.items():
        print(f"\n=== Building {filepath} ===")
        build_wiki_file(filepath, queries)
        time.sleep(2)

if __name__ == "__main__":
    build_all()
```

---

## API Server (opcionalno)

Ako hoćeš REST API umjesto direktnog Python import-a:

```bash
pip install -U ddgs[api]
ddgs api  # pokreće server na localhost:4479
```

Endpoints:
```
GET/POST /search/text?q=sprint+mechanics
GET/POST /search/news?q=mbappe+injury
GET/POST /extract?url=https://simplifaster.com/...
GET      /health
GET      /docs   ← Swagger UI
```

---

## MCP Server (za Claude Desktop)

```bash
pip install -U ddgs[mcp]
```

`~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ddgs": {
      "command": "ddgs",
      "args": ["mcp"]
    }
  }
}
```

Tools koje dobiješ: `search_text`, `search_news`, `search_images`, `search_videos`, `search_books`, `extract_content`

---

## Česte Greške i Rješenja

| Problem | Uzrok | Rješenje |
|---------|-------|----------|
| Prazni rezultati `[]` | Throttling | `time.sleep(2)`, promijeni backend |
| `extract()` vraća malo sadržaja | Anti-bot zaštita sajta | Koristi snippet kao fallback |
| Exception 202/429 | Rate limit | Exponential backoff, proxy |
| Sporo izvršavanje | Previše sequential requestova | Batch queries, async |
| Irrelevantni rezultati | Loš query | Dodaj `site:` filter ili specifičniji query |

---

## Async Verzija (za brži throughput)

```python
import asyncio
from ddgs import AsyncDDGS  # ako postoji u verziji

# Ili manualni threading
from concurrent.futures import ThreadPoolExecutor
import time

def fetch_one(query):
    time.sleep(0.5)
    return DDGS().text(query, max_results=5)

queries = ["sprint mechanics", "load management", "plyometrics"]

with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(fetch_one, queries))
```

---

## Minimalni Test — Provjeri da radi

```python
from ddgs import DDGS

# Test 1 — text search
r = DDGS().text("sprint mechanics football", max_results=3)
assert len(r) > 0
print(f"✓ Text search: {len(r)} rezultata")
print(f"  Top: {r[0]['href']}")

# Test 2 — news
n = DDGS().news("Mbappe news", timelimit="w", max_results=3)
assert len(n) > 0
print(f"✓ News search: {len(n)} vijesti")

# Test 3 — extract
e = DDGS().extract(r[0]["href"], fmt="text_markdown")
assert len(e["content"]) > 100
print(f"✓ Extract: {len(e['content'])} karaktera")

print("\nDDGS radi ispravno.")
```