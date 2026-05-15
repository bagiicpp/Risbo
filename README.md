# 🤝 Moj najboljši prijatelj (RizzBo) — Projektni README

> Poenostavljen pogovorni asistent za vsakodnevno pomoč pri učenju, organizaciji in ustvarjanju vsebin.

---

## 📌 O projektu

**Moj najboljši prijatelj** je spletna aplikacija, ki deluje kot osebni AI asistent. Uporabnik se z njim pogovarja v naravnem jeziku, mu nalaga dokumente in dobiva koristne odgovore, povzetke ter ustvarjene datoteke.

Projekt je zasnovan modularno — asistenta je mogoče specializirati za določeno področje, na primer:

| Domena                | Primer uporabe                                              |
| --------------------- | ----------------------------------------------------------- |
| 📚 Študijski asistent | Razlaga gradiv, povzetki, priprava na izpite                |
| 💼 Karierni asistent  | Pisanje CV-jev, motivacijskih pisem, priprava na intervjuje |
| 🏢 Poslovni asistent  | Priprava poročil, povzetki sestankov, analize               |

---

## 🎯 Cilj prve faze

Za začetek se osredotočamo na **osnovno delujočo aplikacijo** s sledečimi funkcionalnostmi:

### ✅ MVP (Minimum Viable Product)

- [x] Pogovor z asistentom v naravnem jeziku (chat vmesnik)
- [x] Shranjevanje zgodovine pogovorov
- [x] Iskanje po preteklih pogovorih po ključnih besedah
- [x] Ustvarjanje novih pogovorov po temah
- [x] Nalaganje dokumentov (PDF, Word, Excel)
- [x] Povzemanje naloženih dokumentov
- [x] Odgovarjanje na vprašanja na podlagi vsebine dokumentov
- [x] Izvoz rezultatov (Word, Excel, PDF)
- [ ] Enostaven in pregleden uporabniški vmesnik

---

## 🛠️ Tehnološki sklad

```
Frontend:    React + Tailwind CSS + Bun
App Backend: Python FastAPI + MongoDB
AI Backend:  Python FastAPI (Google AI Studio wrapper)
AI Model:    Gemma 4 prek Google AI Studio API
```

### Zakaj ta izbor?

| Tehnologija              | Razlog                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **React + Tailwind**     | Hiter razvoj UI, komponente, responsive design brez napora                             |
| **Python FastAPI**       | Hiter async REST API, avtomatska OpenAPI dokumentacija, odlična podpora za AI/ML       |
| **Bun**                  | Hiter JS runtime za orodja, skripte in paketni manager namesto npm                     |
| **MongoDB**              | Fleksibilna NoSQL baza — idealna za shranjevanje pogovorov in dokumentov v JSON obliki |
| **Gemma 4 via HF API**   | Brezplačen hosted AI model, brez lastnega strežnika                                    |

---

## 🏗️ Arhitektura

```
┌─────────────┐     REST      ┌─────────────────┐     REST      ┌──────────────────┐
│   Frontend  │ ◄───────────► │   App Backend   │ ◄───────────► │   AI Backend     │
│  React SPA  │               │   FastAPI       │               │   FastAPI        │
│  port 5173  │               │   MongoDB       │               │   HF wrapper     │
│             │               │   port 8000     │               │   port 8001      │
└─────────────┘               └─────────────────┘               └──────────┬───────┘
                                                                            │
                                                                 ┌──────────▼───────────┐
                                                                 │  HuggingFace         │
                                                                 │  Serverless API      │
                                                                 │  Gemma 4             │
                                                                 └──────────────────────┘
```

**AI Backend** — edina točka komunikacije z Google AI Studio. Zamenjava modela = samo `.env`, App Backend se ne dotakne.

**App Backend** — vsa poslovna logika: pogovori, dokumenti, izvoz. Kliče AI Backend prek REST.

**Frontend** — React SPA, UI podoben ChatGPT/Claude.

---

## 🗂️ Struktura projekta

```
rizzbo/
├── ai-backend/             # HuggingFace wrapper
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── app-backend/            # App logika
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/       # Pogovorno okno
│   │   │   ├── Sidebar/    # Zgodovina pogovorov
│   │   │   └── FilePanel/  # Datoteke pogovora
│   │   └── pages/
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml      # MongoDB
├── .gitignore
└── README.md
```

---

## 🖼️ Uporabniški vmesnik — zasnova

```
┌───────────────────────────────────────────────────────────────────┐
│  RizzBo                                              [+ Nov chat] │
├─────────────────┬─────────────────────────┬───────────────────────┤
│                 │                         │                       │
│  ZGODOVINA      │    CHAT OKNO            │   DATOTEKE            │
│                 │                         │   (tega pogovora)     │
│  🔍 Iskanje...  │  Asistent: Zdravo!      │                       │
│                 │                         │  📄 dokument.pdf      │
│  Danes          │  Jaz: Povzemi mi ...    │  📊 tabela.xlsx       │
│  • Pogovor 1    │                         │  📝 povzetek.docx     │
│  • Pogovor 2    │  Asistent: ...          │   ↑ ustvaril AI       │
│                 │                         │                       │
│  Včeraj         │                         │  [ Naloži datoteko ]  │
│  • Pogovor 3    │  [___________________]  │                       │
│                 │              [ Pošlji ] │                       │
└─────────────────┴─────────────────────────┴───────────────────────┘
```

---

## 🚀 Lokalni zagon

### Zahteve

Pred začetkom preveri, da imaš nameščeno:
- [Docker](https://www.docker.com/) (za MongoDB)
- [Python 3.11+](https://www.python.org/)
- [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)

---

### Korak 1 — Kloniranje repozitorija

```bash
git clone https://github.com/vaš-repo/rizzbo.git
cd rizzbo
```

---

### Korak 2 — Konfiguracija `.env` datotek

Vsak servis ima svojo `.env` datoteko. Kopiraj vzorce in jih izpolni:

```bash
cp ai-backend/.env.example ai-backend/.env
cp app-backend/.env.example app-backend/.env
cp frontend/.env.example frontend/.env
```

**`ai-backend/.env`** — dodaj HuggingFace API ključ:
```
AI_STUDIO_API=your_googleaistudio_api_key_here
AI_STUDIO_MODEL=gemma-4-26b-a4b-it
```
> API ključ dobiš na Google AI Studio

**`app-backend/.env`** — pusti kot je za lokalni razvoj:
```
MONGODB_URI=mongodb://localhost:27017/rizzbo
AI_BACKEND_URL=http://localhost:8001
```

**`frontend/.env`** — pusti kot je za lokalni razvoj:
```
VITE_API_URL=http://localhost:8000
```

---

### Korak 3 — Zagon MongoDB

```bash
docker compose up -d
```

> MongoDB bo dosegljiv na `localhost:27017`.

---

### Korak 4 — AI Backend

```bash
cd ai-backend

# Ustvari virtualno okolje
python -m venv .venv

# Aktiviraj (Linux / macOS)
source .venv/bin/activate

# Aktiviraj (Windows)
.venv\Scripts\activate

# Namesti odvisnosti
pip install -r requirements.txt

# Zaženi (port 8001)
uvicorn main:app --reload --port 8001
```

---

### Korak 5 — App Backend

V novem terminalu:

```bash
cd app-backend

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Zaženi (port 8000)
uvicorn main:app --reload --port 8000
```

---

### Korak 6 — Frontend

V novem terminalu:

```bash
cd frontend

bun install
bun run dev
```

> Frontend bo dosegljiv na `http://localhost:5173`.

---

### Korak 7 — Preveri

```bash
curl http://localhost:8001/ping
# → {"status":"ok","service":"ai-backend"}

curl http://localhost:8000/ping
# → {"status":"ok","service":"app-backend"}
```

Odpri `http://localhost:5173` v brskalniku.

---

## 👥 Ekipa

| Vloga              | Odgovoren za                           |
| ------------------ | -------------------------------------- |
| Frontend developer | UI, React komponente                   |
| Backend developer  | API, integracija AI, baza              |
| Projektni vodja    | Koordinacija, testiranje, dokumentacija|

---

## 📝 Opombe

- Aplikacija sedaj **podpira registracijo in prijavo (JWT)**. Neregistrirani uporabniki lahko uporabljajo aplikacijo *(Guest mode)*, vendar se njihova zgodovina ne shranjuje v bazo.

- Podprti formati za RAG: `.pdf`, `.docx`, `.xlsx`.

- Avtomatiziran izvoz pogovorov ustvari obogateno `.docx` datoteko.

---

_Zadnja posodobitev: Maj 2026_