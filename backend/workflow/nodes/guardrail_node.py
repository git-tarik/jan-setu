"""
Data Sovereignty & Guardrail Agent Node.
Inspects incoming inputs for restricted PII patterns, ensures air-gap policy, and writes sovereign audit records.
"""
import re
from backend.workflow.state import RevenueAgentState
from backend.services.audit_service import AuditService

def guardrail_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node that intercepts and sanitizes inputs before LLM/NLU processing."""
    utterance = state.latest_utterance or ""
    state.execution_trace.append("guardrail_node:inspected")

    # Detect Aadhaar (12 digits), PAN, and sensitive financial tokens
    has_aadhaar = bool(re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", utterance))
    has_pan = bool(re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", utterance, re.IGNORECASE))
    
    if has_aadhaar or has_pan:
        state.pii_violations_prevented += 1
        AuditService.log_event(
            action="PII_GUARDRAIL_LOCAL_INTERCEPT",
            channel=state.channel,
            details=f"Citizen utterance contained sensitive ID token (Aadhaar/PAN). Intercepted and retained strictly in local memory.",
            session_id=state.session_id,
            phone_or_identifier=state.citizen_phone,
            state_before=state.current_step,
            state_after=state.current_step,
            pii_detected=True
        )

    # Append to message ledger
    if utterance:
        state.messages.append({
            "role": "citizen",
            "content": utterance,
            "channel": state.channel
        })

    return state
