"""Self-contained ContractAnalyzer used by server.py.

The original CCDM test framework (full system) is not bundled with this
prototype, so this module provides a deterministic, offline rules engine
with the same interface: ContractAnalyzer().analyze(text, doc_type) ->
{flags, risk_score, risk_level, ...}.

Flags use the same `field` keys as SOUTHLAKE_FLAG_MAP in server.py
(= FLAG_TO_HIROC in src/data.ts), so every flag maps to a
Southlake/HIROC client risk category downstream.
"""
import re

# (field, severity, likelihood, impact, keyword-or-None meaning "absent triggers flag")
ABSENT_RULES = [
    # field, severity, L, I, description shown in flag_if, required keyword regex
    ("signatories", "High", 4, 4,
     "No executed signature block found — agreement may not be in force",
     r"signature|signed by|executed by|authorized signat"),
    ("expiry_date", "Medium", 3, 3,
     "No expiry / term date detected", r"expir|terminat|term of|ends? on|through (?:december|31st|20\d{2})"),
    ("effective_date", "Low", 2, 2,
     "No effective date stated", r"effective date|effective as of|takes effect|commence"),
    ("binding_language", "Medium", 3, 3,
     "No binding / enforceability language found", r"binding|enforceab|shall be (?:deemed |considered )?binding|constitutes"),
    ("termination_clause", "High", 4, 4,
     "No termination clause found", r"terminat"),
    ("indemnity_clause", "Medium", 3, 4,
     "No indemnity / hold-harmless clause found", r"indemn|hold harmless|hold-harmless"),
    ("governing_law", "Medium", 3, 3,
     "Governing law / jurisdiction not specified", r"governing law|governed by|jurisdiction|courts of"),
    ("breach_notification", "High", 4, 4,
     "No breach notification obligation found", r"breach notification|notify.*(?:without (?:unreasonable )?delay|within \d+ (?:hours|days|business days))|in the event of (?:a |any) breach"),
    ("audit_rights", "Low", 2, 3,
     "No audit / inspection rights found", r"audit|inspec|right to (?:review|examine)|record access"),
    ("return_destruction", "Medium", 3, 4,
     "No return / destruction of data obligation found", r"destruction|destroy|return of .*(?:data|records|materials)|secure (?:deletion|disposal)"),
    ("security_standards", "Medium", 3, 4,
     "No security standard referenced (SOC 2 / ISO 27001 / HIPAA)", r"soc ?2|iso ?27001|hipaa|security (?:program|controls|safeguards)|cybersecurity"),
    ("phia_compliance", "High", 4, 5,
     "PHI/PHIPA handling mentioned but no explicit PHIPA compliance clause", r"phi|phipa|personal health|patient (?:data|information|records)"),
    ("purpose_limitation", "Medium", 3, 4,
     "No purpose limitation clause found", r"solely for|limited to (?:the |such )?purpos|purpose limitation|only (?:for|use)"),
    ("data_minimization", "Low", 2, 3,
     "No data minimization language found", r"minimi[sz]"),
]

# Presence triggers a flag (review needed), not absence
PRESENT_RULES = [
    ("auto_renewal", "Medium", 3, 3,
     "Auto-renewal clause present — review renewal terms before committing",
     r"auto[- ]renew"),
    ("duplicate_version", "High", 4, 3,
     "Possible duplicate / superseded version in circulation",
     r"duplicate|supersed|supersede|amendment no\.|version \d+|revised version|second (?:version|copy)"),
    ("indemnity_cap", "High", 3, 5,
     "Indemnity appears to be uncapped — unbounded liability exposure",
     r"indemn"),
    ("conflicting_finance", "Medium", 3, 4,
     "Financial terms may conflict — pricing and caps should be verified",
     r"(?:budget|cap|limit).*?:?\s*unlimited|unlimited (?:liability|indemnity)"),
    ("breach_timeline", "High", 4, 4,
     "Breach notification window not quantified — specify hours/days",
     r"breach notification"),
    ("ocr_quality", "Low", 1, 2,
     "Text extraction quality may be low (OCR) — verify against the signed original",
     r"(?:\?\?\?|\ufffd{2,})"),
]

# Which rules apply per document type (None = all)
TYPE_SCOPE = {
    "NDA": None,
    "CDA": None,
    "MOU": ["signatories", "expiry_date", "effective_date", "binding_language",
            "termination_clause", "governing_law", "duplicate_version", "conflicting_finance"],
    "Procurement": None,
    "Data_Sharing": None,
    "Clinical_Trial": None,
    "Other": ["signatories", "expiry_date", "governing_law", "termination_clause"],
}


def _band(score: int) -> str:
    if score >= 20:
        return "Critical"
    if score >= 12:
        return "High"
    if score >= 6:
        return "Medium"
    return "Low"


class ContractAnalyzer:
    """Deterministic offline rules engine. No network, no external modules."""

    def analyze(self, text: str, doc_type: str = "Procurement") -> dict:
        t = text or ""
        scope = TYPE_SCOPE.get(doc_type, None)
        flags = []

        for field, sev, lik, imp, msg, rx in ABSENT_RULES:
            if scope and field not in scope:
                continue
            if not re.search(rx, t, re.IGNORECASE):
                flags.append({
                    "field": field, "severity": sev,
                    "flag_if": msg, "likelihood": lik, "impact": imp,
                })

        for field, sev, lik, imp, msg, rx in PRESENT_RULES:
            if scope and field not in scope:
                continue
            if field == "indemnity_cap":
                # uncapped indemnity: indemnity present, no cap expression nearby
                if re.search(r"indemn", t, re.IGNORECASE) and not re.search(r"cap(?:ped)? (?:at|liability)|liability cap|limit(?:ed)? (?:to )?\$\d", t, re.IGNORECASE):
                    flags.append({"field": field, "severity": sev, "flag_if": msg,
                                  "likelihood": lik, "impact": imp})
            elif field == "breach_timeline":
                # breach notification mentioned but no quantified window
                if re.search(rx, t, re.IGNORECASE) and not re.search(r"breach notification[^.\n]{0,100}?\bwithin \d+", t, re.IGNORECASE):
                    flags.append({"field": field, "severity": sev, "flag_if": msg,
                                  "likelihood": lik, "impact": imp})
            elif re.search(rx, t, re.IGNORECASE):
                flags.append({"field": field, "severity": sev, "flag_if": msg,
                              "likelihood": lik, "impact": imp})

        # PHI present but PHIPA explicitly absent → escalate
        if re.search(r"\bphi\b|personal health|patient (?:data|information)", t, re.IGNORECASE) \
           and not re.search(r"phipa", t, re.IGNORECASE) \
           and ("phia_compliance" not in [f["field"] for f in flags]):
            flags.append({"field": "phia_compliance", "severity": "High",
                          "flag_if": "PHI is referenced but no PHIPA compliance clause found",
                          "likelihood": 4, "impact": 5})

        # Very short / empty text → extraction quality flag
        if len(t.strip()) < 300:
            flags.append({"field": "missing_fields", "severity": "Medium",
                          "flag_if": "Document text too short to extract key fields — verify extraction",
                          "likelihood": 3, "impact": 3})

        score = max([f["likelihood"] * f["impact"] for f in flags], default=0)
        # cap: no flags → low
        level = _band(score) if flags else "Low"
        return {
            "document_type": doc_type,
            "flags": flags,
            "flags_count": len(flags),
            "risk_score": score,
            "risk_level": level,
            "engine": "rules",
        }
