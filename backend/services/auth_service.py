"""
Authentication & Authorization Service (Python).
Handles Citizen and Officer/Admin registration, login, password hashing, and session management.
"""
import hashlib
import os
import uuid
from datetime import datetime
from backend.database import get_connection
from backend.services.audit_service import AuditService

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    hashed, _ = hash_password(password, salt)
    return hashed == stored_hash

class AuthService:
    @staticmethod
    def signup(data: dict) -> dict:
        """
        Registers a new user (Citizen or Admin/Officer).
        """
        role = data.get("role", "citizen").lower()
        if role not in ("citizen", "admin"):
            role = "citizen"

        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        phone = str(data.get("phone", "")).strip()
        password = str(data.get("password", "")).strip()
        department = str(data.get("department", "Citizen Services")).strip() if role == "admin" else None
        designation = str(data.get("designation", "Verification Officer")).strip() if role == "admin" else None
        officer_id = str(data.get("officer_id", f"OFF-REV-{uuid.uuid4().hex[:6].upper()}")).strip() if role == "admin" else None

        if not name:
            return {"success": False, "error": "Full Name is required."}
        if not email:
            return {"success": False, "error": "Valid Email address is required."}
        if not password or len(password) < 4:
            return {"success": False, "error": "Password must be at least 4 characters."}

        conn = get_connection()
        cursor = conn.cursor()

        # Check existing email
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        if cursor.fetchone():
            conn.close()
            return {"success": False, "error": f"An account with email '{email}' already exists."}

        user_id = f"user-{role}-{uuid.uuid4().hex[:8]}"
        hashed_pwd, salt = hash_password(password)
        created_at = datetime.utcnow().isoformat()

        cursor.execute("""
        INSERT INTO users (
            id, role, name, email, phone, password_hash, salt, department, designation, officer_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, role, name, email, phone, hashed_pwd, salt, department, designation, officer_id, created_at
        ))
        conn.commit()
        conn.close()

        # Log security audit
        AuditService.log_event(
            action=f"USER_SIGNUP_{role.upper()}",
            channel="web",
            details=f"New {role} account registered: {email} ({name}).",
            phone_or_identifier=phone or email
        )

        user_record = {
            "id": user_id,
            "role": role,
            "name": name,
            "email": email,
            "phone": phone,
            "department": department,
            "designation": designation,
            "officer_id": officer_id,
            "created_at": created_at
        }

        token = f"jwt_jansetu_{role}_{uuid.uuid4().hex}"
        return {
            "success": True,
            "token": token,
            "user": user_record,
            "message": f"Successfully registered as {role.capitalize()}."
        }

    @staticmethod
    def login(credentials: dict) -> dict:
        """
        Authenticates citizen or admin credentials.
        """
        identifier = str(credentials.get("email") or credentials.get("username") or credentials.get("phone", "")).strip().lower()
        password = str(credentials.get("password", "")).strip()
        expected_role = str(credentials.get("role", "")).strip().lower()

        if not identifier or not password:
            return {"success": False, "error": "Email/Phone and Password are required."}

        conn = get_connection()
        cursor = conn.cursor()

        # Look up by email or phone
        cursor.execute("""
        SELECT * FROM users 
        WHERE (LOWER(email) = LOWER(?) OR phone = ?)
        """, (identifier, identifier))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return {"success": False, "error": "Invalid email/phone or password."}

        stored_hash = row["password_hash"]
        salt = row["salt"]
        user_role = row["role"]

        if expected_role and expected_role != user_role:
            return {
                "success": False, 
                "error": f"Account role mismatch. This account is registered as '{user_role.capitalize()}'. Please select the {user_role.capitalize()} tab to log in."
            }

        if not verify_password(password, stored_hash, salt):
            return {"success": False, "error": "Invalid password. Please try again."}

        user_record = {
            "id": row["id"],
            "role": row["role"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "department": row["department"],
            "designation": row["designation"],
            "officer_id": row["officer_id"],
            "created_at": row["created_at"]
        }

        token = f"jwt_jansetu_{user_role}_{uuid.uuid4().hex}"

        AuditService.log_event(
            action=f"USER_LOGIN_{user_role.upper()}",
            channel="web",
            details=f"Successful login for {row['email']} ({row['name']}) with role '{user_role}'.",
            phone_or_identifier=row['phone'] or row['email']
        )

        return {
            "success": True,
            "token": token,
            "user": user_record,
            "message": f"Welcome back, {row['name']}!"
        }

    @staticmethod
    def get_user_by_id(user_id: str) -> dict:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return {
            "id": row["id"],
            "role": row["role"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "department": row["department"],
            "designation": row["designation"],
            "officer_id": row["officer_id"],
            "created_at": row["created_at"]
        }
