# RizzBo AI — Športni & Analitični Asistent

Specializiran AI asistent za športnike, trenerje in športne analitike, z globokim znanjem o nogometu in košarki, statistiki igralcev ter optimizaciji treninga.

---

## O projektu

Risbo je spletna aplikacija in napredni AI asistent, specializiran za športno analitiko. Njegovo strokovno znanje zajema podrobno poznavanje nogometnih in košarkarskih igralcev, njihovih statistik in analizo uspešnosti. Prav tako je strokovnjak za ocenjevanje prihajajočih talentov in iskanje najboljših prospektov.

Poleg analitike Risbo ponuja stroge, s podatki podprte nasvete za izboljšanje treninga, biomehanike, osnovne prehrane in regeneracije. Aplikacija omogoča nalaganje dokumentov s statistikami, ki jih sistem obdela in analizira ob ohranjanju strogega fokusa na športno domeno.

| Domena                      | Primer uporabe                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Športna analitika**       | Analiza podrobnih statistik (nogomet, košarka), ocena mladih talentov (prospektov).                    |
| **Trening in regeneracija** | Nasveti za trening, biomehaniko, osnovno prehrano in strategije regeneracije.                          |
| **Delo z datotekami**       | Nalaganje dokumentov (npr. .md) s statistikami igralcev kot kontekst za natančne odgovore in skavting. |

---

## Trenutno stanje projekta

Uspešno smo zaključili prvo fazo razvoja in dosegli popolnoma delujoč MVP (Minimum Viable Product).

### MVP funkcionalnosti

- [x] Pogovor z asistentom v naravnem jeziku (chat vmesnik)
- [x] Shranjevanje zgodovine pogovorov v podatkovno bazo
- [x] Iskanje po preteklih pogovorih po ključnih besedah
- [x] Ustvarjanje novih pogovorov po temah
- [x] Nalaganje dokumentov (PDF, Word, Excel)
- [x] Povzemanje naloženih dokumentov
- [x] Odgovarjanje na vprašanja na podlagi vsebine dokumentov
- [x] Izvoz rezultatov (Word, Excel, PDF)
- [x] Enostaven, pregleden in odziven uporabniški vmesnik

---

## Tehnološki sklad

**Frontend:** React + Tailwind CSS + Vite (npm/bun)  
**App Backend:** Python FastAPI + MongoDB  
**AI Backend:** Python FastAPI + Ollama (Lokalni modeli)  
**AI Model:** Gemma 3 (4B) ali katerikoli drug lokalni model  
**Infrastruktura:** Docker + Docker Compose

### Zakaj ta izbor?

| Tehnologija      | Razlog                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| React + Tailwind | Hiter razvoj UI, komponente, responsive design brez napora                              |
| Python FastAPI   | Hiter async REST API, avtomatska OpenAPI dokumentacija, primerno za AI                  |
| Ollama           | Omogoča enostavno poganjanje močnih LLM-jev na lokalnem računalniku (brezplačno, varno) |
| MongoDB          | Fleksibilna NoSQL baza — idealna za shranjevanje pogovorov in dokumentov v JSON obliki  |
| Docker Compose   | Celoten "stack" aplikacije (baza, oba backenda, frontend) se zažene z eno samo komando  |

---

## Arhitektura

```
┌────────────────────────┐      REST      ┌─────────────────┐      REST      ┌──────────────────┐
│   Frontend (Docker)    │ ◄────────────► │   App Backend   │ ◄────────────► │   AI Backend     │
│   React SPA (Vite)     │                │   (Docker)      │                │   (Docker)       │
│   localhost:5173       │                │   localhost:8080│                │   localhost:8000 │
└────────────────────────┘                └────────┬────────┘                └────────┬─────────┘
                                                   │                                  │
                                          ┌────────▼────────┐                ┌────────▼─────────┐
                                          │     MongoDB     │                │  Ollama Server   │
                                          │    (Docker)     │                │  (Host mašina)   │
                                          │ localhost:27017 │                │                  │
                                          └─────────────────┘                └──────────────────┘
```

- **AI Backend** — Upravlja neposredno komunikacijo z vašim lokalnim Ollama strežnikom. Skrbi za sistemski "prompt" in usmerja asistenta k strokovnosti.
- **App Backend** — Poslovna logika aplikacije: baza uporabnikov, avtentikacija (JWT), shranjevanje pogovorov, procesiranje dokumentov.
- **Frontend** — Uporabniški vmesnik, podoben ChatGPT, kjer poteka interakcija z uporabnikom.

---

## Struktura projekta

```
rizzbo/
├── ai-backend/             # FastAPI Google GenAI vmesnik
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── app-backend/            # Glavna poslovna logika in API
│   ├── auth.py
│   ├── main.py
│   ├── models.py
│   ├── utils.py
│   │   tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_chat.py
│   │   ├── test_endpoints.py
│   │   └── test_utils.py
│   ├── Dockerfile
│   ├── requirements-test.txt
│   ├── requirements.txt
│   └── .env
│
├── frontend/               # Uporabniški vmesnik (React/Vite)
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml      # Orkestracija vseh kontejnerjev
├── .gitignore
└── README.md
```

---

## Lokalni zagon (Docker)

Zahvaljujoč Dockerju je zagon celotne aplikacije izjemno preprost. Nič več ročnega zaganjanja vsake skripte posebej!

### 0. Zahteve

Pred začetkom preveri, da imaš nameščeno:

- Veljaven Google Gemini API ključ (AI Studio)

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/vaš-repo/rizzbo.git
cd rizzbo
```

### 3. Konfiguracija .env datotek

Ker aplikacija teče v Docker omrežju, morajo biti okoljske spremenljivke nastavljene tako, da kontejnerji vidijo drug drugega in vašo host mašino.

Ustvarite `ai-backend/.env`:

```
AI_STUDIO_API=AIzaSyBpIC080ExzU-TNTgU7vVahzAHCTCX9uZw
AI_STUDIO_MODEL=gemma-4-26b-a4b-it

```

Ustvarite `app-backend/.env`:

```
# Komunikacija poteka preko internih imen Docker servisov
AI_BACKEND_URL=http://ai-backend:8000
MONGODB_URI=mongodb://mongodb:27017/rizzbo
JWT_SECRET_KEY=JjqFPLGx6GUU1gboqJtMlGq4pqXCg5DEVpISfEBY1v4
```

Za frontend trenutno ne potrebujemo `.env` datoteke, saj Vite proxy ali API klici privzeto ciljajo ustrezna vrata na host mašini.

### 4. Zagon aplikacije

V korenski mapi projekta (tam, kjer se nahaja `docker-compose.yml`) zaženite:

```bash
docker compose up --build
```

To je to! Docker bo prenesel bazo, zgradil frontend in oba backenda ter jih med seboj povezal.

- **Aplikacija (UI):** http://localhost:5173
- **App Backend API:** http://localhost:8080/docs
- **AI Backend API:** http://localhost:8000/docs

Za varno ustavitev aplikacije uporabite ukaz `docker compose down`.

---

## Ekipa

| Vloga              | Odgovornosti                                                      |
| ------------------ | ----------------------------------------------------------------- |
| Frontend developer | UI, React komponente, UX, integracija API-jev                     |
| Backend developer  | FastAPI arhitektura, Dockerizacija, Ollama, MongoDB               |
| Projektni vodja    | Koordinacija, testiranje, specializacija promptov (Trening/Sport) |

---

## Opombe

- **Zasebnost:** Ker aplikacija uporablja Ollamo in lokalne modele, noben podatek (vključno z občutljivimi plani treningov in meritvami) ne zapusti vašega računalnika.
- **Avtentikacija:** Aplikacija podpira registracijo in prijavo preko JWT žetonov. Zgodovina in dokumenti se varno vežejo na posameznega uporabnika.
- **Zamenjava modela:** Če želite preskusiti drug model (npr. `llama3` ali `mistral`), ga preprosto prenesite z `ollama pull <model>` in spremenite spremenljivko `AI_STUDIO_MODEL` v datoteki `ai-backend/.env`.

---

_Zadnja posodobitev: Maj 2026_
