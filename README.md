# Risbo AI — Sports & Analytical Assistant
Risbo is a specialized AI assistant designed for athletes, coaches, and sports analysts. It provides deep expertise in football (soccer) and basketball, player statistics, and training optimization.

---

## 🚀 Project Overview

Risbo is a full-stack web application that leverages Large Language Models (LLMs) to provide data-driven sports analytics. The system is designed to help users analyze player performance, scout emerging talents, and optimize training regimes based on biomechanics, nutrition, and recovery data.

### Core Domains
| Domain | Use Case |
| :--- | :--- |
| **Sports Analytics** | Detailed analysis of football and basketball stats, scouting and evaluating young prospects. |
| **Training & Recovery** | Evidence-based advice on training loads, biomechanics, basic nutrition, and regeneration strategies. |
| **Document Analysis** | Uploading statistics (PDF, Word, Excel) to provide context for precise, data-backed scouting reports. |

---

## ✨ Features

### MVP Functionalities
- [x] **Natural Language Interaction:** Intuitive chat interface for interacting with the AI.
- [x] **Conversation Management:** Save, categorize, and search through chat history.
- [x] **RAG (Retrieval-Augmented Generation):** Upload documents (PDF, Word, Excel) and ask questions based on their content.
- [x] **Export Capabilities:** Export analysis results to Word, Excel, or PDF.
- [x] **Responsive UI:** A modern, clean interface built for both desktop and mobile.
- [x] **Integrated Search:** Powered by SearxNG for real-time web data retrieval.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Package Manager:** Bun / npm

### Backends
- **App Backend:** Python FastAPI + MongoDB (User management, Auth, Session storage)
- **AI Backend:** Python FastAPI + Google Gemini / Ollama (LLM orchestration and domain-specific prompting)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Search:** SearxNG

### Architecture Flow
`Frontend (React)` $\leftrightarrow$ `App Backend (FastAPI)` $\leftrightarrow$ `AI Backend (FastAPI)` $\leftrightarrow$ `LLM (Gemini/Ollama)`
$\quad \quad \quad \quad \quad \quad \quad \quad \quad \quad \quad \downarrow \quad \quad \quad \quad \quad \quad \quad \quad \quad \quad \quad \downarrow$
$\quad \quad \quad \quad \quad \quad \quad \quad \quad \quad \text{MongoDB} \quad \quad \quad \quad \quad \quad \quad \text{SearxNG / Local Data}$

---

## 📂 Project Structure

```text
Risbo/
├── ai-backend/             # AI Orchestration Layer
│   ├── wiki/
│   ├── wiki_search/
│   ├── main.py             # FastAPI entry point
│   ├── intent.py           # Intent classification for sports domains
│   ├── search.py           # Integration with SearxNG/Web search
│   ├── football_data.py    # Specialized football data handlers
│   ├── domains.py          # Domain-specific prompt engineering
│   └── Dockerfile
│
├── app-backend/            # Core Application Logic
│   ├── main.py             # API entry point
│   ├── auth.py             # JWT Authentication & User management
│   ├── models.py           # MongoDB schemas
│   ├── utils.py            # File processing and helper functions
│   └── tests/              # Comprehensive test suite
│
├── frontend/               # Modern User Interface
│   ├── src/                # React components, hooks, and pages
│   │   ├── components/     # UI components (shadcn/ui)
│   │   ├── pages/          # Chat, Settings, and Analytics views
│   │   ├── context/
│   │   ├── lib/
│   │   ├── hooks/          # Custom React hooks for API interaction
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── searxng/                # Self-hosted search engine configuration
│
└── docker-compose.yml      # Full-stack orchestration
```

---

# ⚙️ Local Setup (Docker)

The easiest way to run Risbo locally is with Docker Compose.

## Prerequisites

Before starting, make sure you have:

* Docker installed
* Docker Compose installed
* A Google Gemini API key (via Google AI Studio) **or** a running Ollama instance

---

## 1. Clone the Repository

```bash
git clone https://github.com/bagiicpp/Risbo.git
cd Risbo
```

---

## 2. Configure Environment Variables

Risbo ships with preconfigured example environment files. Simply copy them and update the values where indicated.

### AI Backend

```bash
cd ai-backend
cp .env.example .env
cd ..
```

### App Backend

```bash
cd app-backend
cp .env.example .env
cd ..
```

### Frontend

```bash
cd frontend
cp .env.development .env
cd ..
```

After copying the files, open each `.env` file and replace any placeholder values with your own configuration (API keys, secrets, etc.).

---

## 3. Launch the Application

From the project root:

```bash
docker compose up --build
```

The first startup may take several minutes while Docker builds the containers.

---

## 4. Access the Application

Once all services are running:

| Service              | URL                        |
| -------------------- | -------------------------- |
| Frontend             | http://localhost:5173      |
| App Backend API Docs | http://localhost:8080/docs |
| AI Backend API Docs  | http://localhost:8000/docs |

---

## Stopping Risbo

To stop all services:

```bash
docker compose down
```

To remove containers and volumes:

```bash
docker compose down -v
```


**Access Points:**
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **App Backend API Docs:** [http://localhost:8080/docs](http://localhost:8080/docs)
- **AI Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👥 Contributors
- **Frontend Development:** UI/UX, React integration.
- **Backend Development:** FastAPI Architecture, Dockerization, LLM Integration.
- **Project Management:** Prompt Engineering, Domain Specialization (Sports/Training).

---

## Deployment
Access to deployed version: [risbo.app](https://risbo.app)

---

*Last Updated: June 2026*

