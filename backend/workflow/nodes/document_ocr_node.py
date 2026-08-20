"""
Document & In-Memory OCR Verification Agent Node.
Cross-references uploaded proof documents against spoken form attributes.
"""
from backend.workflow.state import RevenueAgentState
from backend.services.ocr_service import OCRService

def document_ocr_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node that performs OCR validation on uploaded documents."""
    state.execution_trace.append("document_ocr_node:analyzing")
    
    applicant_name = state.captured_fields.get("fullName", "Citizen Applicant")
    income_val = state.captured_fields.get("annualIncome")
    
    ocr_res = OCRService.analyze_document(
        doc_type=state.certificate_id,
        applicant_name=applicant_name,
        annual_income=income_val
    )

    state.ocr_status = "PASSED" if ocr_res.get("isMatch") else "FAILED"
    state.ocr_confidence = ocr_res.get("ocrConfidence", 95)
    state.document_data = ocr_res.get("extractedData", {})

    return state
