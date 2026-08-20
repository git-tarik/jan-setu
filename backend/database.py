"""
Database Persistence Layer (Python / SQLite).
Thread-safe local storage for users, applications, audit trail, escalations, and metrics.
"""
import sqlite3
import os
import json
import hashlib
from datetime import datetime, timedelta
from backend.config import DB_PATH

def _hash_demo_pwd(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Users Table (Citizen & Admin/Officer)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        department TEXT,
        designation TEXT,
        officer_id TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 2. Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        application_number TEXT UNIQUE NOT NULL,
        tracking_token TEXT UNIQUE NOT NULL,
        certificate_id TEXT NOT NULL,
        certificate_name TEXT NOT NULL,
        citizen_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        user_id TEXT,
        language TEXT NOT NULL,
        channel TEXT NOT NULL,
        form_data_json TEXT NOT NULL,
        document_uploaded INTEGER DEFAULT 1,
        document_name TEXT,
        ocr_confidence INTEGER DEFAULT 95,
        payment_status TEXT DEFAULT 'SUCCESS',
        payment_ref TEXT,
        amount REAL DEFAULT 50.0,
        status TEXT DEFAULT 'PENDING_VERIFICATION',
        verification_status TEXT DEFAULT 'PENDING_VERIFICATION',
        verified_by TEXT,
        verified_by_id TEXT,
        verified_at TEXT,
        officer_remarks TEXT,
        rejection_reason TEXT,
        certificate_number TEXT,
        digital_signature_hash TEXT,
        created_at TEXT NOT NULL,
        estimated_completion_date TEXT NOT NULL
    )
    """)

    # Ensure all columns exist on applications table (for backward-compatible migration)
    cursor.execute("PRAGMA table_info(applications)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    cols_to_add = [
        ("user_id", "TEXT"),
        ("verification_status", "TEXT DEFAULT 'PENDING_VERIFICATION'"),
        ("verified_by", "TEXT"),
        ("verified_by_id", "TEXT"),
        ("verified_at", "TEXT"),
        ("officer_remarks", "TEXT"),
        ("rejection_reason", "TEXT"),
        ("certificate_number", "TEXT"),
        ("digital_signature_hash", "TEXT"),
    ]
    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                pass

    # 3. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        session_id TEXT NOT NULL,
        citizen_hash TEXT NOT NULL,
        action TEXT NOT NULL,
        channel TEXT NOT NULL,
        data_classification TEXT NOT NULL,
        external_call_attempted INTEGER DEFAULT 0,
        external_call_blocked INTEGER DEFAULT 0,
        pii_detected INTEGER DEFAULT 0,
        state_before TEXT,
        state_after TEXT,
        details TEXT NOT NULL
    )
    """)

    # 4. Escalations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS escalation_tickets (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        citizen_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        certificate_name TEXT NOT NULL,
        channel TEXT NOT NULL,
        language TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        priority TEXT DEFAULT 'MEDIUM',
        assigned_officer TEXT,
        created_at TEXT NOT NULL,
        notes TEXT
    )
    """)

    # --- SEED DEFAULT USERS ---
    # Passwords match the demo hints shown in AuthPage.tsx:
    #   Citizen:  radha@citizen.in       / demo1234
    #   Admin:    officer@revenue.gov.in / admin1234
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        salt_citizen = "a1b2c3d4e5f60718"
        pwd_hash_citizen = _hash_demo_pwd("demo1234", salt_citizen)
        
        salt_admin = "f8e7d6c5b4a39281"
        pwd_hash_admin = _hash_demo_pwd("admin1234", salt_admin)

        demo_users = [
            (
                "user-citizen-01",
                "citizen",
                "Radha Devi",
                "radha@citizen.in",
                "+91 98765 43210",
                pwd_hash_citizen,
                salt_citizen,
                None,
                None,
                None,
                datetime.utcnow().isoformat()
            ),
            (
                "user-admin-01",
                "admin",
                "Shri Rajesh Kumar Sharma",
                "officer@revenue.gov.in",
                "+91 91234 56789",
                pwd_hash_admin,
                salt_admin,
                "Department of Revenue & Land Records",
                "Sub-Divisional Magistrate & Verification Officer",
                "OFF-UP-2024-SDM-8891",
                datetime.utcnow().isoformat()
            )
        ]
        cursor.executemany("""
        INSERT INTO users (
            id, role, name, email, phone, password_hash, salt, department, designation, officer_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_users)

    # --- SEED APPLICATIONS ---
    cursor.execute("SELECT COUNT(*) FROM applications")
    if cursor.fetchone()[0] == 0:
        seed_applications = [
            (
                "APP-2024-99182",
                "REV-2024-UP-0099182",
                "TRK-INC-99182",
                "income-cert",
                "Income Certificate",
                "Radha Devi",
                "+91 98765 43210",
                "user-citizen-01",
                "hi",
                "ivr",
                json.dumps({
                    "fullName": "Radha Devi",
                    "annualIncome": "72000",
                    "occupation": "Agriculture / Small Farming",
                    "residentialAddress": "Village Rampur, Post Kheri, Sadar, Varanasi",
                    "purpose": "State Scholarship / Education Fee Waiver"
                }),
                1,
                "Aadhaar_Scan_RadhaDevi.jpg",
                96,
                "SUCCESS",
                "UPI/2024/99182/OKAXIS",
                50.0,
                "PENDING_VERIFICATION",
                "PENDING_VERIFICATION",
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                (datetime.utcnow() - timedelta(hours=3)).isoformat(),
                (datetime.utcnow() + timedelta(days=7)).strftime("%d/%m/%Y")
            ),
            (
                "APP-2024-44129",
                "REV-2024-UP-0044129",
                "TRK-CAS-44129",
                "caste-cert",
                "Caste Certificate",
                "Muthu Krishnan",
                "+91 98401 77334",
                None,
                "ta",
                "whatsapp",
                json.dumps({
                    "fullName": "Muthu Krishnan",
                    "casteCategory": "OBC",
                    "fatherHusbandName": "Krishnan Swamy",
                    "subCaste": "Thevar",
                    "address": "45 Temple Road, Madurai"
                }),
                1,
                "Panchayat_Verification_Doc.pdf",
                91,
                "SUCCESS",
                "UPI/2024/44129/OKSBI",
                50.0,
                "PENDING_VERIFICATION",
                "PENDING_VERIFICATION",
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                (datetime.utcnow() + timedelta(days=10)).strftime("%d/%m/%Y")
            ),
            (
                "APP-2024-77301",
                "REV-2024-UP-0077301",
                "TRK-DOM-77301",
                "domicile-cert",
                "Domicile / Residence Certificate",
                "Amitabh Sen",
                "+91 94330 12890",
                None,
                "bn",
                "web",
                json.dumps({
                    "fullName": "Amitabh Sen",
                    "yearsOfResidence": "18",
                    "district": "Lucknow",
                    "address": "Sector 4, Vikas Nagar, Lucknow"
                }),
                1,
                "Electricity_Bill_Sen.pdf",
                98,
                "SUCCESS",
                "UPI/2024/77301/PAYTM",
                50.0,
                "APPROVED_AND_ISSUED",
                "APPROVED",
                "Shri Rajesh Kumar Sharma",
                "OFF-UP-2024-SDM-8891",
                (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "Verified against municipal electricity registry. All eligibility criteria satisfied.",
                None,
                "CERT-UP-2024-DOM-98214",
                "9e8a7c6b5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a",
                (datetime.utcnow() - timedelta(days=2)).isoformat(),
                (datetime.utcnow() + timedelta(days=3)).strftime("%d/%m/%Y")
            ),
            (
                "APP-2024-88219",
                "REV-2024-UP-0088219",
                "TRK-BRT-88219",
                "birth-cert",
                "Birth Registration Certificate",
                "Radha Devi",
                "+91 98765 43210",
                "user-citizen-01",
                "hi",
                "web",
                json.dumps({
                    "childName": "Aarav Sharma",
                    "dateOfBirth": "12/04/2024",
                    "motherName": "Radha Devi",
                    "fatherName": "Sunil Sharma",
                    "hospital": "District Women Hospital, Varanasi"
                }),
                1,
                "Hospital_Discharge_Summary.pdf",
                97,
                "SUCCESS",
                "UPI/2024/88219/GPAY",
                20.0,
                "APPROVED_AND_ISSUED",
                "APPROVED",
                "Shri Rajesh Kumar Sharma",
                "OFF-UP-2024-SDM-8891",
                (datetime.utcnow() - timedelta(days=1, hours=4)).isoformat(),
                "Institutional birth verified with Hospital Vital Registry database.",
                None,
                "CERT-UP-2024-BRT-11409",
                "4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b",
                (datetime.utcnow() - timedelta(days=2)).isoformat(),
                (datetime.utcnow() + timedelta(days=1)).strftime("%d/%m/%Y")
            )
        ]
        cursor.executemany("""
        INSERT INTO applications (
            id, application_number, tracking_token, certificate_id, certificate_name,
            citizen_name, phone, user_id, language, channel, form_data_json, document_uploaded,
            document_name, ocr_confidence, payment_status, payment_ref, amount, status,
            verification_status, verified_by, verified_by_id, verified_at, officer_remarks,
            rejection_reason, certificate_number, digital_signature_hash, created_at, estimated_completion_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_applications)

    # --- SEED ESCALATIONS ---
    cursor.execute("SELECT COUNT(*) FROM escalation_tickets")
    if cursor.fetchone()[0] == 0:
        seed_escalations = [
            (
                "ESC-2024-001",
                "APP-2024-99182",
                "Radha Devi",
                "+91 98765 43210",
                "Income Certificate",
                "ivr",
                "hi",
                "OCR mismatch: Spoken annual income (₹60,000) differs from Patwari land tax slab. Manual officer scrutiny requested.",
                "PENDING",
                "HIGH",
                None,
                datetime.utcnow().isoformat(),
                "Applicant resides in Flood Relief Zone. Verify with Tehsil Circle Officer 2."
            ),
            (
                "ESC-2024-002",
                "APP-2024-44129",
                "Muthu Krishnan",
                "+91 98401 77334",
                "Caste Certificate (OBC)",
                "whatsapp",
                "ta",
                "Ancestral document scan had low contrast (<65% OCR confidence).",
                "ASSIGNED",
                "MEDIUM",
                "Shri Rajesh Kumar Sharma",
                datetime.utcnow().isoformat(),
                "Officer contacted citizen via SMS to present physical 1978 land record at Block office."
            )
        ]
        cursor.executemany("""
        INSERT INTO escalation_tickets (
            id, application_id, citizen_name, phone, certificate_name, channel,
            language, reason, status, priority, assigned_officer, created_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_escalations)

    # --- SEED AUDIT LOGS ---
    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    if cursor.fetchone()[0] == 0:
        seed_logs = [
            (
                "log-001",
                datetime.utcnow().isoformat(),
                "sess-init-89a1",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "SESSION_INITIALIZED",
                "web",
                "RESTRICTED_LOCAL",
                0,
                0,
                0,
                "IDLE",
                "LANG_SELECT",
                "Citizen connected via Web Portal HTTPS. Language selected: Hindi (hi). Local session token minted."
            ),
            (
                "log-002",
                datetime.utcnow().isoformat(),
                "sess-init-89a1",
                "f4b1c24298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b992",
                "VOICE_CONSENT_CAPTURED",
                "web",
                "RESTRICTED_LOCAL",
                0,
                0,
                0,
                "AUTH_OTP",
                "CONSENT",
                "Verbal consent utterance recorded. Audio hash stored in local SQLite volume."
            ),
            (
                "log-003",
                datetime.utcnow().isoformat(),
                "sess-admin-01",
                "99a1c24298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c004",
                "OFFICER_VERIFICATION_APPROVED",
                "web",
                "STATUTORY_RECORD",
                0,
                0,
                0,
                "PENDING_VERIFICATION",
                "APPROVED_AND_ISSUED",
                "Officer Shri Rajesh Kumar Sharma verified & approved Domicile Certificate for Amitabh Sen."
            )
        ]
        cursor.executemany("""
        INSERT INTO audit_logs (
            id, timestamp, session_id, citizen_hash, action, channel,
            data_classification, external_call_attempted, external_call_blocked,
            pii_detected, state_before, state_after, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_logs)

    conn.commit()
    conn.close()

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
