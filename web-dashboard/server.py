"""
Southlake Document Risk Dashboard — Upload Server
Accepts PDF/image/DOCX uploads, runs Agnes OCR → Rules Engine → Jev pipeline.
Usage: uvicorn server:app --reload --port 8000
"""

import json
import os
import re
import sys
import time
import base64
import ssl
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
PROTOTYPES_DIR = BASE_DIR / "prototypes"
UPLOADS_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "web-dashboard" / "data" / "results"
UPLOADS_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

sys.path.insert(0, str(PROTOTYPES_DIR))

# ── Load existing results ────────────────────────────────────────────────────
def load_all_results() -> List[Dict]:
    results = []
    for f in sorted(RESULTS_DIR.glob("*.json")):
        try:
            with open(f) as fp:
                results.append(json.load(fp))
        except Exception:
            pass
    return results

# ── Config ───────────────────────────────────────────────────────────────────
AGNES_API_KEY = os.environ.get("AGNES_API_KEY", "")
AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1/chat/completions"
AGNES_MODEL = "agnes-2.5-flash"
JEV_API_KEY = os.environ.get("TYPESAFE_API_KEY", "")
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
            _ssl_ctx = ssl.create_default_context()
            _ssl_ctx.check_hostname = False
            _ssl_ctx.verify_mode = ssl.CERT_NONE
    return _ssl_ctx

# ── Agnes OCR ────────────────────────────────────────────────────────────────
def agnes_ocr(file_path: str) -> str:
    """Extract text from PDF/image using Agnes multimodal model."""
    if not AGNES_API_KEY:
        raise ValueError("AGNES_API_KEY not set")
    
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        # Use pdfplumber to extract text from PDF first, fall back to Agnes
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        if text_parts:
            return "\n\n".join(text_parts)
        # If pdfplumber fails (scanned PDF), use Agnes
        pass
    
    # For images or unreadable PDFs, use Agnes vision
    with open(file_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".tiff": "image/tiff", ".webp": "image/webp"}
    mime = mime_map.get(ext, "application/octet-stream")
    data_uri = f"data:{mime};base64,{b64}"
    
    prompt = """Extract ALL readable text from this document. Return ONLY the raw text content, preserving all sections, clauses, dates, names, and signatures exactly as they appear. Do not summarize."""
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {AGNES_API_KEY}"}
    payload = {"model": AGNES_MODEL, "messages": [{"role": "user", "content": [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": data_uri}}
    ]}], "max_tokens": 4096, "temperature": 0.1}
    
    req = urllib.request.Request(AGNES_BASE_URL, data=json.dumps(payload).encode(),
                                  headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120, context=_get_ssl_ctx()) as resp:
        result = json.loads(resp.read().decode())
    return result["choices"][0]["message"]["content"]


def agnes_extract_structured(contract_text: str) -> Dict:
    """Extract structured fields from contract text via Agnes."""
    if not AGNES_API_KEY:
        return {}
    prompt = f"""Extract structured information from this contract. Return ONLY valid JSON:
{{"document_type": "NDA|MOU|Procurement|Data_Sharing|Policy|Other",
 "parties": [], "effective_date": "YYYY-MM-DD or null",
 "expiry_date": "YYYY-MM-DD or null", "vp_signature_count": number,
 "has_phipa_clause": true/false, "has_indemnity": true/false,
 "indemnity_has_cap": true/false/null, "has_sla": true/false,
 "breach_notification_hours": number, "termination_notice_days": number,
 "auto_renewal": true/false, "renewal_notice_days": number,
 "has_data_security": true/false, "has_audit_rights": true/false,
 "has_return_destruction": true/false, "ocr_quality": "Good|Fair|Poor",
 "confidence": 0.0-1.0}}
Contract text:\n---\n{contract_text[:6000]}"""
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {AGNES_API_KEY}"}
    payload = {"model": AGNES_MODEL, "messages": [{"role": "user", "content": prompt}],
               "max_tokens": 1024, "temperature": 0.1}
    req = urllib.request.Request(AGNES_BASE_URL, data=json.dumps(payload).encode(),
                                  headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=60, context=_get_ssl_ctx()) as resp:
        result = json.loads(resp.read().decode())
    raw = result["choices"][0]["message"]["content"]
    m = re.search(r'\{.*\}', raw, re.DOTALL)
    return json.loads(m.group(0)) if m else {}


# ── Jev Decision ─────────────────────────────────────────────────────────────
def jev_risk_decision(extracted: Dict, text: str) -> Optional[Dict]:
    if not JEV_API_KEY:
        return None
    state = {
        "document_type": extracted.get("document_type", "Other"),
        "parties": extracted.get("parties", []),
        "effective_date": str(extracted.get("effective_date", "unknown")),
        "expiry_date": str(extracted.get("expiry_date", "unknown")),
        "vp_count": extracted.get("vp_signature_count", 0),
        "has_phipa": extracted.get("has_phipa_clause", False),
        "has_indemnity": extracted.get("has_indemnity", False),
        "indemnity_has_cap": extracted.get("indemnity_has_cap"),
        "has_sla": extracted.get("has_sla", False),
        "breach_hours": extracted.get("breach_notification_hours"),
        "termination_days": extracted.get("termination_notice_days"),
        "auto_renewal": extracted.get("auto_renewal", False),
        "has_data_security": extracted.get("has_data_security", False),
        "has_audit": extracted.get("has_audit_rights", False),
        "has_return_dest": extracted.get("has_return_destruction", False),
        "ocr_quality": extracted.get("ocr_quality", "Good"),
        "contract_summary": text[:2000] if len(text) > 2000 else text,
    }
    questions = {
        "risk_severity": {"type": "choice", "instructions": "Overall risk severity of this contract per Southlake Health policy?",
            "criteria": {"low": "No significant risks. All key clauses present.", "medium": "Minor gaps, some review needed.",
                "high": "Multiple risk indicators. Missing key clauses.", "critical": "Severe gaps: no PHIPA, unauthorized signatories, expired."}},
        "needs_human_review": {"type": "noul", "instructions": "Does this require immediate legal review?",
            "criteria": {"true": "Critical risks, missing VP signatures, expired, regulatory non-compliance.", "false": "Compliant or minor risks."}},
        "is_compliance_related": {"type": "noul", "instructions": "Is this related to PHIPA/FIPPA/data protection?",
            "criteria": {"true": "Involves health info, data sharing, privacy.", "false": "Purely operational/financial."}},
        "should_alert": {"type": "noul", "instructions": "Should this trigger an automated alert?",
            "criteria": {"true": "High/critical risk, expired, missing clauses.", "false": "Compliant, no action needed."}},
        "decision_confidence": {"type": "score", "instructions": "Confidence in this assessment?",
            "criteria": ["Very uncertain", "Uncertain", "Moderate", "Confident", "Very confident"]},
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {JEV_API_KEY}"}
    payload = {"model": JEV_MODEL, "state": state, "questions": questions}
    req = urllib.request.Request(JEV_BASE_URL, data=json.dumps(payload).encode(),
                                  headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=30, context=_get_ssl_ctx()) as resp:
        return json.loads(resp.read().decode())


# ── Rules Engine ─────────────────────────────────────────────────────────────
def run_rules_engine(text: str, doc_type: str) -> Dict:
    """Run rule-based analysis on extracted text."""
    from test_framework import ContractAnalyzer
    analyzer = ContractAnalyzer()
    result = analyzer.analyze(text, doc_type)
    return result


# ── Full Pipeline ────────────────────────────────────────────────────────────
def process_file(file_path: str, use_agnes: bool = True) -> Dict:
    filename = Path(file_path).name
    print(f"Processing: {filename}")
    
    # Step 1: OCR / text extraction
    try:
        text = agnes_ocr(file_path) if use_agnes else ""
        if not text or len(text.strip()) < 50:
            # Fallback: try plain text read
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except:
                pass
    except Exception as e:
        print(f"  OCR error: {e}")
        text = ""
    
    if not text or len(text.strip()) < 50:
        return {"error": "Could not extract text from document", "filename": filename}
    
    # Step 2: Structured extraction (Agnes or rules)
    if use_agnes and AGNES_API_KEY:
        try:
            extracted = agnes_extract_structured(text)
        except Exception as e:
            print(f"  Agnes extraction error: {e}")
            extracted = {}
    else:
        extracted = {}
    
    # Step 3: Rules engine
    doc_type = extracted.get("document_type", "Procurement")
    rule_result = run_rules_engine(text, doc_type)
    flags = rule_result.get("flags", [])
    risk_score = rule_result.get("risk_score", 0)
    risk_level = rule_result.get("risk_level", "Low")
    
    # Step 4: Jev decision
    jev_result = None
    if JEV_API_KEY:
        try:
            jev_result = jev_risk_decision(extracted, text)
        except Exception as e:
            print(f"  Jev error: {e}")
    
    # Compile
    result = {
        "filename": filename,
        "document_type": doc_type,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "flags_count": len(flags),
        "flags": flags,
        "extracted_fields": extracted,
        "jev_result": jev_result,
        "text_preview": text[:500],
        "timestamp": datetime.now().isoformat(),
        "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    # Save
    safe_name = re.sub(r'[^\w\-.]', '_', filename)
    out_path = RESULTS_DIR / f"{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"  Done: {risk_level} ({risk_score}) · {len(flags)} flags → {out_path}")
    return result


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Southlake Document Risk API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
def get_status():
    return {"status": "ok", "results_count": len(RESULTS_DIR.glob("*.json"))}

@app.get("/api/results")
def get_results():
    return JSONResponse(load_all_results())

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), use_agnes: bool = True):
    """Upload a contract file (PDF, image, DOCX) and run risk analysis."""
    ext = Path(file.filename).suffix.lower()
    allowed = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".docx", ".doc", ".txt"}
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}. Allowed: {', '.join(sorted(allowed))}")
    
    save_path = UPLOADS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)
    
    try:
        result = process_file(str(save_path), use_agnes=use_agnes)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/batch-upload")
async def batch_upload(files: List[UploadFile] = File(...)):
    """Upload multiple files at once."""
    results = []
    for file in files:
        try:
            ext = Path(file.filename).suffix.lower()
            if ext not in {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".docx", ".doc", ".txt"}:
                results.append({"filename": file.filename, "error": f"Unsupported type: {ext}"})
                continue
            save_path = UPLOADS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            content = await file.read()
            with open(save_path, "wb") as f:
                f.write(content)
            result = process_file(str(save_path))
            results.append(result)
        except Exception as e:
            results.append({"filename": file.filename, "error": str(e)})
    return JSONResponse({"uploaded": len(results), "results": results})

@app.delete("/api/results/{filename}")
def delete_result(filename: str):
    """Delete a processed result."""
    for f in RESULTS_DIR.glob(f"*{re.sub(r'[^\w]', '', filename)}*"):
        f.unlink()
    return {"deleted": str(f)}

@app.get("/api/config")
def get_config():
    return {
        "agnes_connected": bool(AGNES_API_KEY),
        "jev_connected": bool(JEV_API_KEY),
        "total_results": len(RESULTS_DIR.glob("*.json")),
        "supported_formats": [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".docx", ".txt"],
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
