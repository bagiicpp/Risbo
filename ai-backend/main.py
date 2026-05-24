import asyncio
import json
import os
import glob
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

async def run_scrapers_in_background():
    """Pokreće sve skripte za prikupljanje podataka u pozadini kako ne bi blokiralo paljenje servera."""
    try:
        base_dir = os.path.dirname(__file__)
        wiki_dir = os.path.join(base_dir, "wiki")
        
        print("▶️ Pokrećem Wikipedia Scraper u pozadini...")
        if not os.path.exists(os.path.join(wiki_dir, "standings_serie_b.md")):
            p1 = await asyncio.create_subprocess_exec("python", "wiki_builder.py", cwd=base_dir)
            await p1.wait()
        else:
            print("⏭️ Preskačem Wikipedia Scraper (fajlovi već postoje).")
        
        print("▶️ Pokrećem NBA Scraper u pozadini...")
        # Ako nema NBA igrača, pokreni 'all' da bi se skinuli rosteri, u suprotnom samo 'weekly' tabele
        if not os.path.exists(os.path.join(wiki_dir, "players", "index.md")):
            p2 = await asyncio.create_subprocess_exec("python", "api_uses/nba_builder.py", "--mode", "all", cwd=base_dir)
            await p2.wait()
        else:
            print("⏭️ Preskačem NBA Setup (igrači već postoje). Osvežavam samo nedeljne tabele...")
            p2 = await asyncio.create_subprocess_exec("python", "api_uses/nba_builder.py", "--mode", "weekly", cwd=base_dir)
            await p2.wait()
        
        print("▶️ Pokrećem CrewAI Football Scraper u pozadini...")
        # Naša nova Python skripta već ima ugrađenu logiku (if os.path.exists(filepath): continue)
        p3 = await asyncio.create_subprocess_exec("python", "api_uses/crew_football_scraper.py", cwd=base_dir)
        await p3.wait()
        
        print("✅ Svi Wiki API podaci su uspešno osveženi!")
    except Exception as e:
        print(f"❌ Greška pri pozadinskom skrapovanju: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Započinjem proces osvežavanja podataka (Background Tasks)...")
    # Pokrećemo asinhroni task koji će obraditi sve fajlove nakon što se server upali
    asyncio.create_task(run_scrapers_in_background())
    yield

app = FastAPI(title="Risbo AI - Athlete Specialization", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
async def ping():
    return {"status": "ok", "service": "ai-backend"}

# Initialize the Google GenAI Client
client = genai.Client(api_key=os.getenv("AI_STUDIO_API"))


class ChatRequest(BaseModel):
    prompt: str


ATHLETE_SYSTEM_PROMPT = (
    "You are Risbo, a specialized AI assistant for athletes, coaches, and sports analysts. "
    "Your expertise includes deep knowledge of football (soccer) and basketball players, their detailed statistics, and performance analysis. "
    "You can process and analyze player stats provided in the context (acting as if you are searching the internet or reading provided documents). "
    "You are also skilled at evaluating emerging talents and discussing who looks like the best prospect. "
    "Additionally, you provide rigorous, data-driven advice on improving training, biomechanics, basic nutrition, and recovery. "
    "If a user asks something unrelated to sports, player statistics, or training, politely steer the conversation back to the sports domain."
)

def load_wiki_context() -> str:
    """Učitava sve .md fajlove iz 'wiki' foldera i njegovih podfoldera u jedan veliki string."""
    wiki_dir = os.path.join(os.path.dirname(__file__), "wiki")
    wiki_text = ""
    if os.path.exists(wiki_dir):
        # recursive=True omogućava pretragu kroz sve podfoldere (england/2021-22/...)
        for filepath in glob.glob(os.path.join(wiki_dir, "**", "*.md"), recursive=True):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    # relpath nam daje putanju tipa "england/2021-22/premierleague.md"
                    rel_path = os.path.relpath(filepath, wiki_dir)
                    wiki_text += f"\n\n--- Podaci iz: {rel_path} ---\n"
                    wiki_text += f.read()
            except Exception as e:
                print(f"Greška pri čitanju wiki fajla {filepath}: {e}")
    return wiki_text

async def generate_stream(user_prompt: str):
    try:
        wiki_context = load_wiki_context()
        
        # Spajamo sistemski prompt, celokupnu wiki bazu znanja i korisnički prompt
        combined_prompt = f"{ATHLETE_SYSTEM_PROMPT}\n\n[LLM WIKI BAZA ZNANJA (UVEK KORISTI OVE PODATKE)]:\n{wiki_context}\n\n[KORISNIK]:\n{user_prompt}"

        # Request a stream from the model
        stream = client.models.generate_content_stream(
            model=os.getenv("AI_STUDIO_MODEL", "gemma-4-26b-a4b-it"),
            contents=combined_prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )

        for chunk in stream:
            if chunk.text:
                # SSE standard: data must be prefixed with 'data: ' and end with '\n\n'
                yield f"data: {json.dumps(chunk.text)}\n\n"
                # Small sleep to ensure smooth event loop handling
                await asyncio.sleep(0.01)

    except Exception as e:
        print(f"Streaming Error: {e}")
        yield f"data: {json.dumps(f'**[ERROR]:** {str(e)}')}\n\n"


@app.post("/chat")
async def chat_with_gemma(request: ChatRequest):
    # Verify the API key exists before starting the stream
    if not os.getenv("AI_STUDIO_API"):
        raise HTTPException(
            status_code=500, detail="API Key missing in .env"
        )

    return StreamingResponse(
        generate_stream(request.prompt), media_type="text/event-stream"
    )
