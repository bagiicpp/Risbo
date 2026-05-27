import os
import time
import pandas as pd
# Uvozimo zvanične endpoint-e za timsku i igračku statistiku
from nba_api.stats.endpoints import leaguedashteamstats, leaguedashplayerstats

# Tvoja tačna apsolutna putanja do wiki foldera
WIKI_DIR = r"C:\Users\Sekulovic\Desktop\FAKULTET\2. GODINA\2. Semestar\Praktikum\ai-backend\wiki"

def fetch_nba_team_stats(season="2025-26"):
    print(f"🏀 Povlačim timsku statistiku za sezonu {season}...")
    try:
        # Pozivamo NBA API za timove
        raw_data = leaguedashteamstats.LeagueDashTeamStats(season=season, timeout=30)
        df = raw_data.get_data_frames()[0]
        
        # Biramo najvažnije kolone koje su potrebne tvom AI agentu za analizu timova
        columns_to_keep = [
            'TEAM_NAME', 'GP', 'W', 'L', 'W_PCT', 'PTS', 'FG_PCT', 'FG3_PCT', 'REB', 'AST', 'TOV'
        ]
        df_filtered = df[columns_to_keep]
        
        # Sortiramo tabelu tako da najbolji timovi budu na vrhu (po procentu pobeda)
        df_sorted = df_filtered.sort_values(by='W_PCT', ascending=False)
        
        # Preimenujemo kolone u čitljiv engleski format za Wiki
        df_sorted.columns = ['Team Name', 'Games Played', 'Wins', 'Losses', 'Win %', 'Points/G', 'FG %', '3P %', 'Rebounds', 'Assists', 'Turnovers']
        
        # Pretvaramo u Markdown tabelu
        markdown_content = f"# 🏆 NBA TEAMS STATS - SEASON {season}\n\n"
        markdown_content += f"Izvor: Zvanični NBA.com Stats API\n\n"
        markdown_content += df_sorted.to_markdown(index=False)
        
        # Upisivanje u fajl
        file_path = os.path.join(WIKI_DIR, "nba_teams_scouting.md")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"✅ Uspešno upisana statistika timova u: {file_path}")
        
    except Exception as e:
        print(f"❌ Greška pri povlačenju timova: {e}")

def fetch_nba_player_stats(season="2025-26", top_n=50):
    print(f"🏀 Povlačim igračku statistiku za sezonu {season} (Top {top_n} igrača)...")
    try:
        # Pozivamo NBA API za igrače
        raw_data = leaguedashplayerstats.LeagueDashPlayerStats(season=season, timeout=30)
        df = raw_data.get_data_frames()[0]
        
        # Selektujemo ključne skauting parametre za igrače
        columns_to_keep = [
            'PLAYER_NAME', 'TEAM_ABBREVIATION', 'GP', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'TOV'
        ]
        df_filtered = df[columns_to_keep]
        
        # Sortiramo po poenima da dobijemo najbolje poentere na vrhu
        df_sorted = df_filtered.sort_values(by='PTS', ascending=False).head(top_n)
        
        # Sređujemo nazive kolona
        df_sorted.columns = ['Player Name', 'Team', 'GP', 'Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', 'FG %', '3P %', 'Turnovers']
        
        # Generisanje Markdown-a
        markdown_content = f"# 🏀 NBA PLAYERS SCOUTING - TOP {top_n} PERFORMANCE\n\n"
        markdown_content += f"Izvor: Zvanični NBA.com Stats API\n\n"
        markdown_content += df_sorted.to_markdown(index=False)
        
        # Upisivanje u fajl
        file_path = os.path.join(WIKI_DIR, "nba_players_scouting.md")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"✅ Uspešno upisana statistika igrača u: {file_path}")
        
    except Exception as e:
        print(f"❌ Greška pri povlačenju igrača: {e}")

if __name__ == "__main__":
    print("🚀 Pokrećem preuzimanje podataka sa zvaničnog NBA API-ja...")
    
    # Automatski kreiramo wiki folder ako iz nekog razloga ne postoji na toj putanji
    os.makedirs(WIKI_DIR, exist_ok=True)
    
    # Pokrećemo obe funkcije
    fetch_nba_team_stats()
    
    # Mala pauza od 2 sekunde između zahteva da nas NBA server ne bi privremeno blokirao zbog prebrzih uzastopnih upita
    time.sleep(2) 
    
    fetch_nba_player_stats()
    
    print("\n🏆 Sve operacije završene! Proveri svoj 'wiki' folder unutar 'ai-backend'-a.")