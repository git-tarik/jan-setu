"""
Escalation Queue & Officer Triage Service (Python).
Manages officer review tickets for low-confidence OCR or dispute cases.
"""
from backend.database import get_connection

class EscalationService:
    @staticmethod
    def get_tickets():
        """Returns all officer escalation tickets."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM escalation_tickets ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()

        tickets = []
        for r in rows:
            tickets.append({
                "id": r["id"],
                "applicationId": r["application_id"],
                "citizenName": r["citizen_name"],
                "phone": r["phone"],
                "certificateName": r["certificate_name"],
                "channel": r["channel"],
                "language": r["language"],
                "reason": r["reason"],
                "status": r["status"],
                "priority": r["priority"],
                "assignedOfficer": r["assigned_officer"],
                "createdAt": r["created_at"],
                "notes": r["notes"]
            })
        return tickets

    @staticmethod
    def resolve_ticket(ticket_id: str, notes: str = None) -> dict:
        """Resolves an escalation ticket."""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT notes FROM escalation_tickets WHERE id = ?", (ticket_id,))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            return {"success": False, "message": "Ticket not found"}

        current_notes = existing["notes"] or ""
        resolution_entry = f"Resolved by Officer: {notes or 'Manually approved after scrutiny.'}"
        updated_notes = f"{current_notes} | {resolution_entry}" if current_notes else resolution_entry

        cursor.execute("""
        UPDATE escalation_tickets 
        SET status = 'RESOLVED', notes = ?
        WHERE id = ?
        """, (updated_notes, ticket_id))
        conn.commit()

        cursor.execute("SELECT * FROM escalation_tickets WHERE id = ?", (ticket_id,))
        r = cursor.fetchone()
        conn.close()

        return {
            "success": True,
            "ticket": {
                "id": r["id"],
                "applicationId": r["application_id"],
                "citizenName": r["citizen_name"],
                "phone": r["phone"],
                "certificateName": r["certificate_name"],
                "channel": r["channel"],
                "language": r["language"],
                "reason": r["reason"],
                "status": r["status"],
                "priority": r["priority"],
                "assignedOfficer": r["assigned_officer"],
                "createdAt": r["created_at"],
                "notes": r["notes"]
            }
        }
