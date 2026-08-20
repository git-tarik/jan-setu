"""
Multilingual Response & Voice Synthesis Agent Node.
Generates conversational responses and audio hints tailored to the citizen's chosen language.
"""
from backend.workflow.state import RevenueAgentState

LANGUAGE_PROMPTS = {
    "hi": {
        "accepted": "आपकी जानकारी सफलतापूर्वक दर्ज कर ली गई है।",
        "invalid": "कृपया सही जानकारी प्रदान करें।",
        "doc_prompt": "कृपया पहचान प्रमाण दस्तावेज अपलोड करें।",
        "payment_prompt": "कृपया 50 रुपये का शुल्क भुगतान पूरा करें।"
    },
    "en": {
        "accepted": "Field captured and validated successfully.",
        "invalid": "Please provide a valid input.",
        "doc_prompt": "Please upload your identity proof document.",
        "payment_prompt": "Please complete the statutory application fee of ₹50."
    },
    "ta": {
        "accepted": "தகவல் வெற்றிகரமாக பதிவு செய்யப்பட்டது.",
        "invalid": "தயவுசெய்து சரியான விவரங்களை வழங்கவும்.",
        "doc_prompt": "அடையாள ஆவணத்தைப் பதிவேற்றவும்.",
        "payment_prompt": "கட்டணத்தை செலுத்தவும்."
    },
    "te": {
        "accepted": "వివరాలు విజయవంతంగా నమోదు చేయబడ్డాయి.",
        "invalid": "దయచేసి సరైన సమాచారాన్ని నమోదు చేయండి.",
        "doc_prompt": "దయచేసి గుర్తింపు పత్రాన్ని అప్‌లోడ్ చేయండి.",
        "payment_prompt": "దయచేసి రుసుము చెల్లించండి."
    }
}

def response_node(state: RevenueAgentState) -> RevenueAgentState:
    """Agent node that crafts localized response messages."""
    state.execution_trace.append("response_node:synthesizing")
    lang = state.language or "hi"
    prompts = LANGUAGE_PROMPTS.get(lang, LANGUAGE_PROMPTS["en"])

    if not state.validation_passed:
        err_msg = state.validation_errors[0] if state.validation_errors else prompts["invalid"]
        state.response_text = f"{prompts['invalid']} ({err_msg})"
    else:
        state.response_text = prompts["accepted"]

    # Append response to messages history
    state.messages.append({
        "role": "agent",
        "content": state.response_text,
        "channel": state.channel
    })

    return state
