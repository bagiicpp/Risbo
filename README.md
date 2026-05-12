# 🤝 Moj najboljši prijatelj(RizzBo) — Projektni README

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

### ✅ Faza 1 — MVP (Minimum Viable Product)

- [ ] Pogovor z asistentom v naravnem jeziku (chat vmesnik)
- [ ] Shranjevanje zgodovine pogovorov
- [ ] Iskanje po preteklih pogovorih po ključnih besedah
- [ ] Ustvarjanje novih pogovorov po temah
- [ ] Nalaganje dokumentov (PDF, Word, Excel)
- [ ] Povzemanje naloženih dokumentov
- [ ] Odgovarjanje na vprašanja na podlagi vsebine dokumentov
- [ ] Izvoz rezultatov (Word, Excel, PDF)
- [ ] Enostaven in pregleden uporabniški vmesnik

---

## 🛠️ Tehnološki sklad

```
Frontend:   React + Tailwind CSS
Backend:    Python Flask  +  Bun (JS runtime)
Baza:       MongoDB
AI model:   Claude API (Anthropic)
```

### Zakaj ta izbor?

| Tehnologija          | Razlog                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| **React + Tailwind** | Hiter razvoj UI, komponente, responsive design brez napora                             |
| **Python Flask**     | Enostaven REST API, odlična podpora za AI/ML knjižnice                                 |
| **Bun**              | Hiter JS runtime za orodja, skripte in paketni manager namesto npm                     |
| **MongoDB**          | Fleksibilna NoSQL baza — idealna za shranjevanje pogovorov in dokumentov v JSON obliki |

---

## 🗂️ Struktura projekta (načrtovana)

```
moj-najboljsi-prijatelj/
│
├── frontend/               # React aplikacija
│   ├── components/
│   │   ├── Chat/           # Pogovorno okno
│   │   ├── Sidebar/        # Zgodovina pogovorov
│   │   ├── DocumentPanel/  # Nalaganje in prikaz dokumentov
│   │   └── ResultsPanel/   # Izvozljivi rezultati
│   └── pages/
│
├── backend/                # API strežnik
│   ├── routes/
│   │   ├── chat.py         # Pogovorna logika
│   │   ├── documents.py    # Nalaganje in obdelava dokumentov
│   │   └── export.py       # Generiranje izhodnih datotek
│   ├── services/
│   │   ├── ai_service.py   # Integracija z AI modelom
│   │   └── file_parser.py  # Branje PDF, Word, Excel
│   └── models/             # Podatkovni modeli
│
├── docs/                   # Projektna dokumentacija
└── README.md
```

---

## 🖼️ Uporabniški vmesnik — zasnova

Aplikacija bo imela **3 ločene panele**:

```
┌─────────────────────────────────────────────────────────┐
│  Moj najboljši prijatelj                           🔍    │
├──────────────┬──────────────────────┬───────────────────┤
│              │                      │                   │
│  POGOVORI    │    CHAT OKNO         │   DOKUMENTI       │
│              │                      │                   │
│  • Pogovor 1 │  Asistent: Zdravo!   │  📄 dokument.pdf  │
│  • Pogovor 2 │                      │  📊 tabela.xlsx   │
│  • Pogovor 3 │  Jaz: Povzemi mi ... │                   │
│              │                      │  [ Naloži datot.] │
│  [+ Nov]     │  [_________________] │                   │
│              │           [ Pošlji ] │  [ Izvozi ▼ ]     │
└──────────────┴──────────────────────┴───────────────────┘
```

---

## 🚀 Kako začnemo

### Korak 1 — Postavitev okolja

```bash
# Kloniranje repozitorija
git clone https://github.com/projekt/moj-najboljsi-prijatelj.git
cd moj-najboljsi-prijatelj

# Namestitev odvisnosti (frontend) — z Bun
cd frontend && bun install

# Namestitev odvisnosti (backend)
cd ../backend && pip install -r requirements.txt
```

### Korak 2 — Konfiguracija

```bash
# Kopiraj vzorec konfiguracijske datoteke
cp .env.example .env

# Nastavi spremenljivke
ANTHROPIC_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/moj-najboljsi-prijatelj
FLASK_ENV=development
```

### Korak 3 — Zagon MongoDB

```bash
# Lokalno (zahteva nameščen MongoDB)
mongod --dbpath ./data/db

# Ali z Dockerjem
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### Korak 4 — Zagon aplikacije

```bash
# Backend (Flask)
cd backend && flask run

# Frontend (v novem terminalu, z Bun)
cd frontend && bun run dev
```

---

## 📋 Naslednji koraki

1. **Definirati domeno** — Ali bo asistent splošen ali specializiran?
2. **Postaviti osnovno infrastrukturo** — Baza, API, frontend skeleton
3. **Implementirati chat vmesnik** — Osnoven pogovor z AI modelom
4. **Dodati podporo za dokumente** — Nalaganje in branje PDF/Word/Excel
5. **Testirati z realnimi primeri** — Preizkus z dejanskimi gradivi

---

## 👥 Ekipa

| Vloga              | Odgovoren za                            |
| ------------------ | --------------------------------------- |
| Frontend developer | UI, React komponente                    |
| Backend developer  | API, integracija AI, baza               |
| UX Designer        | Zasnova vmesnika, uporabniška izkušnja  |
| Projektni vodja    | Koordinacija, testiranje, dokumentacija |

---

## 📝 Opombe

- Aplikacija v prvi fazi **ne zahteva registracije** — pogovori se shranjujejo lokalno ali v enostavni bazi.
- Podprti formati dokumentov: `.pdf`, `.docx`, `.xlsx`
- Izvozni formati: `.pdf`, `.docx`, `.xlsx`
- Dolgoročno je mogoče dodati **glasovni vnos**, **mobilno aplikacijo** ali **integracijo z Google Drive/OneDrive**.

---

_Zadnja posodobitev: Maj 2026_

