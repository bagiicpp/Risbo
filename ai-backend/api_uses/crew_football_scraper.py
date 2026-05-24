import os
import time
import requests
import re

# 1. Konfiguracija liga
LEAGUES = [
    # ── 2021-22 ────────────────────────────────────────────────
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/1-premierleague.txt",
        "filename": "england_premierleague_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND PREMIER LEAGUE (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/2-championship.txt",
        "filename": "england_championship_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND CHAMPIONSHIP (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/3-league1.txt",
        "filename": "england_league1_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE ONE (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/4-league2.txt",
        "filename": "england_league2_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE TWO (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/5-nationalleague.txt",
        "filename": "england_nationalleague_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND NATIONAL LEAGUE (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/eflcup.txt",
        "filename": "england_eflcup_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND EFL CUP (2021/22)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2021-22/facup.txt",
        "filename": "england_facup_2021_22.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND FA CUP (2021/22)"
    },

    # ── 2022-23 ────────────────────────────────────────────────
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/1-premierleague.txt",
        "filename": "england_premierleague_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND PREMIER LEAGUE (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/2-championship.txt",
        "filename": "england_championship_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND CHAMPIONSHIP (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/3-league1.txt",
        "filename": "england_league1_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE ONE (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/4-league2.txt",
        "filename": "england_league2_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE TWO (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/5-nationalleague.txt",
        "filename": "england_nationalleague_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND NATIONAL LEAGUE (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/eflcup.txt",
        "filename": "england_eflcup_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND EFL CUP (2022/23)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2022-23/facup.txt",
        "filename": "england_facup_2022_23.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND FA CUP (2022/23)"
    },

    # ── 2023-24 ────────────────────────────────────────────────
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/1-premierleague.txt",
        "filename": "england_premierleague_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND PREMIER LEAGUE (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/2-championship.txt",
        "filename": "england_championship_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND CHAMPIONSHIP (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/3-league1.txt",
        "filename": "england_league1_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE ONE (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/4-league2.txt",
        "filename": "england_league2_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE TWO (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/5-nationalleague.txt",
        "filename": "england_nationalleague_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND NATIONAL LEAGUE (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/eflcup.txt",
        "filename": "england_eflcup_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND EFL CUP (2023/24)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2023-24/facup.txt",
        "filename": "england_facup_2023_24.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND FA CUP (2023/24)"
    },

    # ── 2024-25 ────────────────────────────────────────────────
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/1-premierleague.txt",
        "filename": "england_premierleague_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND PREMIER LEAGUE (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/2-championship.txt",
        "filename": "england_championship_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND CHAMPIONSHIP (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/3-league1.txt",
        "filename": "england_league1_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE ONE (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/4-league2.txt",
        "filename": "england_league2_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE TWO (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/5-nationalleague.txt",
        "filename": "england_nationalleague_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND NATIONAL LEAGUE (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/eflcup.txt",
        "filename": "england_eflcup_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND EFL CUP (2024/25)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2024-25/facup.txt",
        "filename": "england_facup_2024_25.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND FA CUP (2024/25)"
    },

    # ── 2025-26 ────────────────────────────────────────────────
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/1-premierleague.txt",
        "filename": "england_premierleague_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND PREMIER LEAGUE (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/2-championship.txt",
        "filename": "england_championship_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND CHAMPIONSHIP (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/3-league1.txt",
        "filename": "england_league1_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE ONE (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/4-league2.txt",
        "filename": "england_league2_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND LEAGUE TWO (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/5-nationalleague.txt",
        "filename": "england_nationalleague_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND NATIONAL LEAGUE (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/eflcup.txt",
        "filename": "england_eflcup_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND EFL CUP (2025/26)"
    },
    {
        "url": "https://github.com/openfootball/england/blob/master/2025-26/facup.txt",
        "filename": "england_facup_2025_26.md",
        "title": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND FA CUP (2025/26)"
    },
]

def parse_matches_to_markdown(raw_text: str) -> str:
    """Parsira OpenFootball plain-text i pretvara u Markdown tabelu."""
    md_content = "| Datum | Domaći Tim | Rezultat | Gostujući Tim |\n"
    md_content += "|---|---|---|---|\n"
    
    current_date = "N/A"
    # Detektuje datume (sa ili bez [] zagrada) koji počinju sa danom u nedelji
    date_pattern = re.compile(r'^\[?(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(.*?)\]?$')
    
    # Detektuje rezultat (npr. "1-2" ili "-") i opciono guta poluvreme "(0-0)" da ga obrišemo
    score_pattern = re.compile(r'\s+(\d{1,2}-\d{1,2}|\-)(?:\s+\(\d{1,2}-\d{1,2}\))?')
    
    for line in raw_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("»"):
            continue
            
        # Da li je linija zapravo datum?
        date_match = date_pattern.match(line)
        if date_match:
            current_date = f"{date_match.group(1)} {date_match.group(2).strip()}"
            continue
                
        # Uklanjamo vreme (npr. "20.00 ", "12.30 ") sa početka linije
        line = re.sub(r'^\d{1,2}\.\d{2}\s+', '', line)
        
        # Pokušaj da nađeš rezultat
        score_match = score_pattern.search(line)
        if score_match:
            score = score_match.group(1).strip()
            teams_part = line[:score_match.start()].strip()
            away_part = line[score_match.end():].strip()
            
            if ' v ' in teams_part:  # Novi format (Ipswich Town FC v Liverpool FC)
                home_team, away_team = [t.strip() for t in teams_part.split(' v ', 1)]
            else:                    # Stari format (Brentford FC  2-0  Arsenal FC)
                home_team, away_team = teams_part, away_part
                
            md_content += f"| {current_date} | {home_team} | {score} | {away_team} |\n"
                
    return md_content

def run_scraper():
    print("🔥 Startujem Fast Python Football Scraper...")
    wiki_dir = os.path.join(os.path.dirname(__file__), "..", "wiki")
    os.makedirs(wiki_dir, exist_ok=True)
    
    # Prolazimo kroz sve lige
    for idx, league in enumerate(LEAGUES):
        print(f"\n⏳ [{idx+1}/{len(LEAGUES)}] Procesiram ligu: {league['title']}...")
        
        # Dinamično pravljenje podfoldera na osnovu URL-a
        parts = league['url'].split("/")
        country = parts[4]  # npr. 'england'
        season = parts[7]   # npr. '2025-26'
        filename = parts[8].replace(".txt", ".md") # npr. '1-premierleague.md'
        
        file_dir = os.path.join(wiki_dir, country, season)
        os.makedirs(file_dir, exist_ok=True)

        filepath = os.path.join(file_dir, filename)
        if os.path.exists(filepath):
            print(f"⏭️  Preskačem (već postoji): {filepath}")
            continue
            
        # Preuzimanje i parsiranje umesto CrewAI agenta
        raw_url = league['url'].replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
        response = requests.get(raw_url)
        if response.status_code == 200:
            markdown_table = parse_matches_to_markdown(response.text)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"# {league['title']}\n\nIzvor (Python Scraper): {league['url']}\n\n{markdown_table}")
                
            print(f"✅ Fajl sačuvan u: {filepath}")
        else:
            print(f"❌ Greška pri preuzimanju: {response.status_code}")
            
        time.sleep(0.5) # Minimalna pauza

if __name__ == "__main__":
    run_scraper()