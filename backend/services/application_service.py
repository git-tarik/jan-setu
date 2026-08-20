"""
Application Service (Python).
Handles statutory certificate application submissions, status tracking, token verification,
and administrative officer verification workflows.
"""
import json
import random
import hashlib
from datetime import datetime, timedelta
from backend.database import get_connection
from backend.services.audit_service import AuditService
from backend.config import DEFAULT_SLA_DAYS

class ApplicationService:
    @staticmethod
    def _row_to_dict(row) -> dict:
        """Converts an SQLite row object into a clean dictionary with parsed JSON fields."""
        form_data = {}
        try:
            form_data = json.loads(row["form_data_json"]) if row["form_data_json"] else {}
        except Exception:
            form_data = {}

        return {
            "id": row["id"],
            "applicationId": row["id"],
            "applicationNumber": row["application_number"],
            "trackingToken": row["tracking_token"],
            "certificateId": row["certificate_id"],
            "certificateName": row["certificate_name"],
            "citizenName": row["citizen_name"],
            "phone": row["phone"],
            "userId": row["user_id"] if "user_id" in row.keys() else None,
            "language": row["language"],
            "channel": row["channel"],
            "formData": form_data,
            "documentUploaded": bool(row["document_uploaded"]),
            "documentName": row["document_name"] or "Identity_Proof_Scan.pdf",
            "ocrConfidence": row["ocr_confidence"] or 95,
            "paymentStatus": row["payment_status"] or "SUCCESS",
            "paymentRef": row["payment_ref"],
            "amount": row["amount"] or 50.0,
            "status": row["status"] or "PENDING_VERIFICATION",
            "verificationStatus": row["verification_status"] if "verification_status" in row.keys() and row["verification_status"] else (row["status"] or "PENDING_VERIFICATION"),
            "verifiedBy": row["verified_by"] if "verified_by" in row.keys() else None,
            "verifiedById": row["verified_by_id"] if "verified_by_id" in row.keys() else None,
            "verifiedAt": row["verified_at"] if "verified_at" in row.keys() else None,
            "officerRemarks": row["officer_remarks"] if "officer_remarks" in row.keys() else None,
            "rejectionReason": row["rejection_reason"] if "rejection_reason" in row.keys() else None,
            "certificateNumber": row["certificate_number"] if "certificate_number" in row.keys() else None,
            "digitalSignatureHash": row["digital_signature_hash"] if "digital_signature_hash" in row.keys() else None,
            "createdAt": row["created_at"],
            "submittedAt": row["created_at"],
            "estimatedCompletionDate": row["estimated_completion_date"]
        }

    @staticmethod
    def submit_application(payload: dict) -> dict:
        """Saves a new certificate application to the SQLite database and logs audit entry."""
        cert_id = payload.get("certificateId") or payload.get("certificate_id", "income-cert")
        cert_name = payload.get("certificateName") or payload.get("certificate_name", "Income Certificate")
        citizen_name = payload.get("citizenName") or payload.get("citizen_name") or payload.get("captured_fields", {}).get("fullName") or "Citizen Applicant"
        phone = payload.get("phone", "+91 98765 00000")
        user_id = payload.get("userId") or payload.get("user_id") or "user-citizen-01"
        language = payload.get("language", "en")
        channel = payload.get("channel", "web")
        form_data = payload.get("formData") or payload.get("captured_fields") or {}
        amount = float(payload.get("amount") or payload.get("fee", 50.0))
        doc_name = payload.get("documentName", "Identity_Proof_Scan.pdf")
        ocr_confidence = int(payload.get("ocrConfidence", 95))

        year = datetime.utcnow().year
        rand_suffix = random.randint(100000, 999999)
        app_number = f"REV-{year}-UP-{rand_suffix}"
        
        prefix = cert_id.upper()[:3] if cert_id else "GEN"
        token_rand = random.randint(10000, 99999)
        tracking_token = f"TRK-{prefix}-{token_rand}"

        sla_days = DEFAULT_SLA_DAYS.get(cert_id, 7)
        completion_date = (datetime.utcnow() + timedelta(days=sla_days)).strftime("%d/%m/%Y")
        created_at = datetime.utcnow().isoformat()
        app_id = f"APP-{int(datetime.utcnow().timestamp() * 1000)}"
        payment_ref = payload.get("payment_id") or f"UPI/{int(datetime.utcnow().timestamp())}/OKGOV"

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO applications (
            id, application_number, tracking_token, certificate_id, certificate_name,
            citizen_name, phone, user_id, language, channel, form_data_json, document_uploaded,
            document_name, ocr_confidence, payment_status, payment_ref, amount, status,
            verification_status, created_at, estimated_completion_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_id, app_number, tracking_token, cert_id, cert_name,
            citizen_name, phone, user_id, language, channel, json.dumps(form_data), 1,
            doc_name, ocr_confidence, "SUCCESS", payment_ref, amount, "PENDING_VERIFICATION",
            "PENDING_VERIFICATION", created_at, completion_date
        ))
        conn.commit()
        conn.close()

        # Record Sovereign Audit Trail
        AuditService.log_event(
            action="APPLICATION_SUBMITTED_FOR_VERIFICATION",
            channel=channel,
            details=f"Application {app_number} submitted for {cert_name} by {citizen_name}. Queued for Officer Verification at Sub-Division Office. Token: {tracking_token}.",
            phone_or_identifier=phone,
            state_before="PAYMENT_CONFIRMATION",
            state_after="PENDING_OFFICER_VERIFICATION",
            pii_detected=True
        )

        app_record = {
            "id": app_id,
            "applicationId": app_id,
            "applicationNumber": app_number,
            "trackingToken": tracking_token,
            "certificateId": cert_id,
            "certificateName": cert_name,
            "citizenName": citizen_name,
            "phone": phone,
            "userId": user_id,
            "language": language,
            "channel": channel,
            "formData": form_data,
            "documentUploaded": True,
            "documentName": doc_name,
            "ocrConfidence": ocr_confidence,
            "paymentStatus": "SUCCESS",
            "paymentRef": payment_ref,
            "amount": amount,
            "status": "PENDING_VERIFICATION",
            "verificationStatus": "PENDING_VERIFICATION",
            "createdAt": created_at,
            "estimatedCompletionDate": completion_date
        }

        return {
            "success": True,
            "application": app_record,
            "applicationId": app_id,
            "application_id": app_id,
            "trackingToken": tracking_token,
            "tracking_token": tracking_token,
            "status": "PENDING_VERIFICATION",
            "slaDate": completion_date,
            "certificateName": cert_name
        }

    @staticmethod
    def get_by_token(token: str) -> dict:
        """Finds application by tracking token or registration number."""
        clean_token = token.strip()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM applications 
        WHERE LOWER(tracking_token) = LOWER(?) OR LOWER(application_number) = LOWER(?)
        LIMIT 1
        """, (clean_token, clean_token))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return {"found": False, "message": "Application token not found in revenue records."}

        app_record = ApplicationService._row_to_dict(row)
        return {"found": True, "application": app_record}

    @staticmethod
    def get_by_user_id(user_id: str, phone: str = None) -> list:
        """Retrieves all certificate applications submitted by a citizen user."""
        conn = get_connection()
        cursor = conn.cursor()
        if phone:
            cursor.execute("""
            SELECT * FROM applications 
            WHERE user_id = ? OR phone = ?
            ORDER BY created_at DESC
            """, (user_id, phone))
        else:
            cursor.execute("""
            SELECT * FROM applications 
            WHERE user_id = ?
            ORDER BY created_at DESC
            """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [ApplicationService._row_to_dict(row) for row in rows]

    @staticmethod
    def get_all_applications(status_filter: str = None, cert_filter: str = None, search: str = None) -> list:
        """Retrieves all applications for admin queue with optional filtering."""
        conn = get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM applications WHERE 1=1"
        params = []

        if status_filter and status_filter.upper() != "ALL":
            if status_filter.upper() == "PENDING":
                query += " AND (status = 'PENDING_VERIFICATION' OR status = 'SUBMITTED' OR verification_status = 'PENDING_VERIFICATION')"
            elif status_filter.upper() in ("APPROVED", "ISSUED"):
                query += " AND (status = 'APPROVED_AND_ISSUED' OR verification_status = 'APPROVED')"
            elif status_filter.upper() == "REJECTED":
                query += " AND (status = 'REJECTED' OR verification_status = 'REJECTED')"
            elif status_filter.upper() == "CORRECTION":
                query += " AND (status = 'CORRECTION_REQUIRED' OR verification_status = 'CORRECTION_REQUIRED')"
            else:
                query += " AND (status = ? OR verification_status = ?)"
                params.extend([status_filter, status_filter])

        if cert_filter and cert_filter != "ALL":
            query += " AND certificate_id = ?"
            params.append(cert_filter)

        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query += " AND (LOWER(citizen_name) LIKE ? OR LOWER(application_number) LIKE ? OR LOWER(tracking_token) LIKE ? OR phone LIKE ?)"
            params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

        query += " ORDER BY created_at DESC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()

        return [ApplicationService._row_to_dict(row) for row in rows]

    @staticmethod
    def get_by_id(app_id: str) -> dict:
        """Finds application by primary ID."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE id = ? LIMIT 1", (app_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return ApplicationService._row_to_dict(row)

    @staticmethod
    def verify_application(app_id: str, action: str, officer_info: dict, remarks: str = "") -> dict:
        """
        Executes Officer Verification Action on an application (APPROVE, REJECT, REQUEST_CORRECTION, ESCALATE).
        """
        action = action.upper().strip()
        officer_name = officer_info.get("name", "Verification Officer")
        officer_id = officer_info.get("officer_id") or officer_info.get("id", "OFF-REV-001")
        now_iso = datetime.utcnow().isoformat()

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE id = ? LIMIT 1", (app_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return {"success": False, "error": f"Application '{app_id}' not found."}

        app_dict = ApplicationService._row_to_dict(row)
        citizen_phone = app_dict.get("phone", "")
        cert_name = app_dict.get("certificateName", "Certificate")
        citizen_name = app_dict.get("citizenName", "Citizen")

        if action in ("APPROVE", "VERIFY"):
            cert_year = datetime.utcnow().year
            rand_cert = random.randint(100000, 999999)
            prefix = app_dict.get("certificateId", "REV").upper()[:3]
            cert_number = f"CERT-UP-{cert_year}-{prefix}-{rand_cert}"
            
            # Cryptographic SHA-256 seal of certificate authenticity
            payload_to_sign = f"{cert_number}|{citizen_name}|{app_dict.get('applicationNumber')}|{officer_id}|{now_iso}"
            sig_hash = hashlib.sha256(payload_to_sign.encode("utf-8")).hexdigest()

            cursor.execute("""
            UPDATE applications SET
                status = 'APPROVED_AND_ISSUED',
                verification_status = 'APPROVED',
                verified_by = ?,
                verified_by_id = ?,
                verified_at = ?,
                officer_remarks = ?,
                certificate_number = ?,
                digital_signature_hash = ?
            WHERE id = ?
            """, (officer_name, officer_id, now_iso, remarks or "Verified and approved by Revenue Officer.", cert_number, sig_hash, app_id))

            conn.commit()
            conn.close()

            AuditService.log_event(
                action="OFFICER_APPLICATION_APPROVED",
                channel="admin_desk",
                details=f"Application {app_dict['applicationNumber']} approved by {officer_name} ({officer_id}). Issued Certificate No: {cert_number}.",
                phone_or_identifier=citizen_phone,
                state_before="PENDING_VERIFICATION",
                state_after="APPROVED_AND_ISSUED"
            )

            return {
                "success": True,
                "status": "APPROVED_AND_ISSUED",
                "verification_status": "APPROVED",
                "certificate_number": cert_number,
                "digital_signature_hash": sig_hash,
                "verified_by": officer_name,
                "verified_at": now_iso,
                "message": f"Application approved successfully. Certificate {cert_number} generated."
            }

        elif action in ("REJECT", "DECLINE"):
            cursor.execute("""
            UPDATE applications SET
                status = 'REJECTED',
                verification_status = 'REJECTED',
                verified_by = ?,
                verified_by_id = ?,
                verified_at = ?,
                officer_remarks = ?,
                rejection_reason = ?
            WHERE id = ?
            """, (officer_name, officer_id, now_iso, remarks, remarks or "Verification criteria not met.", app_id))

            conn.commit()
            conn.close()

            AuditService.log_event(
                action="OFFICER_APPLICATION_REJECTED",
                channel="admin_desk",
                details=f"Application {app_dict['applicationNumber']} rejected by {officer_name}. Reason: {remarks}.",
                phone_or_identifier=citizen_phone,
                state_before="PENDING_VERIFICATION",
                state_after="REJECTED"
            )

            return {
                "success": True,
                "status": "REJECTED",
                "verification_status": "REJECTED",
                "verified_by": officer_name,
                "verified_at": now_iso,
                "rejection_reason": remarks,
                "message": "Application rejected with statutory reason recorded."
            }

        elif action in ("REQUEST_CORRECTION", "CORRECTION"):
            cursor.execute("""
            UPDATE applications SET
                status = 'CORRECTION_REQUIRED',
                verification_status = 'CORRECTION_REQUIRED',
                verified_by = ?,
                verified_by_id = ?,
                verified_at = ?,
                officer_remarks = ?
            WHERE id = ?
            """, (officer_name, officer_id, now_iso, remarks or "Additional document verification requested by Officer.", app_id))

            conn.commit()
            conn.close()

            AuditService.log_event(
                action="OFFICER_CORRECTION_REQUESTED",
                channel="admin_desk",
                details=f"Officer {officer_name} requested corrections for application {app_dict['applicationNumber']}. Remarks: {remarks}.",
                phone_or_identifier=citizen_phone,
                state_before="PENDING_VERIFICATION",
                state_after="CORRECTION_REQUIRED"
            )

            return {
                "success": True,
                "status": "CORRECTION_REQUIRED",
                "verification_status": "CORRECTION_REQUIRED",
                "officer_remarks": remarks,
                "message": "Correction request dispatched to citizen."
            }

        conn.close()
        return {"success": False, "error": f"Unknown verification action '{action}'."}
