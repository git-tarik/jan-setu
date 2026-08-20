# System Architecture — Voice-First Revenue Platform

## A. High-Level Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          LOCAL TRUST BOUNDARY (On-Premise)                       ║
║                                                                                  ║
║  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────────────┐    ║
║  │  CHANNELS   │    │   CHANNEL ROUTER │    │    VOICE PROCESSING LAYER    │    ║
║  │             │    │   (API Gateway)  │    │                              │    ║
║  │ ┌─────────┐ │    │  ┌────────────┐  │    │  ┌───────────┐ ┌──────────┐ │    ║
║  │ │Web/PWA  │─┼───▶│  │Auth Middle │  │───▶│  │ Whisper   │ │ Coqui    │ │    ║
║  │ │(React)  │ │    │  │-ware (JWT) │  │    │  │ STT (tiny)│ │ TTS(VITS)│ │    ║
║  │ └─────────┘ │    │  └────────────┘  │    │  └─────┬─────┘ └────┬─────┘ │    ║
║  │ ┌─────────┐ │    │  ┌────────────┐  │    │        │             │       │    ║
║  │ │WhatsApp │─┼───▶│  │Rate Limiter│  │    │  ┌─────▼─────────────▼─────┐│    ║
║  │ │(Adapter)│ │    │  └────────────┘  │    │  │  VAD + Lang Detection   ││    ║
║  │ └─────────┘ │    │  ┌────────────┐  │    │  │  (webrtcvad + langdetect)││    ║
║  │ ┌─────────┐ │    │  │Data Class. │  │    │  └─────────────────────────┘│    ║
║  │ │  IVR    │─┼───▶│  │Middleware  │  │    └──────────────────────────────┘    ║
║  │ │(Adapter)│ │    │  └────────────┘  │                                         ║
║  │ └─────────┘ │    └────────┬─────────┘    ┌──────────────────────────────┐    ║
║  └─────────────┘             │              │      NLP / AI LAYER          │    ║
║                              ▼              │                              │    ║
║              ┌───────────────────────────┐  │  ┌──────────┐ ┌──────────┐  │    ║
║              │  CONVERSATION STATE ENGINE│  │  │  mBART   │ │  Ollama  │  │    ║
║              │                           │─▶│  │Translation│ │ LLM(3b) │  │    ║
║              │  ┌─────────────────────┐  │  │  │(50 langs)│ │(local)   │  │    ║
║              │  │  FSM Engine         │  │  │  └──────────┘ └──────────┘  │    ║
║              │  │  ┌───────────────┐  │  │  │  ┌──────────────────────┐   │    ║
║              │  │  │Certificate    │  │  │  │  │  Intent/Entity       │   │    ║
║              │  │  │Flow Configs   │  │  │  │  │  Extractor           │   │    ║
║              │  │  │(YAML-driven)  │  │  │  └──────────────────────────┘  │    ║
║              │  │  └───────────────┘  │  │  └──────────────────────────────┘    ║
║              │  └─────────────────────┘  │                                       ║
║              └───────────┬───────────────┘  ┌──────────────────────────────┐    ║
║                          │                  │    DOCUMENT PROCESSING        │    ║
║                          │ ◀───────────────▶│                              │    ║
║                          │                  │  ┌──────────┐ ┌──────────┐  │    ║
║              ┌───────────▼───────────────┐  │  │Tesseract │ │ OpenCV   │  │    ║
║              │    SERVICES LAYER         │  │  │  OCR     │ │Preprocess│  │    ║
║              │                           │  │  └──────────┘ └──────────┘  │    ║
║              │  ┌─────────┐ ┌─────────┐  │  │  ┌──────────────────────┐   │    ║
║              │  │ Cert.   │ │Payment  │  │  │  │  Validation Rules    │   │    ║
║              │  │ Service │ │ Service │  │  │  │  Engine              │   │    ║
║              │  └────┬────┘ └────┬────┘  │  └──────────────────────────┘  │    ║
║              │       │           │       │  └──────────────────────────────┘    ║
║              └───────┼───────────┼───────┘                                       ║
║                      │           │           ┌──────────────────────────────┐    ║
║                      ▼           ▼           │    DATA LAYER (LOCAL ONLY)   │    ║
║              ┌───────────────────────────┐   │                              │    ║
║              │  PERSISTENCE LAYER        │   │  ┌──────────┐ ┌──────────┐  │    ║
║              │                           │   │  │PostgreSQL│ │  Redis   │  │    ║
║              │  ┌─────────┐ ┌─────────┐  │   │  │(Audit +  │ │(Sessions)│  │    ║
║              │  │PostgreSQL│ │  Redis  │  │   │  │ Certs)   │ │          │  │    ║
║              │  │(primary) │ │(session)│  │   │  └──────────┘ └──────────┘  │    ║
║              │  └─────────┘ └─────────┘  │   │  ┌──────────────────────┐   │    ║
║              │  ┌───────────────────────┐ │   │  │ RabbitMQ (async tasks)│   │    ║
║              │  │  Audit Log Store      │ │   └──────────────────────────┘  │    ║
║              └───────────────────────────┘   └──────────────────────────────┘    ║
║                                                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐    ║
║  │                        OBSERVABILITY LAYER                               │    ║
║  │   Prometheus (metrics) ◀──── all services ────▶ Grafana (dashboards)   │    ║
║  │   structlog → JSON logs → Admin Dashboard                                │    ║
║  └─────────────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## B. Sequence Diagram: Complete Income Certificate Journey (Web Voice)

```
Citizen       WebPortal      API Gateway    VoicePipeline   FSM Engine    LLM/NLP      DB/Redis
   │              │               │               │               │            │            │
   │──[opens]────▶│               │               │               │            │            │
   │              │──GET /health──▶               │               │            │            │
   │              │               │               │               │            │            │
   │──[speaks     │               │               │               │            │            │
   │  phone no]──▶│               │               │               │            │            │
   │              │──POST /auth/init──────────────────────────────────────────────────────▶│
   │              │               │               │               │            │            │◀[OTP gen]
   │              │◀──{otp_sent}──│               │               │            │            │
   │──[OTP]──────▶│               │               │               │            │            │
   │              │──POST /auth/verify──────────────────────────────────────────────────────▶│
   │              │◀──{JWT token}─│               │               │            │            │
   │              │               │               │               │            │            │
   │──[mic on]───▶│               │               │               │            │            │
   │◀─[consent    │               │               │               │            │            │
   │   TTS audio]─│               │               │               │            │            │
   │──[says "yes"]▶│              │               │               │            │            │
   │              │──POST /voice/stt──────────────▶               │            │            │
   │              │               │──[audio bytes]▶               │            │            │
   │              │               │              │◀[Whisper LOCAL]│            │            │
   │              │               │◀──{transcript: "yes"}-────────│            │            │
   │              │               │──POST /conversation/message───▶            │            │
   │              │               │               │──[CONSENT]───▶│            │            │
   │              │               │               │               │──[extract]─▶            │
   │              │               │               │               │◀──{intent: CONSENT_YES}─│
   │              │               │               │               │[transition: IDLE→SERVICE_SELECT]
   │              │               │               │               │──[store state]────────────▶│
   │              │◀──{tts: "Which certificate?"}─────────────────│            │            │
   │◀─[TTS audio]─│               │               │               │            │            │
   │──["income    │               │               │               │            │            │
   │   certificate"]──────────────▶│               │               │            │            │
   │              │──POST /voice/stt──────────────▶               │            │            │
   │              │               │◀──{transcript: "income cert"}─│            │            │
   │              │               │──POST /conversation/message───▶            │            │
   │              │               │               │               │──[extract]─▶            │
   │              │               │               │               │◀{intent: SELECT_INCOME}─│
   │              │               │               │               │[transition: →FORM_CAPTURE]
   │              │               │               │               │            │            │
   │   [Loop: Field-by-Field Form Capture]                        │            │            │
   │◀─[TTS: "Name?"]──────────────────────────────────────────────│            │            │
   │──[speaks name]──────────────▶│──POST /voice/stt──────────────▶            │            │
   │              │               │◀──{transcript: "Radha Devi"}──│            │            │
   │              │               │               │               │──[validate]▶            │
   │              │               │               │               │◀{name: "Radha Devi", valid}
   │              │               │               │               │──[store field]────────────▶│
   │◀─[TTS: "Income amount?"]──────────────────────────────────────│            │            │
   │              │   [... continues for all fields ...]           │            │            │
   │              │               │               │               │            │            │
   │   [Document Upload Step]                                      │            │            │
   │◀─[TTS: "Upload ID proof"]─────────────────────────────────────│            │            │
   │──[uploads doc]──────────────▶│──POST /documents/upload────────────────────────────────▶│
   │              │               │──[image bytes]──[Tesseract OCR LOCAL]──[extract fields]──▶│
   │              │               │◀──{ocr_result: {name, id_num}}│            │            │
   │              │               │──[validate against form data]─▶            │            │
   │◀─[TTS: "Document verified"]──────────────────────────────────│            │            │
   │              │               │               │               │[transition: →PAYMENT]    │
   │              │               │               │               │            │            │
   │   [Payment Step]                                              │            │            │
   │◀─[Payment QR displayed]──────│               │               │            │            │
   │──[mock pay]─▶│──POST /payments/mock─callback──────────────────────────────────────────▶│
   │              │◀──{payment: SUCCESS}──────────│               │            │            │
   │              │               │               │               │[transition: →SUBMISSION] │
   │              │               │               │               │            │            │
   │   [Submission & Receipt]                                      │            │            │
   │              │               │──POST /certificates/submit─────▶            │            │
   │              │               │               │               │──[persist]────────────────▶│
   │              │               │               │               │◀──{app_id: "INC-2024-001"}─│
   │              │               │──[generate PDF receipt]────────────────────────────────▶│
   │◀─[PDF receipt + TTS confirm]─│               │               │            │            │
   │              │               │               │               │[transition: →COMPLETED]  │
```

---

## C. Sequence Diagram: WhatsApp Channel Journey

```
WhatsApp      WA Mock        API Gateway    Channel        FSM Engine    DB/Redis
 User          Adapter         Layer         Router              │            │
   │              │               │               │              │            │
   │──[texts]────▶│               │               │              │            │
   │              │──POST /adapters/whatsapp/inbound──────────────────────────▶│
   │              │               │──[map to session]────────────│            │
   │              │               │──[load session context]───────────────────▶│
   │              │               │               │◀──{session state}──────────│
   │              │               │──[route to FSM]──────────────▶             │
   │              │               │               │              │[process msg]│
   │              │               │◀──{response text}─────────────│            │
   │              │◀──{formatted WA msg}──────────│               │            │
   │◀──[receives text reply]───────│               │               │            │
   │              │               │               │               │            │
   │  [Note: No TTS for WhatsApp; text only + document prompts via WA templates]
   │              │               │               │               │            │
   │──[sends photo]──────────────▶│──POST /adapters/whatsapp/media────────────▶│
   │              │               │──[OCR locally]─────────────────────────────▶│
   │◀──[doc verified reply]────────│               │               │            │
```

---

## D. Sequence Diagram: IVR Channel Journey

```
IVR Caller     IVR Adapter    API Gateway    Voice Pipeline   FSM Engine
   │               │               │               │               │
   │──[calls]─────▶│               │               │               │
   │               │──[create session]─────────────────────────────▶│
   │◀──[IVR greeting audio]────────│──[Coqui TTS]──│               │
   │               │               │               │               │
   │──[presses 1]─▶│  (DTMF: "1")  │               │               │
   │               │──POST /adapters/ivr/dtmf──────────────────────▶│
   │               │               │               │◀{intent: LANG_HINDI}│
   │◀──[Hindi TTS: "कौन सा प्रमाण पत्र?"]─────────│               │
   │               │               │               │               │
   │──[presses 1]─▶│  (DTMF: "1" = Income Cert)    │               │
   │               │──POST /adapters/ivr/dtmf───────────────────────▶│
   │◀──[Hindi TTS: "अपना नाम बोलें"]──────────────│               │
   │               │               │               │               │
   │──[speaks]────▶│──[audio capture]──────────────▶               │
   │               │               │──[Whisper STT LOCAL]──────────│
   │               │               │◀{transcript}──│               │
   │               │               │──[route to FSM]───────────────▶│
   │◀──[TTS response]──────────────│               │               │
```

---

## E. Sequence Diagram: Authentication & Consent

```
Citizen        API Layer      OTP Service    SMS Adapter    JWT Service    DB
   │               │               │               │               │        │
   │──[phone no]──▶│               │               │               │        │
   │               │──generate────▶│               │               │        │
   │               │               │──[OTP: 456789]▶               │        │
   │               │               │               │──[log to file]│        │
   │               │               │──[store OTP]──────────────────────────▶│
   │◀──["OTP sent"]│               │               │               │        │
   │──[says OTP]──▶│               │               │               │        │
   │               │──verify───────▶               │               │        │
   │               │               │◀{valid}        │               │        │
   │               │──sign JWT─────────────────────────────────────▶        │
   │               │◀──{JWT token}─────────────────────────────────│        │
   │               │──store session────────────────────────────────────────▶│
   │◀──{token}─────│               │               │               │        │
   │               │               │               │               │        │
   │──[consent]───▶│               │               │               │        │
   │               │──[TTS consent stmt in lang]───▶               │        │
   │◀──[audio]─────│               │               │               │        │
   │──["हाँ"]─────▶│               │               │               │        │
   │               │──[Whisper STT: "हाँ"]──────────               │        │
   │               │──[LLM: confirm consent phrase]─               │        │
   │               │──[store consent + audio hash]─────────────────────────▶│
   │◀──[consent confirmed]─────────│               │               │        │
```

---

## F. Sequence Diagram: Document Processing

```
Citizen        Document API    OCR Engine     Validator      FSM Engine
   │               │               │               │               │
   │──[upload img]▶│               │               │               │
   │               │──[classify doc type]──────────│               │
   │               │──[preprocess: denoise, deskew]│               │
   │               │──[OCR]────────▶               │               │
   │               │               │◀{raw_text}     │               │
   │               │──[extract fields]─────────────▶               │
   │               │               │               │◀{structured fields}│
   │               │──[cross-validate vs form data]│               │
   │               │               │               │◀{match_score: 0.92}│
   │               │──[check required docs complete]───────────────▶│
   │               │               │               │               │[update state]
   │◀──[result: verified / rejected with reason]────────────────────│
```

---

## G. Sequence Diagram: Failure Recovery & Escalation

```
Citizen        API Layer      FSM Engine    Redis         Escalation    Officer
   │               │               │           │            Queue          │
   │──[drops]──────│               │           │               │           │
   │               │──[save state]─────────────▶               │           │
   │               │               │           │[TTL: 24h]     │           │
   │               │               │           │               │           │
   │──[reconnects]▶│               │           │               │           │
   │               │──[load state]─────────────▶               │           │
   │               │               │◀{state, fields captured}──│           │
   │◀──[resume from where you left off]────────│               │           │
   │               │               │           │               │           │
   │               │   [Max retries exceeded]  │               │           │
   │               │──[escalate]───▶           │               │           │
   │               │               │──[push to queue]──────────▶           │
   │               │               │           │               │──[notify]▶│
   │◀──["Your case has been escalated"]────────│               │           │
   │               │               │           │               │◀[resolve]─│
   │◀──[resolution notification]───│           │               │           │
```

---

## H. Data Sovereignty Enforcement Diagram

```
                         DATA CLASSIFIER MIDDLEWARE
                    ┌──────────────────────────────────┐
                    │                                  │
  Incoming Request  │  1. Inspect payload              │
  ─────────────────▶│  2. Run PII regex scanner        │
                    │  3. Check field classification   │
                    │                                  │
                    │  RESTRICTED?          SAFE?      │
                    │      │                  │        │
                    └──────┼──────────────────┼────────┘
                           │                  │
                    ┌──────▼──────┐   ┌───────▼──────┐
                    │ LOCAL ONLY  │   │ PERMITTED     │
                    │ PROCESSING  │   │ DESTINATIONS  │
                    │             │   │               │
                    │ ✓ Whisper   │   │ ✓ Model DL    │
                    │ ✓ Ollama    │   │ ✓ Generic TTS │
                    │ ✓ Tesseract │   │   (no PII)    │
                    │ ✓ PostgreSQL│   │ ✓ OSS repos   │
                    │ ✓ Redis     │   │               │
                    │             │   │               │
                    │ ✗ ANY cloud │   │ ✗ PII data    │
                    │   API call  │   │ ✗ Audio files │
                    └─────────────┘   └───────────────┘
                           │
                    ┌──────▼──────────────────────────┐
                    │          AUDIT LOG               │
                    │ Every decision logged locally    │
                    │ with: timestamp, session_id,     │
                    │ action, classification, result   │
                    └──────────────────────────────────┘
```

---

## I. Certificate Flow State Machine (Visual)

```
                         ┌─────────────────┐
                         │      IDLE       │
                         └────────┬────────┘
                                  │ channel_connect
                         ┌────────▼────────┐
                         │   LANG_SELECT   │◀──────────────────────┐
                         └────────┬────────┘                       │
                                  │ lang_chosen                    │
                         ┌────────▼────────┐                       │
                         │      AUTH       │──error/timeout────────▶│
                         └────────┬────────┘          (retry x3)   │
                                  │ auth_success                   │
                         ┌────────▼────────┐                       │
                         │    CONSENT      │──no_consent──────────▶EXIT
                         └────────┬────────┘
                                  │ consent_given
                         ┌────────▼────────┐
                         │  SVC_SELECTION  │
                         └────────┬────────┘
                                  │ service_chosen
                         ┌────────▼────────┐     invalid_input
                         │  FORM_CAPTURE   │◀─────────────────────┐
                         └────────┬────────┘                      │
                                  │ all_fields_valid          ┌───┴────────┐
                         ┌────────▼────────┐                  │  RE_PROMPT │
                         │  DOC_UPLOAD     │──invalid_doc─────▶└────────────┘
                         └────────┬────────┘
                                  │ docs_verified
                         ┌────────▼────────┐
                         │  PAYMENT_INIT   │
                         └────────┬────────┘
                                  │ payment_initiated
                         ┌────────▼────────┐
                    ┌────│  PAYMENT_WAIT   │────fail──────────────────────┐
                    │    └────────┬────────┘                              │
                    │             │ payment_success              ┌────────▼────────┐
                    │    ┌────────▼────────┐                     │ PAYMENT_RETRY   │
                    │    │   SUBMISSION    │                     └────────┬────────┘
                    │    └────────┬────────┘                              │
                    │             │ submitted                             │ max_retry
                    │    ┌────────▼────────┐                    ┌────────▼────────┐
                    │    │ RECEIPT_ISSUED  │                    │   ESCALATION    │
                    │    └────────┬────────┘                    └────────┬────────┘
                    │             │                                      │
                    │    ┌────────▼────────┐                    ┌────────▼────────┐
                    │    │  STATUS_TRACK   │                    │    RESOLVED     │
                    │    └────────┬────────┘                    └─────────────────┘
                    │             │ correction_needed
                    │    ┌────────▼────────┐
                    │    │   CORRECTION    │──────────────────────────────┐
                    │    └─────────────────┘                              │
                    │                                                     │
                    └─────────────────────────────────────────────────────▶
                                                                    COMPLETED
```

---

## J. Observability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICES (all local)                        │
│  FastAPI ─── Whisper ─── Ollama ─── Coqui ─── PostgreSQL       │
│     │            │           │          │           │            │
│     └────────────┴───────────┴──────────┴───────────┘           │
│                             │                                    │
│                    /metrics (Prometheus format)                  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ scrape every 15s
                    ┌─────────▼─────────┐
                    │    Prometheus     │
                    │  (time-series DB) │
                    └─────────┬─────────┘
                              │ query
                    ┌─────────▼─────────┐
                    │      Grafana      │
                    │  (dashboards)     │
                    │                  │
                    │  • Voice Latency  │
                    │  • Active Sessions│
                    │  • Error Rates   │
                    │  • Channel Stats │
                    │  • Data Boundary │
                    │    Violations=0  │
                    └──────────────────┘

Structured Logs (structlog JSON):
  All services ──▶ stdout ──▶ Docker log driver ──▶ Admin Dashboard log viewer
```

---

## K. Docker Compose Service Map

```
docker-compose.yml
│
├── postgres:16          port 5432    (restricted data store)
├── redis:7-alpine       port 6379    (session cache)
├── rabbitmq:3-mgmt      port 5672    (async queue)
├── prometheus:latest    port 9090    (metrics)
├── grafana:latest       port 3002    (dashboards)
│
├── backend:             port 8000    (FastAPI app)
│   ├── depends_on: postgres, redis, rabbitmq
│   ├── volumes: ./models/whisper (pre-downloaded)
│   ├── volumes: ./models/coqui   (pre-downloaded)
│   └── volumes: ./models/ollama  (pre-downloaded)
│
├── ollama:              port 11434   (local LLM server)
│   └── volumes: ./models/ollama
│
├── frontend:            port 3000    (React citizen portal)
├── admin-dashboard:     port 3001    (React admin)
├── whatsapp-simulator:  port 3003    (mock WA)
└── ivr-simulator:       port 3004    (mock IVR)
```

---

## L. API Contract Summary

```
BASE: http://localhost:8000/api/v1 (or /api on unified gateway)

AUTH
  POST /auth/init              → {session_id, otp_sent: true}
  POST /auth/verify            → {jwt_token, expires_in}
  POST /auth/refresh           → {jwt_token}

VOICE
  POST /voice/process          → {extractedValue, isValid, explanation, latencyMs}
  POST /voice/stt              → {transcript, language, confidence}
  POST /voice/tts              → audio/wav stream

CONVERSATION
  POST /conversation/message   → {response_text, state, next_action}
  GET  /conversation/state     → {current_state, captured_fields}
  POST /conversation/reset     → {ok}

CERTIFICATES & APPLICATIONS
  POST /applications/submit    → {success, application: {...}}
  GET  /applications/status/{token} → {found: true, application: {...}}

DOCUMENTS & OCR
  POST /ocr/analyze            → {status, ocrConfidence, extractedData, isMatch}
  POST /documents/upload       → {doc_type, extracted_fields, valid}

ADMIN & AUDIT
  GET  /audit-logs             → {logs: [...]}
  GET  /metrics                → {latency, activeSessions, counts, violations: 0}
  GET  /escalation             → {tickets: [...]}
  POST /escalation/resolve     → {success: true, ticket: {...}}

OBSERVABILITY
  GET  /health                 → {status: "HEALTHY", runtime: "Modular Python 3 Backend + SQLite", dataSovereignty: "AIR_GAPPED_LOCAL_ENFORCED"}
```

---

## M. Technology Decision Matrix

| Concern | Choice | Free? | Local? | Why |
|---------|--------|-------|--------|-----|
| STT | Whisper Tiny / Web Speech API | ✅ | ✅ | Best OSS multilingual STT, Zero cloud data leakage |
| TTS | Coqui TTS VITS / Web Speech Synthesis | ✅ | ✅ | Natural voice across Indian languages |
| LLM | Modular Python NLU / Ollama / Gemini Fallback | ✅ | ✅ | Air-gapped entity extraction & zero PII egress |
| Translation | Indic Regex + mBART-50 / IndicTrans | ✅ | ✅ | 50 languages including Indian scripts |
| OCR | Tesseract 5 / OpenCV grayscale | ✅ | ✅ | Best OSS OCR, Hindi/Tamil/Telugu support |
| API Framework | Modular Python 3 Backend + Express Gateway | ✅ | ✅ | Async, lightweight, thread-safe, SQLite local |
| Database | SQLite3 / PostgreSQL 16 (Local) | ✅ | ✅ | ACID, zero-egress audit ledger |
| Frontend | React 19 + Tailwind CSS + Vite | ✅ | ✅ | High-contrast Elegant Dark UI, responsive, accessible |
| Observability | Live Admin Dashboard Telemetry + Prometheus | ✅ | ✅ | Real-time tracking of latency and data sovereignty |
