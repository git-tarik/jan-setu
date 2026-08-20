"""
Officer Escalation & Dispute Agent Node.
Handles exceptions, repeated recognition errors, and creates triage tickets in the database.
"""
from backend.workflow.state import RevenueAgentState
from backend.database import get_connection
from backend.services.audit_service import AuditService
from datetime import datetime
import uuid

def escalation_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node that creates an officer escalation ticket and logs the issue."""
    state.execution_trace.append("escalation_node:escalating")
    state.is_escalated = True
    
    ticket_id = f"ESC-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
    app_id = f"APP-{state.certificate_id.upper()[:3]}-{uuid.uuid4().hex[:5]}"
    citizen_name = state.captured_fields.get("fullName", "Citizen Applicant")
    phone = state.citizen_phone or "+91 98765 00000"
    reason = state.escalation_reason or f"Automatic escalation: {len(state.validation_errors)} validation errors after {state.retry_count} retries."

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO escalation_tickets (
        id, application_id, citizen_name, phone, certificate_name, channel,
        language, reason, status, priority, assigned_officer, created_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_id, app_id, citizen_name, phone, state.certificate_name, state.channel,
        state.language, reason, "PENDING", "HIGH", None, datetime.utcnow().isoformat(),
        f"Triggered by LangGraph Escalation Agent Node. Session: {state.session_id}"
    ))
    conn.commit()
    conn.close()

    AuditService.log_event(
        action="ESCALATION_TICKET_DISPATCHED",
        channel=state.channel,
        details=f"Ticket {ticket_id} created for {citizen_name} by LangGraph Escalation Node.",
        session_id=state.session_id,
        phone_or_identifier=phone,
        state_before=state.current_step,
        state_after="ESCALATED",
        pii_detected=False
    )

    state.response_text = f"Your application has been escalated to a revenue officer for manual verification (Ticket: {ticket_id}). You will receive an update via SMS."
    state.current_step = "ESCALATED"
    return state
