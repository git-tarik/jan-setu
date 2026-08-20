"""
Audit Service (Python).
Zero-cloud-egress data sovereignty logging and SHA-256 citizen hash masking.
"""
import hashlib
import uuid
from datetime import datetime
from backend.database import get_connection

class AuditService:
    @staticmethod
    def get_logs(limit=50):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        logs = []
        for r in rows:
            logs.append({
                "id": r["id"],
                "timestamp": r["timestamp"],
                "sessionId": r["session_id"],
                "citizenHash": r["citizen_hash"],
                "action": r["action"],
                "channel": r["channel"],
                "dataClassification": r["data_classification"],
                "externalCallAttempted": bool(r["external_call_attempted"]),
                "externalCallBlocked": bool(r["external_call_blocked"]),
                "piiDetected": bool(r["pii_detected"]),
                "stateBefore": r["state_before"],
                "stateAfter": r["state_after"],
                "details": r["details"],
            })
        conn.close()
        return logs

    @staticmethod
    def log_event(action, channel, details, session_id=None, phone_or_identifier="",
                  state_before="FORM_CAPTURE", state_after="FORM_CAPTURE",
                  pii_detected=True, classification="RESTRICTED_LOCAL"):
        conn = get_connection()
        cursor = conn.cursor()
        
        citizen_hash = hashlib.sha256((phone_or_identifier or "anonymous").encode("utf-8")).hexdigest()
        log_id = f"log-{int(datetime.utcnow().timestamp() * 1000)}"
        sess_id = session_id or f"sess-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()

        cursor.execute("""
        INSERT INTO audit_logs (
            id, timestamp, session_id, citizen_hash, action, channel,
            data_classification, external_call_attempted, external_call_blocked,
            pii_detected, state_before, state_after, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id, now, sess_id, citizen_hash, action, channel,
            classification, 0, 0, 1 if pii_detected else 0,
            state_before, state_after, details
        ))
        conn.commit()
        conn.close()
        return log_id
