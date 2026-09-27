# AI Prototype 测试脚本 v5
## Test Framework for Contract Risk Assessment — Synthetic Contracts v2 (Fixed)

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# ============================================================================
# 配置
# ============================================================================

RISK_THRESHOLDS = {"critical": 4.0, "high": 3.0, "medium": 2.0, "low": 1.0}
SEVERITY_SCORES = {"Critical": 5, "High": 4, "Medium": 3, "Low": 2}
ALERT_THRESHOLDS = {"renewal_days": 90, "expiry_days": 30, "breach_hours": 72}

WORD_NUM = {
    "zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,
    "ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,
    "seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,"thirty":30,"forty":40,"fourty":40,
    "fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90,
}

def _word_num(w): return WORD_NUM.get(w.lower(), None)

MONTH_NAMES = ["january","february","march","april","may","june",
               "july","august","september","october","november","december"]

def _try_parse_date_str(s: str) -> Optional[datetime]:
    s = s.strip().replace(",", "")
    for fmt in ["%B %d %Y", "%B %Y", "%m/%d/%Y", "%d-%m-%Y"]:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None

def extract_effective_date(text: str) -> Optional[datetime]:
    patterns = [
        r"(?:effective|commencement|start)[^\d]*((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4})",
        r"((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4})",
        r"(?:effective|commencement)[^\d]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"entered\s+into\s+as\s+of\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m and m.lastindex:
            d = _try_parse_date_str(m.group(1))
            if d:
                return d
    return None

def extract_expiry_date(text: str, effective: Optional[datetime] = None) -> Optional[datetime]:
    # Priority 1: "expiring on <date>" / "expire on <date>"
    p1 = re.search(r"expir\w*\s+on\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4})", text, re.IGNORECASE)
    if p1:
        d = _try_parse_date_str(p1.group(1))
        if d:
            return d
    # Priority 2: "to <date>" or "until <date>"
    p2 = re.search(r"\b(?:to|until)\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4})", text, re.IGNORECASE)
    if p2:
        d = _try_parse_date_str(p2.group(1))
        if d:
            return d
    # Priority 3: duration from effective date
    if effective:
        term = re.search(r"(?:period\s+of\s+)?(\d+)\s+(year|month)s?\b", text, re.IGNORECASE)
        if term:
            val = int(term.group(1))
            unit = term.group(2).lower()
            if "year" in unit:
                try:
                    return effective.replace(year=effective.year + val)
                except ValueError:
                    return effective.replace(year=effective.year + val, day=28)
            else:
                total_m = effective.month + val * 12
                ny = effective.year + (total_m - 1) // 12
                nm = ((total_m - 1) % 12) + 1
                try:
                    return effective.replace(year=ny, month=nm)
                except ValueError:
                    return effective.replace(year=ny, month=nm, day=28)
        # Spelled-out number: "five (5) years from"
        m = re.search(r"(\w+)\s+\(\s*\d+\s*\)\s+(years?|months?)", text, re.IGNORECASE)
        if m:
            wn = _word_num(m.group(1))
            if wn:
                val, unit = wn, m.group(2).lower()
                total_m = effective.month + val * (12 if "year" in unit else 1)
                ny = effective.year + (total_m - 1) // 12
                nm = ((total_m - 1) % 12) + 1
                try:
                    return effective.replace(year=ny, month=nm)
                except ValueError:
                    return effective.replace(year=ny, month=nm, day=28)
    return None


class ContractAnalyzer:
    def __init__(self):
        self.flags = []
        self.fields = {}

    def analyze(self, text: str, doc_type: str) -> Dict:
        self.flags = []
        self.fields = self._extract(text, doc_type)
        self._universal(text)
        checker = {"NDA": self._nda, "MOU": self._mou,
                    "Procurement": self._procurement, "Data_Sharing": self._dsa}.get(doc_type)
        if checker:
            checker(text)
        self._duplicate_check(text)
        self._ocr_check(text)
        score = self._risk_score()
        return {"extracted_fields": self.fields, "flags": self.flags,
                "risk_score": score, "risk_level": self._risk_level(score)}

    def _extract(self, text: str, doc_type: str) -> Dict:
        eff = extract_effective_date(text)
        exp = extract_expiry_date(text, eff)
        return {
            "document_type": doc_type,
            "parties": self._parties(text),
            "effective_date": eff,
            "expiry_date": exp,
            "signatories": self._sigs(text),
            "vp_count": self._vp_count(text),
            "has_phipa": bool(re.search(r"phipa", text, re.I)),
            "has_indemnity": bool(re.search(r"indemnif", text, re.I)),
            "has_sla": bool(re.search(r"service\s*level|sla\b", text, re.I)),
            "has_breach_notif": bool(re.search(r"notif.*breach|breach.*notif|notify.*breach|\d+\s*(?:hours?|days?)\s+of\s+becom|becom.*\d+\s*(?:hours?|days?)|within\s+\d+\s*(?:hours?|days?)", text, re.I)),
            "has_termination": bool(re.search(r"terminat", text, re.I)),
            "has_renewal": bool(re.search(r"renew|auto[- ]?renew", text, re.I)),
            "has_data_sec": bool(re.search(r"data\s*security|encryption|security\s*safeguard", text, re.I)),
            "has_audit": bool(re.search(r"audit", text, re.I)),
            "has_purpose_limit": bool(re.search(r"solely\s+for|limited\s+to|specific\s+purpose", text, re.I)),
            "has_fin_cap": bool(re.search(r"up\s+to\s+\$|\$\d+[,.]?\d*\s*(?:annually?|annual|year)", text, re.I)),
            "has_conf_def": bool(re.search(r"confidential\s+information.*means|definition.*confidential", text, re.I)),
            "has_return_dest": bool(re.search(r"return.*destroy|destroy.*return|certification.*destruction", text, re.I)),
            "has_binding": bool(re.search(r"legally\s+binding|binding\s+obligation", text, re.I)),
            "has_non_binding": bool(re.search(r"non[- ]?binding|not\s+intended\s+to\s+create", text, re.I)),
            "ocr_quality": self._ocr(text),
        }

    def _universal(self, text: str):
        vp = self.fields["vp_count"]
        if vp < 2:
            self.flags.append({"field":"signatories","check":"至少两个VP签字",
                "flag_if":f"只有{vp}个VP签字","risk_category":"Financial","severity":"Critical"})
        if not self.fields["effective_date"]:
            self.flags.append({"field":"effective_date","check":"合同有生效日期",
                "flag_if":"缺少生效日期","risk_category":"Operational","severity":"High"})
        if not self.fields["expiry_date"]:
            self.flags.append({"field":"expiry_date","check":"合同有到期日期",
                "flag_if":"缺少到期日期","risk_category":"Operational","severity":"Medium"})
        elif self.fields["expiry_date"]:
            days = (self.fields["expiry_date"] - datetime.now()).days
            if days < 0:
                self.flags.append({"field":"expiry_date","check":"合同未过期",
                    "flag_if":f"合同已过期{abs(days)}天","risk_category":"Operational","severity":"High"})
            elif days <= ALERT_THRESHOLDS["renewal_days"]:
                self.flags.append({"field":"expiry_date","check":"续约提醒",
                    "flag_if":f"合同将在{days}天内到期","risk_category":"Operational","severity":"Medium"})

    def _nda(self, text: str):
        if not self.fields["has_phipa"]:
            if any(k in text.lower() for k in ["patient","health information","phi","personal health"]):
                self.flags.append({"field":"phia_compliance","check":"包含PHIPA合规条款",
                    "flag_if":"涉及健康信息但无PHIPA声明","risk_category":"Reputational","severity":"Critical"})
        if not self.fields["has_breach_notif"]:
            self.flags.append({"field":"breach_notification","check":"有数据泄露通知条款",
                "flag_if":"缺少泄露通知要求","risk_category":"Reputational","severity":"High"})
        if not self.fields["has_return_dest"]:
            self.flags.append({"field":"return_destruction","check":"有信息归还/销毁条款",
                "flag_if":"缺少归还或销毁条款","risk_category":"Operational","severity":"Medium"})
        if not self.fields["has_conf_def"]:
            self.flags.append({"field":"confidential_scope","check":"明确定义保密信息范围",
                "flag_if":"保密范围过于宽泛或无明确定义","risk_category":"Operational","severity":"Medium"})

    def _mou(self, text: str):
        if self.fields["has_binding"] and self.fields["has_non_binding"]:
            self.flags.append({"field":"binding_language","check":"明确binding状态",
                "flag_if":"同时存在binding和non-binding表述","risk_category":"Financial","severity":"High"})
        if not self.fields["has_termination"]:
            self.flags.append({"field":"termination_clause","check":"有终止条款",
                "flag_if":"缺少终止条款","risk_category":"Operational","severity":"Medium"})
        tm = re.search(r"terminate.*?(\d+)[\s)]+days", text, re.I)
        if tm and int(tm.group(1)) > 90:
            self.flags.append({"field":"termination_notice","check":"终止通知期合理",
                "flag_if":f"终止通知期{tm.group(1)}天过长","risk_category":"Operational","severity":"Medium"})

    def _procurement(self, text: str):
        if not self.fields["has_indemnity"]:
            self.flags.append({"field":"indemnity_clause","check":"有赔偿条款",
                "flag_if":"缺少indemnity条款","risk_category":"Financial","severity":"High"})
        else:
            has_cap = bool(re.search(r"(?:capped\s+at|cap\s+of\s+\$|maximum\s+liability|not\s+to\s+exceed|\$\d+[,.]?\d*\s+(?:cap|limit|ceiling))", text, re.I))
            no_cap = bool(re.search(r"not\s+subject\s+to\s+(?:a\s+)?monetary\s+cap", text, re.I))
            if not has_cap or no_cap:
                self.flags.append({"field":"indemnity_cap","check":"indemnity有金额上限",
                    "flag_if":"indemnity条款无金额上限","risk_category":"Financial","severity":"High"})
        is_svc = any(k in text.lower() for k in ["service","support","software","licensing","ehr"])
        if is_svc and not self.fields["has_sla"]:
            self.flags.append({"field":"sla_present","check":"有SLA",
                "flag_if":"服务类合同缺少SLA","risk_category":"Operational","severity":"High"})
        has_data_ctx = any(k in text.lower() for k in ["data", "patient", "phi", "personal health", "health information", "health record", "ehr"])
        if has_data_ctx and not self.fields["has_data_sec"]:
            self.flags.append({"field":"data_security","check":"有数据安全条款",
                "flag_if":"涉及数据的合同无数据保护条款","risk_category":"Reputational","severity":"Critical"})
        inc = re.search(r"(?:increase|increment|adjust).*?\d+\s*%|5\s*%.*?increase|auto[- ]?increase", text, re.I)
        if inc and not re.search(r"cap|not\s+to\s+exceed|maximum|ceiling", text, re.I):
            self.flags.append({"field":"payment_terms","check":"付款条款明确",
                "flag_if":"可变价格有自动递增但无上限","risk_category":"Financial","severity":"Medium"})
        tc = re.search(r"terminate\s+for\s+convenience.*?(\d+|\w+)\s*\(?,(\d+)\s*\)?\s*days", text, re.I)
        if not tc:
            tc = re.search(r"terminate\s+for\s+convenience.*?(\d+|\w+)\s*\(?\s*(\d+)\s*\)?\s*days", text, re.I)
        if tc:
            days_val = int(tc.group(2)) if tc.group(2) else (_word_num(tc.group(1)) or int(tc.group(1)))
            if days_val > 60:
                self.flags.append({"field":"termination_conv","check":"便利终止通知期合理",
                    "flag_if":f"便利终止通知期{days_val}天过长","risk_category":"Operational","severity":"Medium"})
        has_renewal_notif = bool(re.search(r"non[- ]?renew.*?notice|notice.*?non[- ]?renew", text, re.I))
        if self.fields["has_renewal"] and not has_renewal_notif:
            self.flags.append({"field":"renewal_notif","check":"续约有通知机制",
                "flag_if":"自动续约但无提前通知机制","risk_category":"Operational","severity":"Medium"})

    def _dsa(self, text: str):
        if not self.fields["has_phipa"]:
            self.flags.append({"field":"phia_compliance","check":"明确PHIPA合规",
                "flag_if":"缺少PHIPA compliance声明","risk_category":"Reputational","severity":"Critical"})
        if not self.fields["has_purpose_limit"]:
            self.flags.append({"field":"purpose_limitation","check":"有目的限制条款",
                "flag_if":"数据使用目的过于宽泛或无限制","risk_category":"Reputational","severity":"High"})
        if not self.fields["has_breach_notif"]:
            self.flags.append({"field":"breach_timeline","check":"有泄露通知时限",
                "flag_if":"缺少泄露通知时限","risk_category":"Reputational","severity":"High"})
        if not self.fields["has_data_sec"]:
            self.flags.append({"field":"security_standards","check":"有安全标准",
                "flag_if":"缺少安全标准或低于NCSG","risk_category":"Reputational","severity":"High"})
        if not self.fields["has_audit"]:
            self.flags.append({"field":"audit_rights","check":"有审计权条款",
                "flag_if":"缺少审计权条款","risk_category":"Operational","severity":"Medium"})
        if not re.search(r"minimization|only.*?necessary|limited\s+to|strictly\s+necessary", text, re.I):
            self.flags.append({"field":"data_minimization","check":"有数据最小化原则",
                "flag_if":"缺少数据最小化声明","risk_category":"Reputational","severity":"Medium"})

    def _duplicate_check(self, text: str):
        versions = re.findall(r"version\s*\d|v\d|supersedes|superseded|version\s+1|version\s+2", text, re.I)
        if len(versions) >= 2:
            self.flags.append({"field":"duplicate_version","check":"无重复/冲突合同",
                "flag_if":"检测到多个版本标记，可能存在重复或冲突","risk_category":"Financial","severity":"High"})
        contrib = re.findall(r"(?:contributes?|annual.*fee|annual.*cost|contribution)\s*[=:]\s*\$?(\d+[,.]?\d*)", text, re.I)
        if not contrib:
            contrib = re.findall(r"\$?(\d+[,.]?\d*)\s*/year", text, re.I)
        if len(set(contrib)) >= 2:
            self.flags.append({"field":"conflicting_finance","check":"财务条款一致",
                "flag_if":f"同一财务标签检测到不同金额：{', '.join(set(contrib))}","risk_category":"Financial","severity":"High"})

    def _ocr_check(self, text: str):
        q = self.fields["ocr_quality"]
        if q == "Poor":
            self.flags.append({"field":"ocr_quality","check":"文档质量可接受",
                "flag_if":"低质量扫描—关键字段无法辨认","risk_category":"Operational","severity":"Medium"})
            if any(w in text.lower() for w in ["illegible","obscured","[unclear","[stain"]):
                self.flags.append({"field":"missing_fields","check":"关键字段可提取",
                    "flag_if":"因扫描质量问题无法验证关键条款","risk_category":"Financial","severity":"Critical"})

    def _risk_score(self) -> float:
        if not self.flags:
            return 1.0
        total = sum(SEVERITY_SCORES.get(f["severity"], 3) for f in self.flags)
        avg = total / len(self.flags)
        score = avg + (len(self.flags) - 1) * 0.2
        return round(min(5.0, max(1.0, score)), 1)

    def _risk_level(self, s: float) -> str:
        if s >= RISK_THRESHOLDS["critical"]: return "Critical"
        if s >= RISK_THRESHOLDS["high"]: return "High"
        if s >= RISK_THRESHOLDS["medium"]: return "Medium"
        return "Low"

    def _parties(self, text: str) -> List[str]:
        results = []
        seen = set()
        m = re.search(r"between\s*\n\s*([A-Z][^\n]{5,59}?)\s*\n.*?\band\s*\n\s*([A-Z][^\n]{5,59}?)", text, re.DOTALL | re.I)
        if m:
            for g in m.groups():
                n = re.sub(r"\n+", " ", g).strip()
                n = re.sub(r"[^a-zA-Z0-9\s,.&\-']", " ", n).strip()
                n = re.sub(r"\s+", " ", n)
                if n and n not in seen and len(n) > 3:
                    seen.add(n); results.append(n[:60])
        kw = ["SOUTHLAKE","HEALTH","INC","LIMITED","PARTNERS","NETWORK","INSTITUTE",
              "ALLIANCE","VENTURES","SOLUTIONS","SERVICES","CARE","PARTNER"]
        for line in text.split("\n"):
            s = line.strip()
            if "__" in s or "DATE:" in s or "SIGNED" in s: continue
            if 5 < len(s) < 60 and s.isupper() and any(k in s for k in kw):
                if s not in seen:
                    seen.add(s); results.append(s[:60])
        return results[:5]

    def _sigs(self, text: str) -> List[Dict]:
        sigs = []
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if "SIGNATURE" in line.upper() or "IN WITNESS" in line.upper(): continue
            if "__" in line and len(line.strip()) > 5:
                for j in range(i+1, min(i+5, len(lines))):
                    nl = lines[j].strip()
                    if nl and "__" not in nl and len(nl) < 50:
                        tl = lines[j+1].strip() if j+1 < len(lines) else ""
                        dl = lines[j+2].strip() if j+2 < len(lines) else ""
                        if "date" in dl.lower():
                            sigs.append({"name": nl, "title": tl}); break
        return sigs

    def _vp_count(self, text: str) -> int:
        count = 0
        for line in text.split("\n"):
            if re.search(r"vice\s+president|\bvp[,\.\s]|(?<!\w)vp(?!\w)", line.lower()):
                count += 1
        # Also catch bullet-point format: "- VP Operations (Southlake)"
        vp_in_bullets = re.findall(r"-?\s*VP\s+\w+", text, re.I)
        count += len(vp_in_bullets)
        return min(count, 5)

    def _ocr(self, text: str) -> str:
        issues = []
        if any(w in text.lower() for w in ["illegible","unclear","obscured","cut off","stain"]): issues.append("quality")
        if text.count("[") > 5 or "[unclear" in text: issues.append("incomplete")
        if len(text) < 500: issues.append("short")
        if len(issues) >= 2: return "Poor"
        elif len(issues) == 1: return "Fair"
        return "Good"


CONTRACTS = {
    "Contract_1_NDA": {
        "text": """MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered 
into as of March 15, 2024 ("Effective Date"), by and between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

COMMUNITY CARE PARTNERS INC.
456 Health Plaza
Newmarket, Ontario L3Y 5P3

RECITALS:
WHEREAS the parties wish to explore a potential partnership 
for integrated community health services; and
WHEREAS in connection with such discussions, each party may 
disclose confidential information to the other party;

NOW THEREFORE the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information 
disclosed by either party ("Disclosing Party") to the other 
party ("Receiving Party") that is designated as confidential 
or that reasonably should be understood to be confidential 
given the nature of the information and circumstances of 
disclosure, including but not limited to:
  a) Patient health information protected under PHIPA
  b) Business strategies, financial data, and operational plans
  c) Proprietary methodologies and protocols
  d) Staff and physician information

Confidential Information does NOT include information that:
  (a) is or becomes publicly available through no breach of 
      this Agreement
  (b) was rightfully known by the Receiving Party prior to 
      disclosure
  (c) is independently developed by the Receiving Party without 
      use of Confidential Information
  (d) is rightfully received from a third party without breach

2. OBLIGATIONS OF CONFIDENTIALITY
The Receiving Party shall:
  a) Use Confidential Information solely for the purpose of 
     evaluating and pursuing the potential partnership 
     described in Exhibit A
  b) Protect Confidential Information with at least the same 
     degree of care as it uses to protect its own confidential 
     information of like kind, but no less than reasonable care
  c) Not disclose Confidential Information to any third party 
     without prior written consent, except to its employees, 
     contractors, and advisors who have a need to know and 
     are bound by confidentiality obligations at least as 
     protective as this Agreement

3. PHIPA COMPLIANCE
To the extent that Confidential Information includes personal 
health information as defined in the Personal Health Information 
Protection Act, 2004, S.O. 2004, c. 3, Sch. 3 ("PHIPA"), the 
parties agree to comply with all applicable requirements of 
PHIPA, including but not limited to:
  a) Collecting, using, and disclosing personal health 
     information only for permitted purposes
  b) Implementing appropriate administrative, technical, and 
     organizational security safeguards
  c) Notifying the other party within 48 hours of becoming 
     aware of any actual or suspected breach of personal 
     health information

4. TERM
This Agreement shall commence on the Effective Date and 
continue for a period of five (5) years, unless terminated 
earlier in accordance with Section 5.

5. TERMINATION
Either party may terminate this Agreement upon sixty (60) 
days written notice to the other party. Upon termination, 
the obligations under Sections 2 and 6 shall survive.

6. RETURN OR DESTRUCTION OF INFORMATION
Upon termination or at the Disclosing Party's request, the 
Receiving Party shall, within thirty (30) days:
  a) Return all Confidential Information, including all copies, 
     reproductions, and summaries; or
  b) Destroy all Confidential Information and provide written 
     certification of destruction signed by an authorized 
     officer

7. REMEDIES
The parties acknowledge that monetary damages may not be 
an adequate remedy for any breach of this Agreement and 
that the Disclosing Party shall be entitled to seek 
injunctive relief and specific performance, in addition 
to any other remedies available at law.

8. GOVERNING LAW
This Agreement shall be governed by and construed in 
accordance with the laws of the Province of Ontario and 
the applicable laws of Canada.

IN WITNESS WHEREOF, the parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    COMMUNITY CARE PARTNERS INC.:

___________________________          ___________________________
Maria Gonzalez                       Community Care Partners Inc.
Vice President, Operations           Chief Executive Officer
Date: March 15, 2024                 Date: March 15, 2024

___________________________
James Chen
Vice President, Finance
Date: March 15, 2024""",
        "type": "NDA",
        "expected_flags": 0,
        "expected_risk": "Low",
        "expected_score": 1.0,
    },
    "Contract_2_MOU": {
        "text": """MEMORANDUM OF UNDERSTANDING

This Memorandum of Understanding ("MOU") is made effective 
as of June 1, 2024, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

YORK REGION COMMUNITY HEALTH NETWORK
456 Community Drive
Newmarket, Ontario L3X 1Y2

1. PURPOSE
This MOU establishes a partnership between the Parties for 
shared community health programming, including joint wellness 
workshops, chronic disease management initiatives, and 
health promotion activities in the York Region.

2. SCOPE OF COLLABORATION
The Parties agree to collaborate on the following activities:
  a) Joint health screening events (quarterly)
  b) Shared referral pathways for mental health services
  c) Coordinated care transitions between primary and 
     community care
  d) Shared de-identified data for program evaluation

3. FINANCIAL OBLIGATIONS
Southlake Health shall contribute up to $250,000 annually 
to support joint programming. Additional funding may be 
sought from provincial grants and foundations. Each Party 
shall bear its own operational costs unless otherwise 
agreed in writing.

4. DATA SHARING
The Parties agree to share de-identified program data for 
reporting purposes only, in compliance with applicable 
privacy legislation including PHIPA and FIPPA. A separate 
Data Sharing Agreement will be executed prior to any data 
exchange.

5. TERM AND RENEWAL
This MOU shall be effective from June 1, 2024 to May 31, 2026, 
and may be renewed by mutual written agreement of both 
Parties.

6. binding NATURE
This MOU represents the understanding of the Parties and is 
not intended to create legally binding obligations, except 
for the confidentiality provisions contained herein. 
Financial commitments outlined in Section 3 shall be binding 
upon execution of a separate formal agreement.

7. AMENDMENTS
Any amendments to this MOU must be made in writing and 
signed by authorized representatives of both Parties.

This MOU may be terminated by either Party upon ninety (90) 
days written notice to the other Party.

IN WITNESS WHEREOF, the Parties have caused this MOU to be 
executed by their duly authorized representatives as of 
the date first written above.

SOUTHLAKE HEALTH:                    YORK REGION COMMUNITY HEALTH NETWORK:

___________________________          ___________________________
Robert Thompson                      Dr. Amanda Lee
Executive Director,                  Chief Medical Officer
Population Health Management         Date: June 1, 2024
Date: June 1, 2024""",
        "type": "MOU",
        "expected_flags": 3,
        "expected_risk": "Critical",
        "expected_score": 4.7,
    },
    "Contract_3_Procurement": {
        "text": """VENDOR SERVICES AGREEMENT

This Vendor Services Agreement ("Agreement") is entered into 
effective January 1, 2023, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5
("Purchaser")

AND

MEDSOFT SOLUTIONS INC.
250 Technology Drive, Unit 5
Toronto, Ontario M5V 3A8
("Vendor")

1. SERVICES
Vendor shall provide electronic health record (EHR) software 
licensing, implementation support, and ongoing maintenance 
services to Purchaser as detailed in Exhibit A (Statement of 
Work).

2. TERM
This Agreement commenced on January 1, 2023 and shall continue 
until December 31, 2025, automatically renewing for successive 
one (1) year periods unless either Party provides written 
notice of non-renewal at least thirty (30) days prior to the 
expiration date.

3. FEES AND PAYMENT
  a) Annual license fee: $180,000
  b) Support services: $45,000/year
  c) Additional modules: $15,000 per module per year
  d) Fees are subject to annual increase of five percent (5%) 
     or the Consumer Price Index (CPI), whichever is greater
  e) Payment terms: Net thirty (30) days from invoice date

4. SERVICE LEVEL AGREEMENT
  a) Vendor guarantees ninety-nine point five percent (99.5%) 
     system uptime during business hours (7:00 AM – 7:00 PM, 
     Monday through Friday)
  b) For downtime exceeding the guaranteed level, Vendor shall 
     provide service credits equal to five percent (5%) of 
     monthly fees per hour of downtime
  c) Vendor shall provide monthly performance reports

5. DATA SECURITY AND PRIVACY
  a) Vendor acknowledges that it may have access to personal 
     health information ("PHI") of Purchaser's patients
  b) Vendor shall comply with all applicable privacy laws 
     including PHIPA and PIPEDA
  c) Vendor shall implement appropriate technical and 
     organizational security measures including encryption 
     of data at rest and in transit
  d) In the event of a data breach involving PHI, Vendor 
     shall notify Purchaser within seventy-two (72) hours

6. INDEMNIFICATION
Each Party shall indemnify, defend, and hold harmless the 
other Party and its officers, directors, and employees from 
and against any claims, damages, losses, and expenses 
(arising from negligence or wrongful acts of the indemnifying 
Party). Indemnification obligations shall not be subject to 
a monetary cap.

7. TERMINATION
  a) Either Party may terminate for material breach with 
     thirty (30) days written notice and failure to cure
  b) Purchaser may terminate for convenience with ninety 
     (90) days written notice
  c) Upon termination, Vendor shall return or destroy all 
     PHI in its possession within thirty (30) days

8. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario and the applicable laws of Canada.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    MEDSOFT SOLUTIONS INC.:

___________________________          ___________________________
Patricia Wong                        Michael Torres
Vice President, Information          Chief Executive Officer
Technology                           Date: January 1, 2023
Date: January 1, 2023

___________________________
David Kumar
Vice President, Finance
Date: January 1, 2023""",
        "type": "Procurement",
        "expected_flags": 3,
        "expected_risk": "Critical",
        "expected_score": 4.1,
    },
    "Contract_4_DataSharing": {
        "text": """DATA SHARING AGREEMENT

This Data Sharing Agreement ("DSA") is made effective 
September 1, 2024, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

UNIVERSITY HEALTH RESEARCH INSTITUTE
789 Research Boulevard
Toronto, Ontario M5S 1A8

1. PURPOSE
The purpose of this Agreement is to facilitate the sharing 
of de-identified patient outcome data between the Parties 
for research purposes related to chronic disease management 
and quality improvement in primary care settings.

2. DATA TO BE SHARED
The following categories of de-identified data will be shared:
  a) Patient demographics (age group, gender, postal code 
     forward sortation area)
  b) Diagnosis codes (ICD-10-CA)
  c) Treatment outcomes and medication adherence rates
  d) Length of stay for hospital admissions
  e) 30-day readmission rates
  f) Preventive screening completion rates

3. USE OF DATA
The receiving Party may use the data for:
  a) Academic research and analysis
  b) Publication in peer-reviewed journals
  c) Presentation at conferences
  d) Sharing with research collaborators
  e) Quality improvement reporting

4. DURATION
This Agreement shall remain in effect for three (3) years 
from the Effective Date, unless terminated earlier by either 
Party with sixty (60) days written notice.

5. RESPONSIBILITIES OF THE PARTIES
  a) Both Parties agree to protect the confidentiality of 
     the data shared under this Agreement
  b) The receiving Party shall not attempt to re-identify 
     any de-identified data
  c) The disclosing Party warrants that all data shared 
     has been properly de-identified in accordance with 
     applicable privacy standards

6. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario and the federal laws of Canada applicable therein.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the date first written above.

SOUTHLAKE HEALTH:                    UNIVERSITY HEALTH RESEARCH INSTITUTE:

___________________________          ___________________________
Susan Park                           Dr. Richard Foster
Director, Quality and Privacy        Chief Research Officer
Date: September 1, 2024              Date: September 1, 2024""",
        "type": "Data_Sharing",
        "expected_flags": 7,
        "expected_risk": "Critical",
        "expected_score": 5.0,
    },
    "Contract_5_NDA": {
        "text": """CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into 
as of February 14, 2022, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

HEALTHTECH VENTURES LTD.
300 Innovation Way
Mississauga, Ontario L5B 2C9

1. CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information 
relating to the business, operations, or patients of either 
Party that is disclosed by one Party to the other.

2. OBLIGATIONS
The receiving Party agrees to keep all Confidential 
Information confidential and not to disclose it to any 
third party without prior written consent.

3. TERM
This Agreement shall remain in effect for a period of two 
(2) years from the Effective Date.

4. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the date first written above.

SOUTHLAKE HEALTH:                    HEALTHTECH VENTURES LTD.:

___________________________          ___________________________
Lisa Martinez                        Jennifer Liu
Vice President, Operations           Chief Executive Officer
Date: February 14, 2022              Date: February 14, 2022

___________________________
Tom Anderson
Vice President, Procurement
Date: February 14, 2022""",
        "type": "NDA",
        "expected_flags": 4,
        "expected_risk": "Critical",
        "expected_score": 4.6,
    },
    "Contract_6_Procurement": {
        "text": """SECURITY SERVICES AGREEMENT

This Security Services Agreement ("Agreement") is made 
effective April 1, 2024, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5
("Purchaser")

AND

SECUREPRO SERVICES INC.
55 Security Boulevard
Richmond Hill, Ontario L4C 9E8
("Vendor")

1. SERVICES
Vendor shall provide 24/7 physical security services 
including access control, surveillance monitoring, and 
emergency response at Purchaser's facilities.

2. TERM
This Agreement shall commence on April 1, 2024 and continue 
for a period of one (1) year, expiring on March 31, 2025. 
This Agreement shall automatically renew for successive 
one (1) year periods unless either Party provides written 
notice of non-renewal at least sixty (60) days prior to the 
expiration date.

3. FEES
  a) Monthly security services fee: $35,000
  b) Annual total: $420,000
  c) Overtime and special event staffing: billed at 
     pre-agreed hourly rates
  d) Payment terms: Net thirty (30) days from invoice

4. SERVICE LEVEL AGREEMENT
  a) Response time: 15 minutes for urgent requests, 
     30 minutes for standard requests
  b) Coverage: 24/7/365
  c) Monthly performance reporting required
  d) Service credits: 10% of monthly fee per hour of 
     coverage gap beyond guaranteed levels

5. TERMINATION
  a) Either Party may terminate for material breach with 
     sixty (60) days written notice and failure to cure
  b) Purchaser may terminate for convenience with thirty 
     (30) days written notice
  c) Vendor shall cooperate in transition of services 
     upon termination

6. INSURANCE
Vendor shall maintain commercial general liability insurance 
with minimum coverage of $2,000,000 per occurrence.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    SECUREPRO SERVICES INC.:

___________________________          ___________________________
Mark Johnson                         Steven Clark
Vice President, Operations           President
Date: April 1, 2024                  Date: April 1, 2024

___________________________
Amanda White
Vice President, Finance
Date: April 1, 2024""",
        "type": "Procurement",
        "expected_flags": 2,
        "expected_risk": "Critical",
        "expected_score": 4.2,
    },
    "Contract_7_MOU": {
        "text": """[VERSION 1 - FILE: MOU_Partnership_v1.pdf]

MEMORANDUM OF UNDERSTANDING

This MOU is made effective August 1, 2023, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200, Aurora, ON L4G 0B5

AND

REGIONAL HEALTH ALLIANCE
200 Healthcare Blvd, Newmarket, ON L3Y 8Z5

PURPOSE: Joint community health outreach program.

TERM: Two (2) years from August 1, 2023 to July 31, 2025.

FINANCIAL: Southlake contributes $100,000/year.

BINDING: This MOU is not legally binding except for 
confidentiality.

SIGNATURES:
  - VP Operations (Southlake)
  - VP Finance (Southlake)
  - CEO (Regional Health Alliance)

[VERSION 2 - FILE: MOU_Partnership_v2.pdf]

MEMORANDUM OF UNDERSTANDING

This MOU supersedes all prior understandings between the 
Parties and is made effective October 15, 2023, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200, Aurora, ON L4G 0B5

AND

REGIONAL HEALTH ALLIANCE
200 Healthcare Blvd, Newmarket, ON L3Y 8Z5

PURPOSE: Expanded partnership including data sharing and 
joint procurement for shared services.

TERM: Three (3) years from October 15, 2023 to October 14, 
2026.

FINANCIAL: Southlake contributes $150,000/year (increased 
from $100,000). Additional funding to be sought from provincial 
grants.

BINDING: This MOU constitutes a legally binding agreement 
regarding financial commitments and data sharing provisions. 
Other provisions are non-binding understandings.

SIGNATURES:
  - VP Operations (Southlake)
  - CEO (Southlake)
  - CEO (Regional Health Alliance)""",
        "type": "MOU",
        "expected_flags": 5,
        "expected_risk": "Critical",
        "expected_score": 4.6,
    },
    "Contract_8_Procurement": {
        "text": """[NOTE: This is a poorly scanned document with the following 
characteristics:
  - Resolution: ~150 DPI (very low)
  - Faded text in multiple sections
  - Stain marks covering portions of pages 3-4
  - Some text partially cut off on left margin
  - Page 2 is rotated 15 degrees
  - Overall readability: poor]

[RECOVERABLE TEXT ONLY:]

SOFTWARE LICENSE AGREEMENT
Effective: March [unclear - possibly 2019]
Party: SOUTHLAKE HEALTH...[stain covers vendor name]
...[unclear]...annual license fee of $[illegible - stain]
Term: [unclear - possibly 3 years per ...]
...[cut off text]...indemnification...[illegible]
...[partially visible]...service level...[99% uptime?]
...[partially visible]...termination...[60 days?]
...[partially visible]...data security...[referenced]
Signatures present but names partially obscured:
  - [name]...[title unclear]...Date: 03/[unclear]/2019
  - [name]...[title unclear]...Date: 03/[unclear]/2019
  - [vendor rep]...[title unclear]...Date: 03/[unclear]/2019

[CRITICAL ISSUE: Key fields — vendor name, fee amount, 
exact term length, indemnity terms, and signatory names — 
are illegible due to scan quality.]""",
        "type": "Procurement",
        "expected_flags": 6,
        "expected_risk": "Critical",
        "expected_score": 5.0,
    },
}

class TestRunner:
    def __init__(self):
        self.analyzer = ContractAnalyzer()
        self.results = []

    def run_all(self):
        for name, data in CONTRACTS.items():
            r = self.analyzer.analyze(data["text"], data["type"])
            passed = (abs(len(r["flags"]) - data["expected_flags"]) <= 1
                      and r["risk_level"] == data["expected_risk"])
            self.results.append({
                "name": name, "passed": passed,
                "expected_flags": data["expected_flags"],
                "actual_flags": len(r["flags"]),
                "expected_risk": data["expected_risk"],
                "actual_risk": r["risk_level"],
                "expected_score": data.get("expected_score"),
                "actual_score": r["risk_score"],
                "flags_detail": r["flags"],
                "fields_summary": {
                    "parties": r["extracted_fields"].get("parties", []),
                    "effective": str(r["extracted_fields"].get("effective_date", "N/A")),
                    "expiry": str(r["extracted_fields"].get("expiry_date", "N/A")),
                    "vp_count": r["extracted_fields"].get("vp_count", 0),
                    "ocr": r["extracted_fields"].get("ocr_quality", "N/A"),
                },
            })
        return self.results

    def report(self):
        print("=" * 70)
        print("  AI Prototype 测试报告 — Synthetic Contracts v2 (Fixed)")
        print("=" * 70)
        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)
        print(f"\n  总览: {passed}/{total} 测试通过")
        print("-" * 70)
        for r in self.results:
            s = "PASS" if r["passed"] else "FAIL"
            print(f"\n  [{s}] {r['name']}")
            print(f"    Flags: 预期{r['expected_flags']} | 实际{r['actual_flags']}")
            print(f"    Risk:  预期{r['expected_risk']}({r['expected_score']}) | "
                  f"实际{r['actual_risk']}({r['actual_score']})")
            if not r["passed"]:
                print(f"    Flags:")
                for f in r["flags_detail"]:
                    print(f"      - [{f['severity']}] {f['field']}: {f['flag_if']}")
        print("\n  字段提取摘要")
        print("-" * 70)
        for r in self.results:
            ef = r["fields_summary"]
            print(f"\n  {r['name']}:")
            print(f"    Parties: {ef['parties']}")
            print(f"    Effective: {ef['effective']} | Expiry: {ef['expiry']}")
            print(f"    VP Signatures: {ef['vp_count']} | OCR: {ef['ocr']}")
        print("\n" + "=" * 70)

    def save(self, path: str):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"passed": sum(1 for r in self.results if r["passed"]),
                        "total": len(self.results), "results": self.results},
                       f, indent=2, ensure_ascii=False)
        print(f"报告已保存: {path}")


if __name__ == "__main__":
    runner = TestRunner()
    runner.run_all()
    runner.report()
    runner.save("/Users/twj/Documents/Obsidian Vault/项目/Critical-Corporate-Document-Management/prototypes/test-report.json")
