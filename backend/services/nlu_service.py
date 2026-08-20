"""
NLU & Multilingual Voice Processing Service (Python).
Handles conversational extraction across Indic languages with Gemini API fallback and local deterministic entity parsers.
"""
import re
import json
import urllib.request
import urllib.error
from backend.config import GEMINI_API_KEY

class NLUService:
    @staticmethod
    def extract_field(utterance: str, current_field_id: str, certificate_id: str,
                      language: str = "en", captured_fields: dict = None) -> dict:
        """
        Extracts structured field values from spoken citizen utterances.
        Tries Gemini API via urllib first, then falls back to robust local Indic entity extractor.
        """
        if captured_fields is None:
            captured_fields = {}

        # 1. First run local rule-based extractor
        local_val = NLUService._local_extract_rules(utterance, current_field_id, language)
        extracted_value = local_val
        is_valid = True
        explanation = "Field captured accurately."

        # 2. If Gemini API Key is configured, attempt intelligent NLU
        if GEMINI_API_KEY and utterance and len(utterance.strip()) > 0:
            gemini_result = NLUService._call_gemini_nlu(
                utterance, current_field_id, certificate_id, language, captured_fields
            )
            if gemini_result:
                if gemini_result.get("extractedValue"):
                    extracted_value = gemini_result["extractedValue"]
                if "isValid" in gemini_result:
                    is_valid = gemini_result["isValid"]
                if gemini_result.get("acknowledgement"):
                    explanation = gemini_result["acknowledgement"]

        if not extracted_value:
            extracted_value = utterance

        return {
            "extractedValue": extracted_value,
            "isValid": is_valid,
            "explanation": explanation
        }

    @staticmethod
    def _local_extract_rules(utterance: str, field_id: str, language: str) -> str:
        """Deterministic multilingual rules for Indian Revenue Certificates."""
        raw = (utterance or "").strip()
        if not raw:
            return ""

        if field_id == "annualIncome":
            # Check for lakh / crore mentions in English & Indic scripts
            lakh_match = re.search(r"([\d\.]+)\s*(?:lakh|lac|लाख|லட்சம்|లక్ష|ലക്ഷം|লাখ|लाख)", raw, re.IGNORECASE)
            if lakh_match:
                try:
                    num = float(lakh_match.group(1))
                    return str(int(num * 100000))
                except ValueError:
                    pass

            thousand_match = re.search(r"([\d\.]+)\s*(?:thousand|k|हजार|ஆயிரம்|వేలు|ആയിരം|হাজার|हजार)", raw, re.IGNORECASE)
            if thousand_match:
                try:
                    num = float(thousand_match.group(1))
                    return str(int(num * 1000))
                except ValueError:
                    pass

            # Hindi word numerals
            if "एक लाख बीस हजार" in raw or "1 लाख 20 हजार" in raw:
                return "120000"
            if "एक लाख" in raw or "1 लाख" in raw:
                return "100000"
            if "बहत्तर हजार" in raw or "72 हजार" in raw or "72,000" in raw:
                return "72000"
            if "पचास हजार" in raw or "50 हजार" in raw or "50,000" in raw:
                return "50000"
            if "अस्सी हजार" in raw or "80 हजार" in raw or "80,000" in raw:
                return "80000"
            if "साठ हजार" in raw or "60 हजार" in raw or "60,000" in raw:
                return "60000"
            if "नब्बे हजार" in raw or "90 हजार" in raw or "90,000" in raw:
                return "90000"
            if "दो लाख" in raw or "2 लाख" in raw:
                return "200000"

            num_match = re.search(r"[\d,]+", raw)
            if num_match:
                return num_match.group(0).replace(",", "")

        elif field_id == "yearsOfResidence":
            num_match = re.search(r"\d+", raw)
            if num_match:
                return num_match.group(0)
            if "पंद्रह" in raw or "fifteen" in raw.lower():
                return "15"
            if "बीस" in raw or "twenty" in raw.lower():
                return "20"
            if "बाईस" in raw or "twenty two" in raw.lower():
                return "22"
            if "पच्चीस" in raw or "twenty five" in raw.lower():
                return "25"
            if "दस" in raw or "ten" in raw.lower():
                return "10"

        elif field_id in ("fullName", "fatherHusbandName"):
            cleaned = re.sub(
                r"^(मेरा नाम|नाम है|मैं|my name is|i am|name:|பெயர்|என் பெயர்|నా పేరు|പേര്|আমার নাম|माझे नाव)\s+",
                "",
                raw,
                flags=re.IGNORECASE
            )
            cleaned = re.sub(r"(है|होता है|says|speaking)$", "", cleaned, flags=re.IGNORECASE).strip()
            return cleaned or raw

        elif field_id in ("casteCategory", "subCaste"):
            if re.search(r"obc|अन्य पिछड़ा|ओबीसी", raw, re.IGNORECASE):
                return "OBC (Other Backward Class)"
            if re.search(r"sc|अनुसूचित जाति|एससी", raw, re.IGNORECASE):
                return "SC (Scheduled Caste)"
            if re.search(r"st|अनुसूचित जनजाति|एसटी", raw, re.IGNORECASE):
                return "ST (Scheduled Tribe)"
            if re.search(r"general|सामान्य", raw, re.IGNORECASE):
                return "General / Unreserved"
            if re.search(r"ews|ईडब्ल्यूएस", raw, re.IGNORECASE):
                return "EWS (Economically Weaker Section)"

        elif field_id == "occupation":
            if re.search(r"farmer|farming|कृषि|खेती|किसान", raw, re.IGNORECASE):
                return "Agriculture / Farming"
            if re.search(r"business|व्यापार|दुकान", raw, re.IGNORECASE):
                return "Self-Employed / Business"
            if re.search(r"service|job|नौकरी|कर्मचारी", raw, re.IGNORECASE):
                return "Salaried / Private Service"
            if re.search(r"labour|मजदूरी|दैनिक", raw, re.IGNORECASE):
                return "Daily Wage Labour"

        elif field_id in ("residentialAddress", "permanentAddress"):
            cleaned = re.sub(r"^(हमारा पता|पता है|address is|i live at)\s+", "", raw, flags=re.IGNORECASE).strip()
            return cleaned or raw

        elif field_id == "purpose":
            if re.search(r"scholarship|छात्रवृत्ति|पढ़ाई|education", raw, re.IGNORECASE):
                return "Scholarship / Education Support"
            if re.search(r"ration|राशन|खाद्य", raw, re.IGNORECASE):
                return "Ration Card / Food Subsidy"
            if re.search(r"job|employment|रोजगार", raw, re.IGNORECASE):
                return "Government Employment / Recruitment"
            if re.search(r"loan|ऋण|बैंक", raw, re.IGNORECASE):
                return "Bank Loan / Financial Assistance"

        return raw

    @staticmethod
    def _call_gemini_nlu(utterance: str, field_id: str, cert_id: str, lang: str, captured: dict) -> dict:
        """Direct REST call to Gemini with model fallback using standard Python urllib."""
        prompt = f"""You are a strict Multilingual Government Revenue Service NLU engine.
Target Certificate: {cert_id}
Target Field ID: {field_id}
User Spoken Utterance: "{utterance}"
User Language: {lang}
Currently Captured Fields: {json.dumps(captured)}

Task:
1. Extract the clean, normalized value for the target field '{field_id}' from the utterance.
   For example, if field is 'annualIncome' and user says "मेरी साल की कमाई एक लाख बीस हजार रुपये है", extract "120000".
   If field is 'fullName' and user says "मेरा नाम राधा देवी है", extract "Radha Devi".
   If field is 'yearsOfResidence' and user says "I have been living here for twenty years", extract "20".
2. Validate if the value is plausible.
3. Provide a brief encouraging response in the citizen's language ({lang}) acknowledging the answer.

Respond ONLY with valid JSON:
{{
  "extractedValue": "clean string value",
  "isValid": true,
  "acknowledgement": "Acknowledge in user language",
  "nextPromptHint": "Helpful prompt for next field in user language"
}}"""

        models = ["gemini-3.7-flash", "gemini-3.1-flash-lite"]
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json", "User-Agent": "aistudio-build"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=3.5) as response:
                    res_body = response.read().decode("utf-8")
                    data = json.loads(res_body)
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if content_text:
                            return json.loads(content_text)
            except Exception:
                continue
        return None
