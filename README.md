# Risbo (Moj najboljši prijatelj) — Projektni README

Specializiran, podatkovno voden AI asistent za športnike, trenerje in kineziologe, ki ga poganjajo lokalni jezikovni modeli za maksimalno zasebnost.

---

## O projektu

Risbo (Projekt Moj najboljši prijatelj) je spletna aplikacija in osebni AI asistent, ki je ekspertno usposobljen za področja biomehanike, tempiranja prehrane, hipertrofije in regeneracije. Uporabnik se z njim pogovarja v naravnem jeziku, mu nalaga dokumente (npr. plane treningov, raziskave) in dobiva strokovne, podatkovno podprte odgovore in analize.

Ker aplikacija za delovanje uporablja lokalne LLM modele (preko Ollame), vsi vaši pogovori in naloženi dokumenti ostanejo izključno na vaši napravi. Ni pošiljanja podatkov v oblak!

| Domena | Primer uporabe |
|---|---|
| Trening in kineziologija | Analiza biomehanike vaj, nasveti za hipertrofijo in moč |
| Prehrana in regeneracija | Tempiranje makrohranil, protokoli za spanec in okrevanje |
| Analiza podatkov | Branje in povzemanje PDF raziskav, analiziranje Excel tabel z rezultati |

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

| Tehnologija | Razlog |
|---|---|
| React + Tailwind | Hiter razvoj UI, komponente, responsive design brez napora |
| Python FastAPI | Hiter async REST API, avtomatska OpenAPI dokumentacija, primerno za AI |
| Ollama | Omogoča enostavno poganjanje močnih LLM-jev na lokalnem računalniku (brezplačno, varno) |
| MongoDB | Fleksibilna NoSQL baza — idealna za shranjevanje pogovorov in dokumentov v JSON obliki |
| Docker Compose | Celoten "stack" aplikacije (baza, oba backenda, frontend) se zažene z eno samo komando |

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
                                          │ localhost:27017 │                │ localhost:11434  │
                                          └─────────────────┘                └──────────────────┘
```

- **AI Backend** — Upravlja neposredno komunikacijo z vašim lokalnim Ollama strežnikom. Skrbi za sistemski "prompt" in usmerja asistenta k strokovnosti.
- **App Backend** — Poslovna logika aplikacije: baza uporabnikov, avtentikacija (JWT), shranjevanje pogovorov, procesiranje dokumentov.
- **Frontend** — Uporabniški vmesnik, podoben ChatGPT, kjer poteka interakcija z uporabnikom.

---

## Struktura projekta

```
rizzbo/
├── ai-backend/             # FastAPI Ollama vmesnik
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

- Docker Desktop (z vključenim Docker Compose)
- Ollama (mora teči na vašem glavnem sistemu, ne v Dockerju)

### 1. Priprava lokalnega AI modela

Prenesite model, ki ga aplikacija pričakuje (privzeto `gemma3:4b`). Odprite terminal na računalniku in vpišite:

```bash
ollama pull gemma3:4b
```

Poskrbite, da Ollama po prenosu teče v ozadju.

### 2. Kloniranje repozitorija

```bash
git clone https://github.com/vaš-repo/rizzbo.git
cd rizzbo
```

### 3. Konfiguracija .env datotek

Ker aplikacija teče v Docker omrežju, morajo biti okoljske spremenljivke nastavljene tako, da kontejnerji vidijo drug drugega in vašo host mašino.

Ustvarite `ai-backend/.env`:

```
# host.docker.internal omogoča kontejnerju dostop do Ollame na vašem PC-ju
OLLAMA_HOST=http://host.docker.internal:11434
AI_STUDIO_MODEL=gemma3:4b
# Ta ključ je le formalnost za preverjanje znotraj kode, vrednost je poljubna
AI_API=rizzbo_local_key
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

| Vloga | Odgovornosti |
|---|---|
| Frontend developer | UI, React komponente, UX, integracija API-jev |
| Backend developer | FastAPI arhitektura, Dockerizacija, Ollama, MongoDB |
| Projektni vodja | Koordinacija, testiranje, specializacija promptov (Trening/Sport) |

---

## Opombe

- **Zasebnost:** Ker aplikacija uporablja Ollamo in lokalne modele, noben podatek (vključno z občutljivimi plani treningov in meritvami) ne zapusti vašega računalnika.
- **Avtentikacija:** Aplikacija podpira registracijo in prijavo preko JWT žetonov. Zgodovina in dokumenti se varno vežejo na posameznega uporabnika.
- **Zamenjava modela:** Če želite preskusiti drug model (npr. `llama3` ali `mistral`), ga preprosto prenesite z `ollama pull <model>` in spremenite spremenljivko `AI_STUDIO_MODEL` v datoteki `ai-backend/.env`.

---

*Zadnja posodobitev: Maj 2026*