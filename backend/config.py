"""
Configuration Module for Voice-First Revenue Services Backend (Python).
Manages runtime configuration, environment variables, and defaults.
"""
import os

PORT = int(os.environ.get("PYTHON_BACKEND_PORT", 5050))
HOST = os.environ.get("PYTHON_BACKEND_HOST", "127.0.0.1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "revenue_services.db")

# Supported Indic Languages
SUPPORTED_LANGUAGES = ["hi", "en", "ta", "te", "ml", "bn", "mr", "ur"]

# Default SLA targets (in days)
DEFAULT_SLA_DAYS = {
    "income-cert": 7,
    "domicile-cert": 5,
    "caste-cert": 10,
    "birth-cert": 3,
    "death-cert": 3,
    "land-mutation": 14,
    "agriculture-subsidy": 7,
    "disability-cert": 10,
}
