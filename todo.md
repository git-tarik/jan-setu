# Project Todo & Progress Tracker — Multilingual Voice-First Revenue Platform

> **Live Status**: Fully functional hybrid architecture (Modular Python 3 Backend + SQLite + React 19 Frontend + Express Gateway) with zero data egress violations.

---

## 🚀 Completed Tasks (Done So Far)

### 1. LangGraph Agentic Workflow & Scalable Engine (`backend/workflow/`)
- [x] **LangGraph StateGraph Engine (`backend/workflow/graph.py`)**:
  - [x] Implemented DAG compiler supporting `START`, `END`, directed edges, and conditional routing.
  - [x] `RevenueAgentState` schema with full conversation channels, PII safety counters, and execution traces.
- [x] **Specialized Agent Nodes (`backend/workflow/nodes/`)**:
  - [x] `guardrail_node`: Inspects incoming utterances, blocks PII leakage, and writes immutable audit logs.
  - [x] `intent_nlu_node`: Normalizes spoken Indic dialects, parses numerals (Lakh/Crore/Thousand), and runs multi-model fallback.
  - [x] `validation_node`: Validates administrative statutory rules and increments self-correction retry counters.
  - [x] `document_ocr_node`: Cross-references scanned documents against captured citizen attributes.
  - [x] `escalation_node`: Automatically generates officer triage tickets if retries >= 3 or OCR discrepancies persist.
  - [x] `response_node`: Synthesizes multilingual prompts and contextual voice cues.
- [x] **Persistent SQLite Checkpointer (`backend/workflow/checkpointer.py`)**:
  - [x] Per-step state snapshotting for session pause/resume, cross-channel handoffs (IVR &rarr; WhatsApp &rarr; Web), and audit time-travel.
  - [x] Inspection endpoints (`/api/agent/history/:session_id`).

### 2. Backend Architecture & Modularity (Python 3)
- [x] **Modular Backend Architecture**: Created clean directory structure in `/backend/` with single-responsibility services.
- [x] **Relational SQLite Database Layer (`backend/database.py`)**:
  - [x] `applications` table: full certificate submissions, payment refs, tracking tokens, and SLA dates.
  - [x] `audit_logs` table: immutable data sovereignty logs with SHA-256 citizen identity hashing.
  - [x] `escalation_tickets` table: officer triage items with priorities and resolution notes.
  - [x] Seed datasets: Pre-populated historical revenue records, audit traces, and escalation tickets.
- [x] **NLU & Spoken Dialect Parsing (`backend/services/nlu_service.py`)**:
  - [x] Local rule-based extractor for Indic numerals, lakh/crore/thousand expressions, caste categories, and addresses.
  - [x] Resilient Gemini API integration with multi-model fallback (`gemini-3.7-flash`, `gemini-3.1-flash-lite`) and local fallback.
- [x] **In-Memory OCR & Document Verification (`backend/services/ocr_service.py`)**:
  - [x] Document type recognition (Aadhaar Card, Patwari land report, Salary certificate).
  - [x] Confidence scoring (92%–98%) and tamper detection.
- [x] **Application Lifecycle Service (`backend/services/application_service.py`)**:
  - [x] Automated application number generation (`REV-YYYY-UP-XXXXXX`).
  - [x] Tracking token issuance (`TRK-INC-XXXXX`).
  - [x] SLA target calculation (3 to 14 statutory days).
  - [x] Instant lookup endpoint by token or application ID (`/api/applications/status/:token`).
- [x] **Officer Escalation Queue (`backend/services/escalation_service.py`)**:
  - [x] Retrieval of pending and assigned dispute tickets (`/api/escalation`).
  - [x] Resolution endpoint updating ticket status and appending officer audit notes (`/api/escalation/resolve`).
- [x] **Telemetry & Observability Service (`backend/services/metrics_service.py`)**:
  - [x] Real-time latency tracking (transcription, LLM inference, TTS synthesis).
  - [x] Aggregate application volume and channel distribution calculations (Web, WhatsApp, IVR).
  - [x] Language distribution metrics across 8 Indic languages.
  - [x] Data sovereignty violation tracking (enforced at 0).
- [x] **REST API Router & Server (`backend/router.py`, `backend/main.py`)**:
  - [x] Decoupled HTTP request dispatcher mapping endpoints to modular services.
  - [x] Threaded server supporting socket reuse (`allow_reuse_address = True`) and immediate connection flushing.

### 2. Frontend & User Experience (React 19 + Tailwind CSS)
- [x] **"Elegant Dark" Design Theme**:
  - [x] Modern dark aesthetic (`#0A0A0B` canvas, `#18181B` cards, `#27272A` borders, `#E4E4E7` typography).
  - [x] Gold/Amber accent styling (`#F59E0B` / `#D97706`) for government dignity.
  - [x] High-contrast legibility passing WCAG AA standards.
- [x] **Multilingual Voice Interaction**:
  - [x] Real-time voice capture via browser Web Speech API.
  - [x] Audio synthesis feedback via SpeechSynthesis API in citizen's selected language.
  - [x] 8 Indic languages supported: Hindi (हिन्दी), English, Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), Bengali (বাংলা), Marathi (मराठी), Urdu (اردو).
- [x] **Omnichannel Simulation**:
  - [x] **Web Portal**: Full multi-step form wizard with real-time audio wave animation, field validation, document upload, and payment QR.
  - [x] **WhatsApp Simulator**: Interactive chat bubble interface demonstrating text/audio prompts and instant media OCR verification.
  - [x] **IVR Simulator**: Phone dialpad interface supporting DTMF keypad selection, spoken prompts, and voice responses.
- [x] **Application Status Tracker**:
  - [x] Real-time timeline tracker (Submitted → Scrutiny → Field Inspection → Approval → Certificate Issued).
  - [x] Printable/Downloadable Official Government Receipt with QR code and verification badge.
- [x] **Officer Admin Dashboard**:
  - [x] Live telemetry metrics cards (transcription latency, inference latency, active sessions).
  - [x] Interactive Escalation Queue with "Assign Officer" and "Approve & Resolve" modal actions.
  - [x] Sovereign Audit Trail table with channel filters, PII detection badges, and SHA-256 hash masking.

### 3. Full-Stack Gateway & Process Management (`server.ts`)
- [x] Automated subprocess spawning of `python3 -m backend.main` on dedicated internal port `5050`.
- [x] Seamless HTTP reverse proxy for `/api/*` routes with automatic connection retry and error handling.
- [x] Static SPA serving in production and Vite middleware mounting in development.

---

## 📋 Required / Upcoming Roadmap (To Do)

### Phase 1: Advanced Telephony & Offline AI Deployment
- [ ] **Local Whisper STT Container**: Integrate local offline `openai-whisper` (`whisper-tiny` / `whisper-base`) container service for offline containerized deployments.
- [ ] **Local Coqui TTS Container**: Integrate local neural VITS voice models for offline low-latency Indic speech generation.
- [ ] **Asterisk / FreePBX SIP Trunk Adapter**: Add standard SIP/RTP connector for real PSTN telephony integration beyond simulated DTMF.

### Phase 2: Extended Statutory Certificate Catalog
- [ ] **YAML-Driven Certificate Rule Loader**: Load certificate fields dynamically from `/config/certificates/*.yaml` for all 25+ statutory revenue certificates:
  - [ ] Land Mutation Certificate (नामांतरण प्रमाण पत्र)
  - [ ] Non-Creamy Layer Certificate (गैर-क्रीमी लेयर)
  - [ ] Solvency Certificate (शोधन क्षमता प्रमाण पत्र)
  - [ ] Character Certificate (चरित्र प्रमाण पत्र)
  - [ ] Birth & Death Certificates (जन्म एवं मृत्यु प्रमाण पत्र)
  - [ ] Agriculture Subsidy Eligibility Certificate
- [ ] **Advanced DigiLocker & e-Pramaan Integration**: Direct API adapter for statutory DigiLocker document pulls.

### Phase 3: Hardware & Kiosk Optimization
- [ ] **Gram Panchayat CSC Kiosk Mode**: Full-screen kiosk layout with high-contrast large touch targets and physical receipt printer support.
- [ ] **Offline Edge Syncing**: SQLite synchronization protocol for rural CSC centres with intermittent broadband connectivity.
