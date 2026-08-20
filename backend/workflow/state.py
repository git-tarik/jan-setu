"""
LangGraph State Definition for Multilingual Revenue Services.
Defines the schema, channels, and state reducers for the agentic workflow.
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime

@dataclass
class AgentMessage:
    role: str  # "citizen", "agent", "system", "tool"
    content: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RevenueAgentState:
    session_id: str
    citizen_phone: str = ""
    language: str = "hi"
    channel: str = "web"  # "web", "whatsapp", "ivr"
    
    # Journey & Form State
    current_step: str = "IDLE"  # IDLE, LANG_SELECT, AUTH, CONSENT, SERVICE_SELECT, FORM_CAPTURE, DOC_UPLOAD, PAYMENT, COMPLETED, ESCALATED
    certificate_id: str = "income-cert"
    certificate_name: str = "Income Certificate"
    target_field_id: str = ""
    captured_fields: Dict[str, Any] = field(default_factory=dict)
    
    # NLU / Intent Extractions
    latest_utterance: str = ""
    extracted_value: str = ""
    extracted_intent: str = ""
    confidence_score: float = 1.0
    
    # Document & Validation
    document_data: Dict[str, Any] = field(default_factory=dict)
    ocr_status: str = "NOT_STARTED"  # NOT_STARTED, IN_PROGRESS, PASSED, FAILED
    ocr_confidence: int = 0
    validation_passed: bool = True
    validation_errors: List[str] = field(default_factory=list)
    
    # Escalation & Safety
    is_escalated: bool = False
    escalation_reason: str = ""
    retry_count: int = 0
    pii_violations_prevented: int = 0
    
    # Output & Flow Control
    response_text: str = ""
    next_prompt_hint: str = ""
    next_field_id: str = ""
    execution_trace: List[str] = field(default_factory=list)
    messages: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RevenueAgentState":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
