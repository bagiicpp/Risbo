# RizzBo AI — Sports & Analytical Assistant
RizzBo is a specialized AI assistant designed for athletes, coaches, and sports analysts. It provides deep expertise in football (soccer) and basketball, player statistics, and training optimization.

---

## 🚀 Project Overview

RizzBo is a full-stack web application that leverages Large Language Models (LLMs) to provide data-driven sports analytics. The system is designed to help users analyze player performance, scout emerging talents, and optimize training regimes based on biomechanics, nutrition, and recovery data.

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
rizzbo/
├── ai-backend/             # AI Orchestration Layer
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
│   │   └── hooks/          # Custom React hooks for API interaction
│   ├── Dockerfile
│   └── package.json
│
├── searxng/                # Self-hosted search engine configuration
│
└── docker-compose.yml      # Full-stack orchestration
```

---

## ⚙️ Local Setup (Docker)

The easiest way to run RizzBo is using Docker Compose.

### Prerequisites
- Docker & Docker Compose installed.
- A Google Gemini API Key (via AI Studio) or a running Ollama instance.

### 1. Clone the Repository
```bash
git clone https://github.com/bagiicpp/Risbo.git
cd Risbo
```

### 2. Environment Configuration

Create an `.env` file in `ai-backend/`:
```env
AI_STUDIO_API=your_google_gemini_api_key
AI_STUDIO_MODEL=gemma-4-26b-a4b-it # Or your preferred model
```

Create an `.env` file in `app-backend/`:
```env
AI_BACKEND_URL=http://ai-backend:8000
MONGODB_URI=mongodb://mongodb:27017/rizzbo
JWT_SECRET_KEY=your_super_secret_jwt_key
```

### 3. Launch the Application
```bash
docker compose up --build
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
*Last Updated: June 2026*

