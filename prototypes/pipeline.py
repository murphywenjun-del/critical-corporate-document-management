# AI Contract Risk Pipeline — v0.2
## Full pipeline: Agnes OCR → structured extraction → Jev risk decision
## Usage: python pipeline.py [--contracts research/synthetic-contracts-v2.md] [--output jev_results.jsonl]

import base64
import json
import re
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# ============================================================================
# Configuration — API keys from environment
# ============================================================================

AGNES_API_KEY = ""
AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1/chat/completions"
AGNES_MODEL = "agnes-2.5-flash"

JEV_API_KEY = ""
JEV_BASE_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MODEL = "jev-latest"


_ssl_ctx = None
def _get_ssl_ctx():
    global _ssl_ctx
    if _ssl_ctx is None:
        try:
            import certifi
            _ssl_ctx = ssl.create_default_context(cafile=certifi.where())
        except ImportError:
            # Fallback: bypass cert verification (dev only!)
            _ssl_ctx = ssl.create_default_context()
            _ssl_ctx.check_hostname = False
            _ssl_ctx.verify_mode = ssl.CERT_NONE
    return _ssl_ctx

def _load_keys():
    """Load API keys from environment variables."""
    global AGNES_API_KEY, JEV_API_KEY
    AGNES_API_KEY = AGNES_API_KEY or os.environ.get("AGNES_API_KEY", "")
    JEV_API_KEY = JEV_API_KEY or os.environ.get("TYPESAFE_API_KEY", "")


import os
import ssl
_load_keys()


# ============================================================================
# Agnes API Wrapper
# ============================================================================

def agnes_extract_text(image_path: str) -> str:
    """
    Send image/PDF to Agnes multimodal model for OCR + text extraction.
    Returns the extracted text as a string.
    """
    if not AGNES_API_KEY:
        raise ValueError("AGNES_API_KEY not set")
    
    # Convert image to base64
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    
    ext = Path(image_path).suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}[ext]
    data_uri = f"data:{mime};base64,{b64}"
    
    prompt = """Extract ALL readable text from this document. Return ONLY the raw text content, preserving all sections, clauses, dates, names, and signatures exactly as they appear. Do not summarize — provide the complete text."""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AGNES_API_KEY}",
    }
    payload = {
        "model": AGNES_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_uri}},
            ]
        }],
        "max_tokens": 4096,
        "temperature": 0.1,
    }
    
    req = urllib.request.Request(
        AGNES_BASE_URL,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120, context=_get_ssl_ctx()) as resp:
        result = json.loads(resp.read().decode())
    
    return result["choices"][0]["message"]["content"]


def agnes_extract_structured(contract_text: str) -> Dict:
    """
    Send contract text to Agnes for structured field extraction.
    Returns dict of extracted fields.
    """
    if not AGNES_API_KEY:
        raise ValueError("AGNES_API_KEY not set")
    
    prompt = f"""You are a legal document analyst. Extract structured information from this contract.

Return ONLY a valid JSON object (no markdown, no explanation):

{{
  "document_type": "NDA|MOU|Procurement|Data_Sharing|Policy|Other",
  "parties": ["Company A", "Company B"],
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "vp_signature_count": number or null,
  "has_phipa_clause": true/false,
  "has_indemnity": true/false,
  "indemnity_has_cap": true/false/null,
  "has_sla": true/false,
  "breach_notification_hours": number or null,
  "termination_notice_days": number or null,
  "auto_renewal": true/false,
  "renewal_notice_days": number or null,
  "has_data_security": true/false,
  "has_audit_rights": true/false,
  "has_return_destruction": true/false,
  "ocr_quality": "Good|Fair|Poor",
  "confidence": 0.0-1.0
}}

Contract text (first 6000 chars):
---
{contract_text[:6000]}
"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AGNES_API_KEY}",
    }
    payload = {
        "model": AGNES_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.1,
    }
    
    req = urllib.request.Request(
        AGNES_BASE_URL,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60, context=_get_ssl_ctx()) as resp:
        result = json.loads(resp.read().decode())
    
    raw = result["choices"][0]["message"]["content"]
    # Parse JSON from response
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"error": "Failed to parse Agnes response", "raw": raw}


# ============================================================================
# Jev API Wrapper
# ============================================================================

def jev_risk_decision( extracted_fields: Dict, contract_text: str) -> Dict:
    """
    Send extracted contract fields to Jev for risk decision.
    Returns Jev answers with confidence scores.
    """
    if not JEV_API_KEY:
        raise ValueError("TYPESAFE_API_KEY not set")
    
    # Build state for Jev
    state = {
        "document_type": extracted_fields.get("document_type", "Other"),
        "parties": extracted_fields.get("parties", []),
        "effective_date": str(extracted_fields.get("effective_date", "unknown")),
        "expiry_date": str(extracted_fields.get("expiry_date", "unknown")),
        "vp_count": extracted_fields.get("vp_signature_count", 0),
        "has_phipa": extracted_fields.get("has_phipa_clause", False),
        "has_indemnity": extracted_fields.get("has_indemnity", False),
        "indemnity_has_cap": extracted_fields.get("indemnity_has_cap", None),
        "has_sla": extracted_fields.get("has_sla", False),
        "breach_hours": extracted_fields.get("breach_notification_hours", None),
        "termination_days": extracted_fields.get("termination_notice_days", None),
        "auto_renewal": extracted_fields.get("auto_renewal", False),
        "renewal_days": extracted_fields.get("renewal_notice_days", None),
        "has_data_security": extracted_fields.get("has_data_security", False),
        "has_audit": extracted_fields.get("has_audit_rights", False),
        "has_return_dest": extracted_fields.get("has_return_destruction", False),
        "ocr_quality": extracted_fields.get("ocr_quality", "Good"),
        "contract_summary": contract_text[:2000] if len(contract_text) > 2000 else contract_text,
    }
    
    # Jev questions — structured risk decisions
    questions = {
        "risk_severity": {
            "type": "choice",
            "instructions": "Based on Southlake Health's corporate document risk policy, what is the overall risk severity of this contract?",
            "criteria": {
                "low": "No significant risks identified. All key clauses present and compliant.",
                "medium": "Minor gaps or ambiguities. Some clauses need review but no critical violations.",
                "high": "Multiple risk indicators. Missing key compliance clauses or has ambiguous terms.",
                "critical": "Severe compliance gaps. Missing PHIPA/data protection, unauthorized signatories, or expired contracts with no action plan.",
            }
        },
        "needs_human_review": {
            "type": "noul",
            "instructions": "Does this contract require immediate human review by Southlake's legal team?",
            "criteria": {
                "true": "Contract has critical risks, missing VP signatures, expired with no renewal plan, or regulatory non-compliance.",
                "false": "Contract is well-drafted and compliant, or risks are minor and can be addressed in normal workflow.",
            }
        },
        "is_compliance_related": {
            "type": "noul",
            "instructions": "Is this contract related to regulatory compliance (PHIPA, FIPPA, data protection, healthcare obligations)?",
            "criteria": {
                "true": "Contract involves patient health information, data sharing, privacy obligations, or regulatory requirements.",
                "false": "Contract is purely operational, financial, or administrative with no compliance implications.",
            }
        },
        "should_alert": {
            "type": "noul",
            "instructions": "Should this contract trigger an automated alert/notification to the risk management team?",
            "criteria": {
                "true": "Contract has high or critical risk, is expired, missing key clauses, or has ambiguous terms that need attention.",
                "false": "Contract is compliant and well-drafted, no immediate action needed.",
            }
        },
        "decision_confidence": {
            "type": "score",
            "instructions": "How confident are you in this risk assessment based on the available information?",
            "criteria": [
                "Very uncertain — poor quality input, missing key fields",
                "Uncertain — some information missing or ambiguous",
                "Moderately confident — most fields present, some gaps",
                "Confident — good quality extraction, clear risk indicators",
                "Very confident — complete information, unambiguous risks",
            ]
        },
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JEV_API_KEY}",
    }
    payload = {
        "model": JEV_MODEL,
        "state": state,
        "questions": questions,
    }
    
    req = urllib.request.Request(
        JEV_BASE_URL,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30, context=_get_ssl_ctx()) as resp:
        result = json.loads(resp.read().decode())
    
    return result


# ============================================================================
# Contract Loading
# ============================================================================

def load_synthetic_contracts(md_path: str) -> Dict[str, Dict]:
    """Load 8 synthetic contracts from markdown file."""
    with open(md_path, 'r') as f:
        content = f.read()
    
    contracts = {}
    sections = re.split(r'(?=## Contract \d+:)', content)
    for s in sections:
        m = re.match(r'## Contract (\d+): (.+)', s)
        if m:
            num = int(m.group(1))
            code_match = re.search(r'```(.*?)```', s, re.DOTALL)
            if code_match:
                name_map = {
                    1: "Contract_1_NDA", 2: "Contract_2_MOU", 3: "Contract_3_Procurement",
                    4: "Contract_4_DataSharing", 5: "Contract_5_NDA", 6: "Contract_6_Procurement",
                    7: "Contract_7_MOU", 8: "Contract_8_Procurement",
                }
                type_map = {
                    1: "NDA", 2: "MOU", 3: "Procurement", 4: "Data_Sharing",
                    5: "NDA", 6: "Procurement", 7: "MOU", 8: "Procurement",
                }
                contracts[name_map[num]] = {
                    "text": code_match.group(1).strip(),
                    "type": type_map[num],
                    "num": num,
                }
    return contracts


# ============================================================================
# Main Pipeline
# ============================================================================

def run_pipeline(contracts: Dict, use_agnes: bool = False, use_jev: bool = True) -> List[Dict]:
    """
    Run all contracts through the pipeline.
    
    Args:
        contracts: dict of contract name → {text, type, num}
        use_agnes: if True, use Agnes for extraction (requires API key)
                   if False, use rule-based extraction from test_framework
        use_jev: if True, send to Jev for risk decision
    """
    results = []
    
    # Import rules engine
    sys.path.insert(0, str(Path(__file__).parent))
    from test_framework import ContractAnalyzer
    analyzer = ContractAnalyzer()
    
    for name, contract in contracts.items():
        text = contract["text"]
        doc_type = contract["type"]
        num = contract["num"]
        
        print(f"\n{'='*60}")
        print(f"Processing {name} (#{num}) — {doc_type}")
        print(f"{'='*60}")
        
        # Step 1: Extract structured fields
        if use_agnes:
            print("  [1/3] Calling Agnes API for extraction...")
            agnes_result = agnes_extract_structured(text)
            extracted = agnes_result
            agnes_ok = "error" not in agnes_result
        else:
            print("  [1/3] Using rule-based extraction (test_framework)...")
            # Use rules engine to extract fields
            rule_result = analyzer.analyze(text, doc_type)
            extracted = {
                "document_type": doc_type,
                "parties": rule_result["extracted_fields"].get("parties", []),
                "effective_date": str(rule_result["extracted_fields"].get("effective_date", "unknown")),
                "expiry_date": str(rule_result["extracted_fields"].get("expiry_date", "unknown")),
                "vp_signature_count": rule_result["extracted_fields"].get("vp_count", 0),
                "has_phipa_clause": rule_result["extracted_fields"].get("has_phipa", False),
                "has_indemnity": rule_result["extracted_fields"].get("has_indemnity", False),
                "indemnity_has_cap": None,  # Will be determined by rules
                "has_sla": rule_result["extracted_fields"].get("has_sla", False),
                "breach_notification_hours": None,
                "termination_notice_days": None,
                "auto_renewal": rule_result["extracted_fields"].get("has_renewal", False),
                "renewal_notice_days": None,
                "has_data_security": rule_result["extracted_fields"].get("has_data_sec", False),
                "has_audit_rights": rule_result["extracted_fields"].get("has_audit", False),
                "has_return_destruction": rule_result["extracted_fields"].get("has_return_dest", False),
                "ocr_quality": rule_result["extracted_fields"].get("ocr_quality", "Good"),
                "confidence": 0.95,
            }
            agnes_ok = True
        
        print(f"  Extracted: type={extracted.get('document_type')}, vp={extracted.get('vp_signature_count')}, phipa={extracted.get('has_phipa_clause')}")
        
        # Step 2: Rules engine (ground truth)
        print("  [2/3] Running rules engine...")
        rule_result = analyzer.analyze(text, doc_type)
        flags = rule_result["flags"]
        risk_score = rule_result["risk_score"]
        risk_level = rule_result["risk_level"]
        
        print(f"  Rules: {len(flags)} flags, risk={risk_level}({risk_score})")
        
        # Step 3: Jev risk decision
        jev_result = None
        if use_jev and JEV_API_KEY:
            print("  [3/3] Calling Jev API for risk decision...")
            try:
                jev_result = jev_risk_decision(extracted, text)
                print(f"  Jev response received")
            except Exception as e:
                print(f"  Jev error: {e}")
                jev_result = {"error": str(e)}
        elif use_jev and not JEV_API_KEY:
            print("  [3/3] SKIPPED — TYPESAFE_API_KEY not set")
        
        # Compile result
        result = {
            "contract_name": name,
            "contract_num": num,
            "document_type": doc_type,
            "extraction_method": "agnes" if use_agnes else "rules",
            "agnes_ok": agnes_ok,
            "rules_flags_count": len(flags),
            "rules_risk_level": risk_level,
            "rules_risk_score": risk_score,
            "jeV_result": jev_result,
            "timestamp": datetime.now().isoformat(),
        }
        
        results.append(result)
        
        # Print summary
        if jev_result and "answers" in jev_result:
            answers = jev_result["answers"]
            if "risk_severity" in answers:
                print(f"  Jev severity: {answers['risk_severity'].get('choice', 'N/A')} (conf: {answers['risk_severity'].get('confidence', 'N/A'):.2f})")
            if "needs_human_review" in answers:
                print(f"  Jev review: {'YES' if answers['needs_human_review'].get('noul', 0) > 0.5 else 'NO'} (prob: {answers['needs_human_review'].get('noul', 0):.2f})")
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    return results


def save_results(results: List[Dict], output_path: str):
    """Save results to JSONL file."""
    with open(output_path, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False, default=str) + "\n")
    print(f"\nResults saved to: {output_path}")


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AI Contract Risk Pipeline")
    parser.add_argument("--contracts", "-c", 
                        default="research/synthetic-contracts-v2.md",
                        help="Path to synthetic contracts markdown")
    parser.add_argument("--output", "-o", default="jev_results.jsonl",
                        help="Output JSONL file path")
    parser.add_argument("--use-agnes", action="store_true",
                        help="Use Agnes API for extraction (requires AGNES_API_KEY)")
    parser.add_argument("--no-jev", action="store_true",
                        help="Skip Jev API call")
    args = parser.parse_args()
    
    # Load contracts
    contracts = load_synthetic_contracts(args.contracts)
    print(f"Loaded {len(contracts)} contracts")
    
    # Run pipeline
    results = run_pipeline(
        contracts,
        use_agnes=args.use_agnes,
        use_jev=not args.no_jev,
    )
    
    # Save results
    save_results(results, args.output)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"Pipeline complete: {len(results)} contracts processed")
    print(f"Output: {args.output}")
    print(f"{'='*60}")
