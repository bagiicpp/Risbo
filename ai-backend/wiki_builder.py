import os
import requests

def build_markdown_from_api(
    url: str, 
    headers: dict, 
    params: dict,
    data_extractor,
    row_formatter,
    title: str, 
    table_headers: list, 
    filename: str
):
    """Univerzalna funkcija za preuzimanje API podataka i generisanje Markdown fajla."""
    print(f"➡️ Povlačim podatke: {title}...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"❌ Greška {response.status_code}: {response.text}")
        return
        
    data = response.json()
    items = data_extractor(data)
    
    # Početak Markdown fajla
    md_content = f"# {title}\n\nIzvor: {url}\n\n"
    md_content += "| " + " | ".join(table_headers) + " |\n"
    md_content += "| " + " | ".join(["---"] * len(table_headers)) + " |\n"
    
    for item in items:
        row = row_formatter(item)
        md_content += "| " + " | ".join(str(x) for x in row) + " |\n"
        
    # Čuvanje fajla u wiki folder unutar kontejnera
    wiki_dir = os.path.join(os.path.dirname(__file__), "wiki")
    os.makedirs(wiki_dir, exist_ok=True)
    
    with open(os.path.join(wiki_dir, filename), "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print(f"✅ Uspešno kreiran fajl: {filename}\n")

def run_all_apis():
    API_KEY = "a9fc9c9ad295b1b51f99af7b342d290e"
    HEADERS = {'x-apisports-key': API_KEY}
    
    # 1. Prikupi lige
    build_markdown_from_api(
        url="https://v3.football.api-sports.io/leagues",
        headers=HEADERS,
        params={},
        data_extractor=lambda json_data: json_data.get('response', [])[:20],
        row_formatter=lambda item: [item['league']['name'], item['country']['name'], item['league']['type'], item['league']['id']],
        title="⚽ AI SKAUTING WIKI - LISTA LIGA",
        table_headers=["Naziv Lige", "Zemlja", "Tip Takmičenja", "ID Lige"],
        filename="fudbal.md"
    )
    
    # 2. Prikupi poslednje rezultate za Premier League (Liga ID: 39)
    build_markdown_from_api(
        url="https://v3.football.api-sports.io/fixtures",
        headers=HEADERS,
        params={"league": 39, "season": 2023, "last": 20}, # Skida zadnjih 20 odigranih mečeva
        data_extractor=lambda json_data: json_data.get('response', []),
        row_formatter=lambda item: [
            item['fixture']['date'][:10], # Uzimamo samo datum (YYYY-MM-DD)
            item['teams']['home']['name'],
            f"{item['goals']['home']} - {item['goals']['away']}", # Formatiramo rezultat npr. "2 - 1"
            item['teams']['away']['name'],
            item['fixture']['status']['short'] # FT (Full Time)
        ],
        title="🇬🇧 PREMIER LEAGUE - POSLEDNJI REZULTATI",
        table_headers=["Datum", "Domaćin", "Rezultat", "Gost", "Status"],
        filename="rezultati_premier.md"
    )

if __name__ == "__main__":
    run_all_apis()