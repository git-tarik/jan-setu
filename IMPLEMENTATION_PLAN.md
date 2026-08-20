# Multilingual Voice-First Revenue Services Platform
## Implementation Plan — Hackathon POC

> **Goal**: Engineer a voice-first, multilingual, channel-agnostic platform for government certificate services using 100% free/open-source tools, with strict on-premise data isolation.

---

## 1. Problem Decomposition

### 1.1 Core Functional Pillars

| Pillar | What It Solves |
|--------|---------------|
| Voice-First Interaction | Citizens speak in native language; platform transcribes, understands, responds |
| Multilingual NLU | Understand intent across Hindi, English, regional languages |
| Certificate Journey Engine | Guided form-filling via conversation for 25+ certificate types |
| Document Capture & Validation | Camera/upload → OCR → field extraction → validation |
| Authentication | Aadhaar-mock OTP, phone-based auth (local) |
| Payment Orchestration | Mock UPI/payment gateway adapter |
| Omnichannel | Web UI, WhatsApp adapter (mock), IVR adapter (mock) |
| Status Tracking | Real-time journey state, receipt generation |
| Operational Dashboard | Admin view: metrics, audit, escalation queue |
| Data Sovereignty | Citizen/government data NEVER leaves local machine |

### 1.2 Data Classification Framework

```
RESTRICTED (LOCAL ONLY)                  CLOUD-SAFE (Permitted external calls)
────────────────────────────────         ──────────────────────────────────────
- Citizen PII (name, DOB, address)       - Anonymous phoneme audio chunks
- Aadhaar/ID numbers                     - Non-PII NLP training signals
- Income / caste / document data         - Generic TTS requests (no PII text)
- Form submissions                       - Open model downloads (one-time)
- Payment references                     - Public language model inference
- Audit logs                               (if PII stripped)
- Session states
```

---

## 2. Technology Stack (100% Free & Open-Source)

### 2.1 Core Runtime

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Backend API** | Modular Python 3 Backend + Express Gateway | Async, thread-safe, SQLite local persistence |
| **Conversation Engine** | Custom FSM Engine + Indic NLP | Predictable state transitions for certificate flows |
| **LLM / NLU** | Modular Python NLU (Local Rules + Gemini fallback) | Zero cloud leakage of citizen PII |
| **Speech-to-Text** | Whisper Tiny / Native Web Speech STT | High-accuracy multilingual speech transcription |
| **Text-to-Speech** | Coqui TTS / Web Speech Audio Engine | Natural Indic speech across 8 languages |
| **Translation/NLU** | Indic NLU + Multi-Model Normalizer | Normalizes spoken dialects (e.g. ₹1.2 lakh → 120000) |
| **OCR** | Tesseract 5 / OpenCV Grayscale In-Memory | Document field extraction & tamper verification |
| **Database** | SQLite 3 / PostgreSQL 16 (Local) | Structured tables, ACID guarantees, immutable audit ledger |
| **Frontend** | React 19 + Vite + Tailwind CSS | Elegant Dark high-contrast citizen UI |
| **Admin Dashboard** | React 19 + Chart.js / Metrics Grid | Live telemetry, escalations, and audit inspector |

---

## 3. Repository Structure

```
voice-revenue-platform/
├── README.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── todo.md                       # Comprehensive status & roadmap
├── .env.example                  # Template (no secrets)
├── package.json                  # Frontend & proxy dependencies
├── server.ts                     # Express gateway & Python process orchestrator
│
├── backend/                      # Modular Python 3 Backend
│   ├── __init__.py
│   ├── config.py                 # Configuration & SLA definitions
│   ├── database.py               # SQLite schema & seed datasets
│   ├── router.py                 # REST route dispatcher
│   ├── main.py                   # Threaded HTTP server entrypoint
│   └── services/                 # Decoupled business logic
│       ├── __init__.py
│       ├── audit_service.py      # Sovereign audit trail & SHA-256 citizen masking
│       ├── nlu_service.py        # Spoken Indic extraction & Gemini fallback
│       ├── ocr_service.py        # Document OCR verification & confidence scoring
│       ├── application_service.py# Submissions & status tracking
│       ├── escalation_service.py # Officer review queue & ticket resolution
│       └── metrics_service.py    # Telemetry metrics & channel distribution
│
├── src/                          # Modern React 19 Frontend
│   ├── main.tsx
│   ├── App.tsx                   # Unified portal with Elegant Dark design
│   ├── index.css                 # Tailwind CSS styling
│   └── types.ts                  # Shared TypeScript interfaces
```

---

## 4. Operational Milestones

### Phase 1 — Foundation & Data Sovereignty
- Modular Python 3 backend initialized with local SQLite persistence.
- Zero-cloud-egress data classifier and SHA-256 citizen identity hashing.
- High-contrast Elegant Dark theme applied across all portals.

### Phase 2 — Multilingual Voice & Certificate Engine
- 8 Indic languages supported (Hindi, English, Tamil, Telugu, Malayalam, Bengali, Marathi, Urdu).
- Deterministic NLU entity extraction (numeral parsing, lakh/thousand normalization).
- Real-time speech synthesis & recognition audio loop.

### Phase 3 — Omnichannel Simulation
- Full Web Portal (Voice & Visual Form Wizard).
- WhatsApp Conversational Interface Simulator.
- IVR Telephony / Keypad DTMF Simulator.

### Phase 4 — Enterprise Review & Observability
- Officer Escalation Queue with manual resolution actions.
- Immutable Data Sovereignty Audit Ledger with filterable channels.
- Real-time Telemetry Dashboard (latencies, volumes, channel splits).
