"""
OCR & Document Verification Service (Python).
Simulates in-memory Tesseract 5 / OpenCV grayscale OCR validation with zero cloud egress.
"""
import random

class OCRService:
    @staticmethod
    def analyze_document(doc_type: str, applicant_name: str, annual_income: str = None) -> dict:
        """Analyzes scanned documents locally in container memory."""
        confidence = random.randint(93, 98)
        is_income = "income" in (doc_type or "").lower()
        
        extracted = {
            "documentType": "Salary Certificate / Patwari Land Report" if is_income else "Aadhaar Identity Card",
            "detectedName": applicant_name or "Radha Devi",
            "detectedNumber": "XXXX-XXXX-8912",
            "issuer": "Government of India / Revenue Authority",
            "addressMatch": "VERIFIED (Block Sadar, District Varanasi)",
            "incomeReported": f"INR {annual_income}" if annual_income else "INR 72,000 / annum",
            "confidenceScore": f"{confidence}%",
            "securityHologramDetected": True,
            "tamperCheck": "PASSED (0 anomalies detected)",
        }

        return {
            "status": "SUCCESS",
            "ocrConfidence": confidence,
            "extractedData": extracted,
            "isMatch": True,
            "recommendation": "AUTOMATIC_APPROVAL_ELIGIBLE",
        }
