# 🏛️ Jan Setu — Voice-First Revenue Services Portal

A multilingual AI-powered citizen services portal for Indian government revenue services. Citizens can apply for statutory certificates (income, caste, domicile, birth/death, land mutation, etc.) via voice interaction in 8 Indic languages.

---

## ✨ Features

- 🎙️ **Voice-First Interface** — Conversational IVR + WhatsApp simulation in Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, Urdu, and English
- 📄 **Certificate Applications** — Income, Caste, Domicile, Birth/Death, Land Mutation, Disability, Agriculture Subsidy
- 🤖 **AI NLU** — Gemini-powered multilingual entity extraction with local fallback
- 📊 **Admin Dashboard** — Real-time metrics, SLA tracking, officer verification workflows
- 📷 **Document OCR** — Simulated Aadhaar/income doc verification
- 🔐 **Auth** — Citizen & Admin/Officer login with hashed passwords
- 🗄️ **SQLite** — Zero-config embedded database, no external DB needed

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Node Server | Express + `tsx` (proxies `/api` to Python) |
| Backend | Python 3.10+ standard library only (no pip packages!) |
| Database | SQLite (embedded, auto-initialized on first run) |
| AI / NLU | Google Gemini API (optional — has local fallback) |

---

## 🚀 Local Setup

### Prerequisites

- **Node.js** v18+ → https://nodejs.org/
- **Python** 3.10+ → https://www.python.org/downloads/

> **Windows users**: Make sure `python` is on your PATH (check with `python --version` in your terminal).

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/jan-setu.git
cd jan-setu
```

### 2. Set up environment variables

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and add your Gemini API key (get one free at https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=your_actual_key_here
```

> The app works without a Gemini key — it uses a built-in rule-based NLU engine as fallback.

### 3. Install Node dependencies

```bash
npm install
```

> **Python requires no pip install** — the backend uses only Python standard library modules.

### 4. Run the app

```bash
npm run dev
```

This starts:
- **Express + Vite dev server** on `http://localhost:3000` (with HMR)
- **Python backend** on `http://localhost:5050` (auto-launched as a subprocess)

Open your browser at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
jan-setu/
├── server.ts              # Express server — spawns Python backend, proxies /api/*
├── vite.config.ts         # Vite config for React frontend
├── package.json           # Node dependencies
├── requirements.txt       # Python deps (stdlib only — nothing to install)
├── .env.example           # Environment variable template
│
├── src/                   # React frontend source
│   ├── App.tsx
│   ├── components/
│   │   ├── CitizenPortal.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── IVRSimulator.tsx
│   │   ├── WhatsAppSimulator.tsx
│   │   ├── DocumentScanner.tsx
│   │   └── ...
│   └── data/              # Static data (certificates, personas, multilingual strings)
│
└── backend/               # Python backend (stdlib only)
    ├── main.py            # HTTP server entry point
    ├── config.py          # Config & env vars
    ├── database.py        # SQLite schema & queries
    ├── router.py          # API route handlers
    ├── services/          # Business logic
    │   ├── application_service.py
    │   ├── auth_service.py
    │   ├── nlu_service.py
    │   ├── ocr_service.py
    │   ├── audit_service.py
    │   ├── escalation_service.py
    │   └── metrics_service.py
    └── workflow/          # LangGraph-style stateful agent engine
        ├── graph.py
        ├── state.py
        ├── checkpointer.py
        └── nodes/
```

---

## 🔑 API Endpoints

All API routes are under `/api/` and proxied to the Python backend:

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Citizen / Officer login |
| POST | `/api/auth/register` | New citizen registration |
| POST | `/api/applications/submit` | Submit certificate application |
| GET | `/api/applications/status/:token` | Track application by token |
| POST | `/api/nlu/extract` | NLU field extraction |
| POST | `/api/ocr/analyze` | Document OCR analysis |
| GET | `/api/admin/metrics` | Admin dashboard metrics |

---

## 📝 License

MIT
