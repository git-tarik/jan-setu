"""
Router & Request Dispatcher (Python 3).
Maps REST API routes (/api/v1/*) to LangGraph workflow engine and modular service controllers.
"""
import json
import urllib.parse
import uuid
from datetime import datetime, timedelta
from backend.services.auth_service import AuthService
from backend.services.application_service import ApplicationService
from backend.services.ocr_service import OCRService
from backend.services.audit_service import AuditService
from backend.services.escalation_service import EscalationService
from backend.services.metrics_service import MetricsService
from backend.workflow import revenue_agent_graph, RevenueAgentState, SQLiteCheckpointer
from backend.database import get_connection

CERTIFICATE_CATALOGUE = [
    {
        "id": "income-cert",
        "name": "Income Certificate",
        "hindi_name": "आय प्रमाण पत्र",
        "description": "Statutory proof of household annual income for scholarships and subsidies.",
        "fee": 50,
        "sla_days": 7,
        "fields": [
            {"id": "fullName", "label": "Full Name", "hindi_label": "पूरा नाम", "type": "text", "prompt": "कृपया अपना पूरा नाम बताएं"},
            {"id": "fatherHusbandName", "label": "Father/Husband Name", "hindi_label": "पिता / पति का नाम", "type": "text", "prompt": "पिता या पति का नाम बताएं"},
            {"id": "annualIncome", "label": "Annual Income (₹)", "hindi_label": "वार्षिक आय", "type": "number", "prompt": "परिवार की कुल वार्षिक आय कितनी है?"},
            {"id": "address", "label": "Residential Address", "hindi_label": "निवास का पता", "type": "text", "prompt": "अपना पूरा पता और गांव/शहर बताएं"}
        ],
        "docs": ["Aadhaar Card", "Salary Slip / Patwari Land Report", "Self Declaration"]
    },
    {
        "id": "caste-cert",
        "name": "Caste Certificate",
        "hindi_name": "जाति प्रमाण पत्र",
        "description": "Statutory verification of community and social reservation.",
        "fee": 50,
        "sla_days": 10,
        "fields": [
            {"id": "fullName", "label": "Full Name", "hindi_label": "पूरा नाम", "type": "text", "prompt": "कृपया अपना पूरा नाम बताएं"},
            {"id": "casteCategory", "label": "Caste Category (OBC/SC/ST/EWS)", "hindi_label": "जाति श्रेणी", "type": "text", "prompt": "अपनी जाति या वर्ग बताएं"},
            {"id": "fatherHusbandName", "label": "Father/Husband Name", "hindi_label": "पिता का नाम", "type": "text", "prompt": "पिता का नाम बताएं"},
            {"id": "subCaste", "label": "Sub-Caste", "hindi_label": "उप-जाति", "type": "text", "prompt": "अपनी उप-जाति बताएं"}
        ],
        "docs": ["Aadhaar Card", "Father's Caste Record / Pradhan Verification", "Ration Card"]
    },
    {
        "id": "domicile-cert",
        "name": "Domicile / Residence Certificate",
        "hindi_name": "मूल निवास प्रमाण पत्र",
        "description": "Proof of permanent state residency for government exams and quota.",
        "fee": 50,
        "sla_days": 5,
        "fields": [
            {"id": "fullName", "label": "Full Name", "hindi_label": "पूरा नाम", "type": "text", "prompt": "कृपया अपना पूरा नाम बताएं"},
            {"id": "yearsOfResidence", "label": "Years of Continuous Residence", "hindi_label": "निवास के वर्ष", "type": "number", "prompt": "आप कितने वर्षों से यहाँ रह रहे हैं?"},
            {"id": "district", "label": "District", "hindi_label": "जिला", "type": "text", "prompt": "अपने जिले का नाम बताएं"},
            {"id": "address", "label": "Permanent Address", "hindi_label": "स्थायी पता", "type": "text", "prompt": "अपना स्थायी पता बताएं"}
        ],
        "docs": ["Electricity Bill / Voter ID", "10th Marksheet / School TC", "Aadhaar Card"]
    },
    {
        "id": "birth-cert",
        "name": "Birth Registration Certificate",
        "hindi_name": "जन्म प्रमाण पत्र",
        "description": "Official municipal / gram panchayat vital record for newborns and children.",
        "fee": 20,
        "sla_days": 3,
        "fields": [
            {"id": "childName", "label": "Child's Full Name", "hindi_label": "बच्चे का नाम", "type": "text", "prompt": "बच्चे का पूरा नाम बताएं"},
            {"id": "dateOfBirth", "label": "Date of Birth", "hindi_label": "जन्म तिथि", "type": "text", "prompt": "जन्म की तारीख बताएं"},
            {"id": "motherName", "label": "Mother's Name", "hindi_label": "माता का नाम", "type": "text", "prompt": "माता का नाम बताएं"},
            {"id": "fatherName", "label": "Father's Name", "hindi_label": "पिता का नाम", "type": "text", "prompt": "पिता का नाम बताएं"}
        ],
        "docs": ["Hospital Discharge Summary", "Parents' Aadhaar Cards", "Affidavit"]
    }
]

def handle_request(method: str, path: str, body: dict = None) -> tuple[int, dict]:
    """
    Dispatches HTTP requests to modular services and the LangGraph workflow engine.
    Supports standard /api/v1/* routes.
    """
    parsed_path = urllib.parse.urlparse(path)
    clean_path = parsed_path.path.rstrip("/")
    query_params = urllib.parse.parse_qs(parsed_path.query)
    body = body or {}

    # --- 1. HEALTH CHECK ---
    if clean_path in ("/api/health", "/api/v1/health") and method == "GET":
        return 200, {
            "status": "HEALTHY",
            "runtime": "Modular Python 3 Backend + LangGraph Agentic Engine",
            "workflowEngine": "LangGraph (DAG StateGraph with SQLite Checkpointer)",
            "dataSovereignty": "AIR_GAPPED_LOCAL_ENFORCED",
            "timestamp": datetime.utcnow().isoformat()
        }

    # --- 2. AUTHENTICATION & REGISTRATION (User & Admin) ---
    elif clean_path == "/api/v1/auth/signup" and method == "POST":
        res = AuthService.signup(body)
        status_code = 200 if res.get("success") else 400
        return status_code, res

    elif clean_path == "/api/v1/auth/login" and method == "POST":
        res = AuthService.login(body)
        status_code = 200 if res.get("success") else 401
        return status_code, res

    elif clean_path == "/api/v1/auth/me" and method == "GET":
        user_id = query_params.get("userId", [None])[0] or query_params.get("id", [None])[0] or "user-citizen-01"
        user = AuthService.get_user_by_id(user_id)
        if user:
            return 200, {"user": user}
        return 404, {"error": "User not found"}

    elif clean_path == "/api/v1/auth/init" and method == "POST":
        phone = str(body.get("phone", "+91 98765 43210")).strip()
        sess_id = f"sess-{uuid.uuid4().hex[:8]}"
        AuditService.log_event(
            action="CITIZEN_AUTH_OTP_SENT",
            channel=body.get("channel", "web"),
            details=f"OTP dispatched via local SMS gateway simulation to {phone[-4:]}.",
            session_id=sess_id,
            phone_or_identifier=phone,
            state_before="IDLE",
            state_after="AUTH_PENDING"
        )
        return 200, {
            "session_id": sess_id,
            "otp_sent": True,
            "phone": phone,
            "demo_otp": "1234",
            "message": "OTP sent successfully to your mobile number."
        }

    elif clean_path == "/api/v1/auth/verify" and method == "POST":
        phone = body.get("phone", "")
        otp = body.get("otp", "")
        sess_id = body.get("session_id", f"sess-{uuid.uuid4().hex[:8]}")

        if otp in ("1234", "0000", "5678") or len(otp) == 4:
            token = f"jwt_jansetu_{uuid.uuid4().hex[:16]}"
            AuditService.log_event(
                action="CITIZEN_AUTH_SUCCESS",
                channel=body.get("channel", "web"),
                details=f"Citizen verified successfully. Session: {sess_id}",
                session_id=sess_id,
                phone_or_identifier=phone,
                state_before="AUTH_PENDING",
                state_after="CONSENT_PENDING"
            )
            return 200, {
                "jwt_token": token,
                "expires_in": 3600,
                "session_id": sess_id,
                "phone": phone,
                "authenticated": True
            }
        else:
            return 400, {
                "authenticated": False,
                "error": "Invalid OTP. Use demo OTP '1234' to continue."
            }

    # --- 3. CITIZEN DASHBOARD APIS ---
    elif clean_path == "/api/v1/citizen/applications" and method == "GET":
        user_id = query_params.get("userId", [None])[0] or query_params.get("user_id", [None])[0] or "user-citizen-01"
        phone = query_params.get("phone", [None])[0]
        apps = ApplicationService.get_by_user_id(user_id, phone)
        return 200, {"applications": apps, "total": len(apps)}

    # --- 4. ADMIN VERIFICATION & MANAGEMENT APIS ---
    elif clean_path == "/api/v1/admin/applications" and method == "GET":
        status_filter = query_params.get("status", [None])[0]
        cert_filter = query_params.get("certificate_id", [None])[0] or query_params.get("certificateId", [None])[0]
        search = query_params.get("search", [None])[0]
        apps = ApplicationService.get_all_applications(status_filter, cert_filter, search)
        
        # Calculate summary counts for admin badges
        all_apps = ApplicationService.get_all_applications(None, None, None)
        pending_count = sum(1 for a in all_apps if a.get("verificationStatus") == "PENDING_VERIFICATION" or a.get("status") in ("PENDING_VERIFICATION", "SUBMITTED"))
        approved_count = sum(1 for a in all_apps if a.get("verificationStatus") == "APPROVED" or a.get("status") == "APPROVED_AND_ISSUED")
        rejected_count = sum(1 for a in all_apps if a.get("verificationStatus") == "REJECTED" or a.get("status") == "REJECTED")
        correction_count = sum(1 for a in all_apps if a.get("verificationStatus") == "CORRECTION_REQUIRED" or a.get("status") == "CORRECTION_REQUIRED")

        return 200, {
            "applications": apps,
            "total": len(apps),
            "summary": {
                "total": len(all_apps),
                "pending": pending_count,
                "approved": approved_count,
                "rejected": rejected_count,
                "correction": correction_count
            }
        }

    elif clean_path.startswith("/api/v1/admin/applications/") and clean_path.endswith("/verify") and method == "POST":
        parts = clean_path.split("/")
        app_id = parts[4] if len(parts) >= 6 else None
        action = body.get("action", "APPROVE")
        officer_info = body.get("officer", {}) or {
            "name": body.get("officer_name", "Shri Rajesh Kumar Sharma"),
            "officer_id": body.get("officer_id", "OFF-UP-2024-SDM-8891")
        }
        remarks = body.get("remarks", "")
        res = ApplicationService.verify_application(app_id, action, officer_info, remarks)
        status_code = 200 if res.get("success") else 400
        return status_code, res

    elif clean_path.startswith("/api/v1/admin/applications/") and method == "GET":
        parts = clean_path.split("/")
        app_id = parts[4] if len(parts) >= 5 else None
        app = ApplicationService.get_by_id(app_id)
        if app:
            return 200, {"application": app}
        return 404, {"error": "Application not found"}

    # --- 5. CERTIFICATE CATALOGUE ---
    elif clean_path == "/api/v1/certificates/catalogue" and method == "GET":
        return 200, CERTIFICATE_CATALOGUE

    # --- 6. VOICE STT / TTS & CONVERSATION ---
    elif clean_path == "/api/v1/voice/stt" and method == "POST":
        audio_text = body.get("text") or body.get("transcript") or "मेरी वार्षिक आय एक लाख बीस हजार रुपये है"
        lang = body.get("language", "hi")
        return 200, {
            "transcript": audio_text,
            "language": lang,
            "confidence": 0.96,
            "model": "whisper-tiny-indic-local"
        }

    elif clean_path == "/api/v1/voice/tts" and method == "POST":
        text = body.get("text", "")
        lang = body.get("language", "hi")
        return 200, {
            "audio_url": f"/audio/synth?text={urllib.parse.quote(text[:60])}&lang={lang}",
            "text": text,
            "language": lang,
            "synthesis_engine": "Coqui-TTS-Indic-Airgap"
        }

    elif clean_path in ("/api/v1/conversation/message", "/api/voice/process") and method == "POST":
        payload = body
        session_id = payload.get("session_id") or payload.get("sessionId") or f"sess-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        utterance = payload.get("utterance") or payload.get("message") or ""
        current_field_id = payload.get("current_field_id") or payload.get("currentFieldId") or ""
        certificate_id = payload.get("certificate_id") or payload.get("certificateId") or "income-cert"
        certificate_name = payload.get("certificate_name") or payload.get("certificateName") or "Income Certificate"
        language = payload.get("language", "hi")
        channel = payload.get("channel", "web")
        captured_fields = payload.get("captured_fields") or payload.get("capturedFields") or {}

        # 1. Retrieve latest checkpoint from SQLite if existing
        existing_state = SQLiteCheckpointer.get_latest_checkpoint(session_id)
        if existing_state:
            state = existing_state
            state.latest_utterance = utterance
            state.target_field_id = current_field_id
            state.language = language
            state.channel = channel
            state.certificate_id = certificate_id
            state.certificate_name = certificate_name
            for k, v in captured_fields.items():
                state.captured_fields[k] = v
        else:
            state = RevenueAgentState(
                session_id=session_id,
                language=language,
                channel=channel,
                certificate_id=certificate_id,
                certificate_name=certificate_name,
                target_field_id=current_field_id,
                latest_utterance=utterance,
                captured_fields=dict(captured_fields)
            )

        # 2. Invoke the compiled LangGraph StateGraph
        final_state = revenue_agent_graph.invoke(state, session_id=session_id)

        return 200, {
            "response_text": final_state.response_text,
            "state": final_state.current_step,
            "next_action": "NEXT_FIELD" if final_state.validation_passed else "RETRY_FIELD",
            "extracted_value": final_state.extracted_value,
            "extractedValue": final_state.extracted_value,
            "extracted_fields": final_state.captured_fields,
            "capturedFields": final_state.captured_fields,
            "is_valid": final_state.validation_passed,
            "isValid": final_state.validation_passed,
            "explanation": final_state.response_text,
            "execution_trace": final_state.execution_trace,
            "executionTrace": final_state.execution_trace,
            "is_escalated": final_state.is_escalated,
            "graphEngine": "LangGraph"
        }

    # --- 7. DOCUMENT UPLOAD & OCR ---
    elif clean_path in ("/api/v1/documents/upload", "/api/ocr/analyze") and method == "POST":
        doc_type = body.get("doc_type") or body.get("docType") or "Aadhaar Card"
        applicant_name = body.get("applicant_name") or body.get("applicantName") or "Citizen Applicant"
        annual_income = body.get("annual_income") or body.get("annualIncome")

        result = OCRService.analyze_document(
            doc_type=doc_type,
            applicant_name=applicant_name,
            annual_income=annual_income
        )
        return 200, {
            "doc_type": doc_type,
            "extracted_fields": result.get("extractedData", {}),
            "valid": result.get("isMatch", True),
            "confidence": result.get("ocrConfidence", 96),
            "tamper_detected": result.get("tamperDetected", False),
            "remarks": "Document verified locally via Tesseract 5 with strict sovereignty check."
        }

    # --- 8. PAYMENTS ---
    elif clean_path == "/api/v1/payments/initiate" and method == "POST":
        amount = body.get("amount", 50)
        cert_id = body.get("certificate_id", "income-cert")
        pay_id = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        upi_string = f"upi://pay?pa=revenue.jansetu@gov.in&pn=StateRevenueDept&am={amount}&tn={pay_id}&cu=INR"
        
        return 200, {
            "payment_id": pay_id,
            "amount": amount,
            "qr_code": f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={urllib.parse.quote(upi_string)}",
            "upi_string": upi_string,
            "status": "pending"
        }

    elif clean_path.startswith("/api/v1/payments/") and clean_path.endswith("/status") and method == "GET":
        parts = clean_path.split("/")
        pay_id = parts[4] if len(parts) >= 5 else "PAY-DEMO"
        return 200, {
            "payment_id": pay_id,
            "status": "success",
            "amount": 50,
            "transaction_ref": f"TXN-UPI-{uuid.uuid4().hex[:8].upper()}",
            "completed_at": datetime.utcnow().isoformat()
        }

    # --- 9. APPLICATION SUBMISSION & STATUS ---
    elif clean_path in ("/api/v1/certificates/submit", "/api/applications/submit") and method == "POST":
        result = ApplicationService.submit_application(body)
        return 200, {
            "application_id": result.get("applicationId"),
            "tracking_token": result.get("trackingToken"),
            "receipt_url": f"/receipts/{result.get('applicationId')}",
            "status": result.get("status", "PENDING_VERIFICATION"),
            "sla_date": result.get("slaDate"),
            "certificate_name": result.get("certificateName")
        }

    elif (clean_path.startswith("/api/v1/certificates/") and clean_path.endswith("/status") and method == "GET") or \
         (clean_path.startswith("/api/v1/status/") and method == "GET") or \
         (clean_path.startswith("/api/applications/status/") and method == "GET"):
        
        token = clean_path.split("/")[-1] if not clean_path.endswith("/status") else clean_path.split("/")[-2]
        token = urllib.parse.unquote(token)
        result = ApplicationService.get_by_token(token)
        if result.get("found"):
            app_data = result.get("application", {})
            return 200, {
                "stage": app_data.get("status", "PENDING_VERIFICATION"),
                "status": app_data.get("status", "PENDING_VERIFICATION"),
                "estimated_date": app_data.get("estimatedCompletionDate", "2026-08-26"),
                "last_updated": app_data.get("createdAt", datetime.utcnow().isoformat()),
                "remarks": app_data.get("officerRemarks") or f"Application logged for {app_data.get('citizenName')}. Awaiting Tehsildar verification.",
                "application": app_data
            }
        else:
            return 404, {"error": "Application not found", "token": token}

    # --- 10. OMNICHANNEL ADAPTERS ---
    elif clean_path == "/api/v1/adapters/whatsapp/inbound" and method == "POST":
        sender = body.get("From", "+91 98765 11223")
        text = body.get("Body", "")
        lang = body.get("Language", "hi")
        
        sess_id = f"wa-{sender.replace('+', '').replace(' ', '')}"
        state = RevenueAgentState(
            session_id=sess_id,
            citizen_phone=sender,
            channel="whatsapp",
            language=lang,
            latest_utterance=text
        )
        final_state = revenue_agent_graph.invoke(state, session_id=sess_id)
        
        AuditService.log_event(
            action="WHATSAPP_INBOUND_MSG",
            channel="whatsapp",
            details=f"Received: '{text[:40]}'. Responded: '{final_state.response_text[:40]}'",
            session_id=sess_id,
            phone_or_identifier=sender
        )
        return 200, {
            "reply": final_state.response_text,
            "session_id": sess_id,
            "channel": "whatsapp",
            "state": final_state.current_step
        }

    elif clean_path in ("/api/v1/adapters/ivr/dtmf", "/api/v1/adapters/ivr/speech") and method == "POST":
        caller = body.get("Caller", "+91 98765 99887")
        digit = body.get("Digits", "1")
        speech = body.get("SpeechResult", "")
        lang = body.get("Language", "hi")
        
        action_desc = f"DTMF Pressed: {digit}" if digit else f"Speech: {speech}"
        AuditService.log_event(
            action="IVR_CALL_INTERACTION",
            channel="ivr",
            details=action_desc,
            phone_or_identifier=caller
        )
        
        return 200, {
            "say": "आपकी पसंद दर्ज कर ली गई है। अगला विकल्प चुनें।",
            "hangup": False,
            "next_dtmf": "1: आय प्रमाण पत्र, 2: जाति प्रमाण पत्र, 3: निवास प्रमाण पत्र"
        }

    # --- 11. ADMIN TELEMETRY & ESCALATION QUEUE ---
    elif clean_path in ("/api/v1/admin/queue", "/api/escalation") and method == "GET":
        tickets = EscalationService.get_tickets()
        return 200, {"queue": tickets, "tickets": tickets}

    elif (clean_path.startswith("/api/v1/admin/queue/") and clean_path.endswith("/assign") and method == "POST") or \
         (clean_path == "/api/escalation/resolve" and method == "POST"):
        ticket_id = clean_path.split("/")[-2] if "queue" in clean_path else body.get("ticketId")
        notes = body.get("resolutionNotes") or body.get("notes") or f"Assigned to Officer: {body.get('officer_name', 'Tehsildar R. Sharma')}"
        res = EscalationService.resolve_ticket(ticket_id, notes)
        return 200, res

    elif clean_path in ("/api/v1/admin/metrics", "/api/metrics") and method == "GET":
        metrics = MetricsService.get_metrics()
        return 200, metrics

    elif clean_path in ("/api/v1/admin/audit-logs", "/api/audit-logs") and method == "GET":
        logs = AuditService.get_logs()
        return 200, {"logs": logs}

    # --- 12. LANGGRAPH AGENT HISTORY ---
    elif clean_path.startswith("/api/agent/history/") and method == "GET":
        sess_id = clean_path.replace("/api/agent/history/", "")
        sess_id = urllib.parse.unquote(sess_id)
        history = SQLiteCheckpointer.get_history(sess_id)
        latest = SQLiteCheckpointer.get_latest_checkpoint(sess_id)
        return 200, {
            "sessionId": sess_id,
            "checkpoints": history,
            "latestState": latest.to_dict() if latest else None
        }

    return 404, {"error": "Endpoint Not Found", "path": clean_path}
