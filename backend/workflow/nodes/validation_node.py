"""
Statutory Revenue Eligibility & Validation Agent Node.
Validates extracted field values against administrative rules and statutory revenue criteria.
"""
from backend.workflow.state import RevenueAgentState

def validation_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node that evaluates form constraints and field validity."""
    state.execution_trace.append("validation_node:checking")
    field_id = state.target_field_id
    val = str(state.extracted_value or "").strip()
    
    state.validation_passed = True
    state.validation_errors = []

    if field_id == "annualIncome":
        try:
            num = float(val)
            if num <= 0:
                state.validation_passed = False
                state.validation_errors.append("Annual income must be a positive number.")
            elif num > 50000000:
                state.validation_passed = False
                state.validation_errors.append("Annual income exceeds standard certificate limits.")
        except ValueError:
            # If not pure number, ensure it's captured
            if len(val) < 2:
                state.validation_passed = False
                state.validation_errors.append("Please specify a valid annual income amount.")

    elif field_id == "yearsOfResidence":
        try:
            yrs = int(val)
            if yrs < 0 or yrs > 120:
                state.validation_passed = False
                state.validation_errors.append("Years of residence must be between 0 and 120.")
        except ValueError:
            pass

    elif field_id in ("fullName", "fatherHusbandName"):
        if len(val) < 2:
            state.validation_passed = False
            state.validation_errors.append("Name must contain at least 2 characters.")

    if not state.validation_passed:
        state.retry_count += 1
    else:
        state.retry_count = 0

    return state
