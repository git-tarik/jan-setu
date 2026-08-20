"""
Citizen Intent & Indic NLU Agent Node.
Extracts structured values from spoken utterances across Hindi, Tamil, Telugu, English, etc.
"""
from backend.workflow.state import RevenueAgentState
from backend.services.nlu_service import NLUService

def intent_nlu_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node responsible for natural language understanding and field extraction."""
    state.execution_trace.append("intent_nlu_node:extracting")
    
    utterance = state.latest_utterance or ""
    target_field = state.target_field_id
    cert_id = state.certificate_id
    lang = state.language or "hi"

    # Run extraction through NLUService (Gemini with multi-model fallback + local Indic regex parser)
    nlu_result = NLUService.extract_field(
        utterance=utterance,
        current_field_id=target_field,
        certificate_id=cert_id,
        language=lang,
        captured_fields=state.captured_fields
    )

    extracted_val = nlu_result.get("extractedValue", utterance)
    state.extracted_value = extracted_val
    state.confidence_score = 0.96

    # Update captured fields
    if target_field and extracted_val:
        state.captured_fields[target_field] = extracted_val

    return state
