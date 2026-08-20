import React from 'react';
import './ArchitecturePlan.css';

export const ArchitecturePlan = () => {
  return (
    <div className="arch-plan-container">
      <div className="arch-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          🏛️ JanSetu Voice: Free & Open-Source Technology Stack
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Architectural specification for 100% data sovereign, air-gapped revenue services in compliance with DPDP Act 2023.
        </p>

        <table className="arch-table">
          <thead>
            <tr>
              <th>Layer / Concern</th>
              <th>Technology Choice</th>
              <th>License / Cost</th>
              <th>Sovereignty Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Speech-to-Text (STT)</strong></td>
              <td>OpenAI Whisper Tiny (Quantized)</td>
              <td>MIT / 100% Free</td>
              <td>Local In-Memory Inference</td>
            </tr>
            <tr>
              <td><strong>Agentic Workflow Engine</strong></td>
              <td>LangGraph DAG StateGraph + Checkpointer</td>
              <td>MIT / 100% Free</td>
              <td>Air-Gapped Directed Acyclic Graph</td>
            </tr>
            <tr>
              <td><strong>Large Language Model (NLU)</strong></td>
              <td>Llama 3.2 3B (GGUF 4-bit)</td>
              <td>Llama Community / $0</td>
              <td>Local CPU/GPU Inference</td>
            </tr>
            <tr>
              <td><strong>Text-to-Speech (TTS)</strong></td>
              <td>Coqui TTS / Piper Indic Vocoder</td>
              <td>Mozilla Public / $0</td>
              <td>Local Audio Synthesis</td>
            </tr>
            <tr>
              <td><strong>Document Verification</strong></td>
              <td>Tesseract 5 OCR + OpenCV</td>
              <td>Apache 2.0 / $0</td>
              <td>Zero Data Egress Memory Buffer</td>
            </tr>
            <tr>
              <td><strong>Persistence & Audit Ledger</strong></td>
              <td>SQLite + WAL Mode + SHA-256 Hashing</td>
              <td>Public Domain / $0</td>
              <td>Tamper-Evident Local Storage</td>
            </tr>
            <tr>
              <td><strong>Frontend Shell</strong></td>
              <td>React 18 + Vanilla CSS (No Tailwind)</td>
              <td>MIT / $0</td>
              <td>Browser Pure JavaScript</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="arch-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          🛡️ Zero-Egress Air-Gap Trust Boundary
        </h3>
        <pre className="code-pre">
{`+-------------------------------------------------------------------------+
|                  CITIZEN VOICE / OMNICHANNEL INGRESS                    |
|   Web Browser MediaRecorder | WhatsApp Webhook | IVR PSTN Asterisk Gateway |
+-------------------------------------------------------------------------+
                                    |
                                    v (Encrypted TLS / WebSocket)
+-------------------------------------------------------------------------+
|                  AIR-GAPPED ON-PREMISE LOCAL BOUNDARY                   |
|                                                                         |
|  [ Guardrail Agent Node ] ---> Scans & Masks Aadhaar / Sensitive PII    |
|             |                                                           |
|             v                                                           |
|  [ LangGraph StateGraph ] ---> Intent & Entity NLU Node (8 Dialects)    |
|             |                                                           |
|             v                                                           |
|  [ Validation Node ]      ---> Statutory Revenue Rules & Limits         |
|        /          \\                                                     |
| (Retries < 3)   (Retries >= 3)                                          |
|      /              \\                                                   |
|     v                v                                                  |
| [ Response Node ]  [ Escalation Officer Node ]                          |
|             |                |                                          |
|             v                v                                          |
|   [ SQLite WAL DB ] <--- [ Immutable SHA-256 Data Sovereign Audit Log ] |
+-------------------------------------------------------------------------+
`}
        </pre>
      </div>
    </div>
  );
};
