# Agnes OCR Wrapper — v0.1
## Extracts structured text from PDF/image contracts using agnes-2.0-flash
## Usage: python agnes_ocr.py --file contract.pdf
## OR:   from agnes_ocr import extract_contract_text
##        result = extract_contract_text(image_base64_or_url)

import base64
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# ============================================================================
# 配置 — 填入你的 Agnes API Key
# ============================================================================

AGNES_API_KEY = ""  # TODO: 填入 https://apihub.agnes-ai.com 的 API key
AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1/chat/completions"
AGNES_MODEL = "agnes-2.0-flash"

# 结构化提取的 prompt
EXTRACTION_PROMPT = """You are a legal document analyst. Extract the following structured information from the contract text below.

Return ONLY a valid JSON object with these fields (omit any that are not present):
- document_type: one of "NDA", "MOU", "Procurement", "Data_Sharing", "Policy", "Other"
- parties: list of company/organization names
- effective_date: ISO date string (YYYY-MM-DD) or null
- expiry_date: ISO date string or null
- term_years: number of years or null
- has_phipa_clause: boolean
- has_indemnity: boolean
- indemnity_has_cap: boolean or null (true/false/unknown)
- has_slas: boolean
- breach_notification_hours: number or null
- termination_notice_days: number or null
- auto_renewal: boolean
- renewal_notice_days: number or null
- has_data_security: boolean
- has_audit_rights: boolean
- has_return_destruction: boolean
- vp_signature_count: number of VP signatories or null
- signer_titles: list of signatory titles (e.g. ["VP Operations", "CEO"])
- ocr_quality: "Good" | "Fair" | "Poor" based on readability
- key_clauses: list of {section, type, summary, raw_text} for any notable clauses
- confidence: float 0.0-1.0 representing overall extraction confidence

Contract text:
---
{contract_text}
"""

# ============================================================================
# 辅助函数
# ============================================================================

def _b64_image(path: str) -> str:
    """Convert file to base64 data URI."""
    ext = Path(path).suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "pdf": "application/pdf", "tiff": "image/tiff"}[ext]
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:{mime};base64,{data}"


def _call_agnes(messages: list, max_tokens: int = 2048) -> dict:
    """Call Agnes API and return parsed response."""
    if not AGNES_API_KEY:
        raise ValueError("AGNES_API_KEY not set. Set it in agnes_ocr.py or export AGNES_API_KEY env var.")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AGNES_API_KEY}",
    }
    payload = {
        "model": AGNES_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    
    req = urllib.request.Request(
        AGNES_BASE_URL,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def _extract_json_from_response(text: str) -> dict:
    """Parse JSON from Agnes response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1)
    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}')
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                pass
    return {}


# ============================================================================
# 主接口
# ============================================================================

def extract_contract_text(text: str) -> Dict:
    """
    Extract structured fields from contract text using Agnes.
    Returns dict matching test_framework.py's expected field format.
    """
    prompt = EXTRACTION_PROMPT.format(contract_text=text[:8000])  # limit context
    messages = [{"role": "user", "content": prompt}]
    
    resp = _call_agnes(messages)
    raw_text = resp["choices"][0]["message"]["content"]
    extracted = _extract_json_from_response(raw_text)
    
    # Normalize to test_framework.py field names
    return {
        "document_type": extracted.get("document_type", "Other"),
        "parties": extracted.get("parties", []),
        "effective_date": _parse_iso_date(extracted.get("effective_date")),
        "expiry_date": _parse_iso_date(extracted.get("expiry_date")),
        "vp_count": extracted.get("vp_signature_count"),
        "has_phipa": extracted.get("has_phipa_clause", False),
        "has_indemnity": extracted.get("has_indemnity", False),
        "indemnity_cap": extracted.get("indemnity_has_cap"),
        "has_sla": extracted.get("has_slas", False),
        "breach_hours": extracted.get("breach_notification_hours"),
        "termination_days": extracted.get("termination_notice_days"),
        "auto_renewal": extracted.get("auto_renewal", False),
        "renewal_notice_days": extracted.get("renewal_notice_days"),
        "has_data_security": extracted.get("has_data_security", False),
        "has_audit": extracted.get("has_audit_rights", False),
        "has_return_dest": extracted.get("has_return_destruction", False),
        "key_clauses": extracted.get("key_clauses", []),
        "confidence": extracted.get("confidence", 0.8),
        "raw_output": raw_text,
    }


def _parse_iso_date(s: Optional[str]) -> Optional[datetime]:
    """Parse ISO date string to datetime."""
    if not s:
        return None
    for fmt in ["%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"]:
        try:
            return datetime.strptime(s.strip(), fmt)
        except ValueError:
            continue
    return None


def analyze_from_file(file_path: str) -> Dict:
    """
    Full pipeline: file → Agnes OCR → structured extraction.
    For PDF/images: reads file, sends to Agnes multimodal API.
    For text files: sends text directly.
    """
    path = Path(file_path)
    
    if path.suffix.lower() in [".txt", ".md"]:
        text = path.read_text(encoding="utf-8")
        return extract_contract_text(text)
    
    # For images/PDFs: need to handle differently
    # Agnes accepts image URLs or base64 data URIs
    # For now, we'll use the text-based approach
    # In production, convert PDF pages to images first
    raise ValueError(f"File type {path.suffix} not yet supported. Use .txt files for now.")


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Agnes OCR for contract analysis")
    parser.add_argument("file", help="Contract file (.txt, .pdf, .png, .jpg)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show raw Agnes output")
    args = parser.parse_args()
    
    if not AGNES_API_KEY:
        print("ERROR: Set AGNES_API_KEY environment variable or edit agnes_ocr.py")
        print("Get your key at: https://apihub.agnes-ai.com")
        sys.exit(1)
    
    result = analyze_from_file(args.file)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if args.verbose and "raw_output" in result:
        print("\n=== RAW AGNES OUTPUT ===")
        print(result["raw_output"])
