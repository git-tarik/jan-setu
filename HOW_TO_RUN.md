# 🚀 How to Run — JanSetu Voice Revenue Platform

## Prerequisites

Before you start, make sure these are installed on your machine:

| Tool | Required Version | Check Command | Download |
|---|---|---|---|
| **Node.js** | v18 or higher | `node --version` | https://nodejs.org/ |
| **Python** | 3.10 or higher | `python --version` | https://www.python.org/downloads/ |
| **Git** | Any | `git --version` | https://git-scm.com/ |

> **Windows users**: When installing Python, check ✅ "Add Python to PATH" in the installer.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/git-tarik/jan-setu.git
cd jan-setu
```

---

## Step 2 — Set Up Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Open the `.env` file in any text editor. You'll see:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:3000
```

---

## Step 3 — Gemini API Key (Is It Required?)

### Short Answer: **NO — The app works without it.**

Here's exactly what changes with and without the key:

| Feature | Without API Key | With API Key |
|---|---|---|
| **Login / Signup** | ✅ Works fully | ✅ Works fully |
| **Certificate Application** | ✅ Works fully | ✅ Works fully |
| **Voice Form Filling** | ✅ Uses local rule-based NLU | ✅ Uses Gemini AI (smarter) |
| **NLU field extraction** | ✅ Built-in regex rules | ✅ AI-powered (handles complex phrasing) |
| **Admin Dashboard** | ✅ Works fully | ✅ Works fully |
| **Multilingual support** | ✅ Works fully | ✅ Enhanced understanding |

### The NLU Fallback Explained

The backend has two layers of NLU (Natural Language Understanding):

```
User speaks: "मेरी आय एक लाख बीस हजार रुपये है"
                        ↓
        [Layer 1] Local Rule-Based Extractor
         Regex + Indic word maps → "120000"  ✅ Always works
                        ↓ (only if GEMINI_API_KEY is set)
        [Layer 2] Gemini API
         Smart AI extraction for complex/ambiguous phrases
```

**Conclusion:** Leave `GEMINI_API_KEY=your_gemini_api_key_here` as-is in `.env` to skip it. The app runs perfectly with the local extractor.

### How to Get a Free Gemini API Key (Optional)

1. Go to → **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key and paste it in `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

> **Free tier**: Gemini API has a generous free tier — no credit card needed.

---

## Step 4 — Install Node Dependencies

```bash
npm install
```

> ✅ **Python requires NO `pip install`** — the backend uses only Python's built-in standard library (`sqlite3`, `http.server`, `json`, etc.)

---

## Step 5 — Run the App

```bash
npm run dev
```

This single command starts **both** servers:

```
🐍 Python Backend  →  http://localhost:5050  (API)
🌐 Express + React →  http://localhost:3000  (UI)
```

Open your browser at **http://localhost:3000**

---

## Step 6 — Log In

Use the demo accounts (pre-seeded automatically on first run):

### Citizen Portal
| Field | Value |
|---|---|
| Email | `radha@citizen.in` |
| Password | `demo1234` |

### Admin / Officer Portal
| Field | Value |
|---|---|
| Email | `officer@revenue.gov.in` |
| Password | `admin1234` |

Or **register a new citizen account** by clicking "Create Account" on the login page.

---

## Stopping the App

Press `Ctrl + C` in the terminal where `npm run dev` is running.

---

## Restarting After a PC Reboot

```bash
cd jan-setu
npm run dev
```

That's all — no extra steps needed.

---

## Troubleshooting

### `python` not recognized
```
'python' is not recognized as an internal or external command
```
**Fix:** Reinstall Python and check ✅ "Add Python to PATH" — or try `python3` manually.

### Port 3000 already in use
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```
**Fix:** Kill the existing process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid_number> /F
```

### Database error on startup
```
sqlite3.DatabaseError: database disk image is malformed
```
**Fix:** Delete the old database and restart — it auto-recreates:
```bash
# Windows
del backend\data\revenue_services.db
npm run dev
```

### Login fails with demo credentials
The database may have been initialized with old credentials.
```bash
del backend\data\revenue_services.db
npm run dev
```
Then try logging in again — credentials are re-seeded fresh.

### Gemini API calls fail
If you added a Gemini API key but get errors, the app automatically falls back to the local NLU engine. This is expected behaviour — no action needed.

---

## Project Architecture (Quick Reference)

```
npm run dev
    │
    ├── server.ts (Express on :3000)
    │       ├── Serves React UI (Vite HMR)
    │       ├── Proxies /api/* → Python backend
    │       └── Auto-launches Python subprocess
    │
    └── backend/main.py (Python HTTP on :5050)
            ├── SQLite database (auto-created)
            ├── Auth: /api/v1/auth/login, /signup
            ├── NLU: Local rules + optional Gemini
            ├── Applications, OCR, Payments, Audit
            └── LangGraph-style workflow engine
```

---

## File Reference

| File | Purpose |
|---|---|
| `.env` | Your local secrets (never commit this) |
| `.env.example` | Template — safe to commit |
| `requirements.txt` | Python deps (stdlib only — nothing to install) |
| `package.json` | Node.js dependencies |
| `server.ts` | Express gateway + Python launcher |
| `backend/` | Python API server |
| `src/` | React frontend |
