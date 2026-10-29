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
# Cloud LLM APIs are DISABLED by default — hard constraint: the prototype runs
# with no cloud. Any LLM capability is served by local Ollama (127.0.0.1:11434).
# Cloud providers are opt-in only, via explicit CCDM_* env vars (never read the
# generic AGNES/TYPESAFE keys that may exist in the environment).
AGNES_API_KEY = os.environ.get("CCDM_AGNES_API_KEY", "")
AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1/chat/completions"
AGNES_MODEL = "agnes-2.5-flash"
JEV_API_KEY = os.environ.get("CCDM_JEV_API_KEY", "")
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
    text = ""
    ext = Path(file_path).suffix.lower()
    if ext in {".txt", ".md", ".csv", ".json"}:
        # Plain text: read directly, no OCR needed
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except:
            pass
    elif ext in {".docx", ".doc"}:
        # DOCX: extract text via python-docx
        try:
            from docx import Document
            doc = Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            print(f"  DOCX extraction error: {e}")
            text = ""
    elif ext == ".pdf":
        # PDF: local text-layer extraction (pypdf). No OCR — scanned PDFs have
        # no text layer and will fall through to the plain-text attempt below.
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
            # pypdf can emit control chars (e.g. \x01) as word separators — normalize
            text = re.sub(r"[\x00-\x08\x0b-\x1f]", " ", text)
        except Exception as e:
            print(f"  PDF extraction error: {e}")
            text = ""
    else:
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
            # Final fallback for any readable file
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except:
                pass
    
    if not text or len(text.strip()) < 50:
        return {"error": "Could not extract text from document "
                         "(scanned PDFs / image files need OCR, which is a cloud service — "
                         "upload a text-layer PDF, .docx, .txt or .md instead)", "filename": filename}
    
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
        "text": text,  # full extracted text — lets the local LLM extraction see the whole document
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
    return {"status": "ok", "results_count": len(list(RESULTS_DIR.glob("*.json")))}

@app.get("/api/results")
def get_results():
    return JSONResponse(load_all_results())

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), use_agnes: bool = True):
    """Upload a contract file (PDF, image, DOCX) and run risk analysis."""
    ext = Path(file.filename or "unknown").suffix.lower()
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
            ext = Path(file.filename or "unknown").suffix.lower()
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
        "total_results": len(list(RESULTS_DIR.glob("*.json"))),
        "supported_formats": [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".docx", ".txt"],
    }

# ── Smart Filing: folder tree + auto-file ───────────────────────────────────
ARCHIVE_DIR = BASE_DIR / "web-dashboard" / "data" / "archive"

@app.get("/api/folder-tree")
def get_folder_tree():
    """Return the real on-disk folder structure with files."""
    tree = {}
    if not ARCHIVE_DIR.exists():
        return {"root": "data/archive", "categories": tree}
    for cat_dir in sorted(ARCHIVE_DIR.iterdir()):
        if not cat_dir.is_dir():
            continue
        cat_files = sorted([f.name for f in cat_dir.iterdir() if f.is_file()])
        sub_dir = {}
        for sub in sorted(cat_dir.iterdir()):
            if sub.is_dir():
                sub_files = sorted([f.name for f in sub.iterdir() if f.is_file()])
                sub_dir[sub.name] = sub_files
        tree[cat_dir.name] = {"files": cat_files, "subcategories": sub_dir}
    return {"root": "data/archive", "categories": tree}


@app.get("/api/search")
def search_docs(q: str, limit: int = 30):
    """Full-text search over the real on-disk archive (data/archive/**).

    Indexes .md / .txt / .csv / .json as text and .docx / .doc via python-docx.
    Returns matching files with category path, first-match snippet, and size.
    Falls back to research/contracts if the archive is empty.
    """
    q = q.strip()
    if len(q) < 2:
        return {"query": q, "count": 0, "results": []}
    needle = q.lower()
    dirs = [d for d in [ARCHIVE_DIR, BASE_DIR / "web-dashboard" / "public" / "research" / "contracts"] if d.exists()]
    results = []
    allowed = {".md", ".txt", ".csv", ".json", ".docx", ".doc", ".pdf"}

    def read_text(f: Path) -> str:
        ext = f.suffix.lower()
        try:
            if ext in {".txt", ".md", ".csv", ".json"}:
                return f.read_text(encoding="utf-8", errors="ignore")
            if ext in {".docx", ".doc"}:
                from docx import Document
                doc = Document(str(f))
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            if ext == ".pdf":
                from pypdf import PdfReader
                t = "\n".join((p.extract_text() or "") for p in PdfReader(str(f)).pages)
                return re.sub(r"[\x00-\x08\x0b-\x1f]", " ", t)
        except Exception:
            return ""
        return ""

    for base in dirs:
        for f in sorted(base.rglob("*")):
            if not f.is_file() or f.suffix.lower() not in allowed:
                continue
            try:
                text = read_text(f)
            except Exception:
                continue
            if not text:
                continue
            idx = text.lower().find(needle)
            if idx < 0:
                continue
            start = max(0, idx - 60)
            snippet = ("…" if start > 0 else "") + text[start:idx + len(needle) + 60].replace("\n", " ").strip() + "…"
            try:
                rel = f.relative_to(base).as_posix()
            except ValueError:
                rel = f.name
            results.append({
                "file": f.name,
                "path": rel,
                "snippet": snippet,
                "size_bytes": f.stat().st_size,
                "source": "archive" if base == ARCHIVE_DIR else "research",
            })
            if len(results) >= limit:
                break
        if len(results) >= limit:
            break
    results = results[:limit]
    return {"query": q, "count": len(results), "results": results}

@app.post("/api/file-doc")
def file_doc(filename: str, category: str, subcategory: str = "General"):
    """Move an uploaded file into the correct archive folder on disk."""
    # Find the file in uploads/
    safe_name = re.sub(r'[^\w\-.]', '_', filename)
    # Search in uploads dir
    found = None
    for f in (BASE_DIR / "web-dashboard" / "uploads").glob(f"*{safe_name}*"):
        found = f
        break
    if not found:
        # Also check if already in archive
        for f in ARCHIVE_DIR.rglob(safe_name):
            return {"status": "already_filed", "path": str(f.relative_to(BASE_DIR))}
    if not found:
        return {"error": f"File not found: {filename}"}

    # Build target path
    target_dir = ARCHIVE_DIR / category / subcategory
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / found.name

    # Move the file
    import shutil
    shutil.move(str(found), str(target_path))

    return {
        "status": "filed",
        "filename": found.name,
        "category": category,
        "subcategory": subcategory,
        "path": f"data/archive/{category}/{subcategory}/{found.name}",
    }

# Field → (client category, risk name). Mirrors FLAG_TO_HIROC in src/data.ts — keep in sync.
SOUTHLAKE_FLAG_MAP = {
    "signatories": ("Leadership", "Governance"),
    "expiry_date": ("Financial", "Contracts"),
    "effective_date": ("Financial", "Contracts"),
    "binding_language": ("Financial", "Contracts"),
    "termination_conv": ("Financial", "Contracts"),
    "termination_clause": ("Financial", "Contracts"),
    "auto_renewal": ("Financial", "Contracts"),
    "conflicting_finance": ("Financial", "Costs"),
    "indemnity_cap": ("Financial", "Fines/liabilities"),
    "indemnity_clause": ("Financial", "Fines/liabilities"),
    "phia_compliance": ("Regulatory", "Privacy"),
    "purpose_limitation": ("Regulatory", "Privacy"),
    "data_minimization": ("Regulatory", "Privacy"),
    "governing_law": ("Regulatory", "Regulatory/legislation"),
    "breach_timeline": ("Information Management/Technology", "Breach/loss of information"),
    "breach_notification": ("Information Management/Technology", "Breach/loss of information"),
    "security_standards": ("Information Management/Technology", "Systems/technology needs"),
    "audit_rights": ("Information Management/Technology", "Records management"),
    "return_destruction": ("Information Management/Technology", "Records management"),
    "duplicate_version": ("Information Management/Technology", "Records management"),
    "missing_fields": ("Information Management/Technology", "Records management"),
    "ocr_quality": ("Information Management/Technology", "Systems/technology failure"),
}

# ── Local LLM (Ollama) — hard constraint: no cloud, all AI runs locally ─────
# Default engine: gemma3:1b (~14 tok/s on this machine). llama3.1:latest (4.6GB)
# is not viable on 8GB RAM; set OLLAMA_MODEL=llama3.1:latest to prefer it —
# requests automatically fall back to gemma3:1b when the primary model times out.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma3:1b")
OLLAMA_FALLBACK_MODEL = "gemma3:1b"


def ollama_chat(messages, temperature=0.2, timeout=90, fmt=None, model=None):
    """Call a local Ollama model. Raises if the server is unreachable or times out."""
    payload = {"model": model or OLLAMA_MODEL, "messages": messages, "stream": False,
               "options": {"temperature": temperature}}
    if fmt:
        payload["format"] = fmt
    req = urllib.request.Request(OLLAMA_URL + "/api/chat",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def ollama_chat_fallback(messages, temperature=0.2, timeout=90, fmt=None):
    """ollama_chat with automatic fallback to gemma3:1b when the primary model fails.

    Returns (response_dict, model_used).
    """
    try:
        return ollama_chat(messages, temperature=temperature, timeout=timeout, fmt=fmt), OLLAMA_MODEL
    except Exception:
        if OLLAMA_MODEL != OLLAMA_FALLBACK_MODEL:
            out = ollama_chat(messages, temperature=temperature, timeout=timeout,
                              fmt=fmt, model=OLLAMA_FALLBACK_MODEL)
            return out, OLLAMA_FALLBACK_MODEL + " (fallback)"
        raise


def ollama_extract(text: str) -> Optional[Dict]:
    """LLM extraction of structured contract fields (local Ollama, with model fallback)."""
    user = (
        "Extract structured data from this contract text. Respond with STRICT JSON only, "
        "no prose, matching exactly: {\"document_type\": one of [\"NDA\",\"CDA\",\"MOU\","
        "\"Procurement\",\"Data_Sharing\",\"Clinical_Trial\",\"Other\"], "
        "\"parties\": [\"name\", ...], \"vp_signature_count\": integer or null, "
        "\"has_phipa_clause\": boolean, \"has_indemnity\": boolean, "
        "\"breach_notification_hours\": integer or null, "
        "\"missing_clauses\": [\"clause name\", ...]}.\n\n"
        "TEXT (first 6000 chars):\n" + text[:6000]
    )
    out, _ = ollama_chat_fallback([
        {"role": "system", "content": "You are a precise contract-data extractor. Output strict JSON only."},
        {"role": "user", "content": user},
    ], temperature=0.0, timeout=120, fmt="json")
    return json.loads(out["message"]["content"])


@app.post("/api/llm-compare")
def llm_compare(payload: dict):
    """LLM clause review of an incoming document vs a reference (local Ollama).

    Body: { incoming: {num, name, type, fields, flags}, ref: {label, fields}, diffs: [...] }
    Returns { ok, model, data: {summary, key_findings, review_focus} } — ok:false when
    the local engine is unavailable, so the UI can degrade to deterministic analysis.
    """
    try:
        inc = payload.get("incoming", {})
        ref = payload.get("ref", {})
        diffs = payload.get("diffs", [])
        prompt = (
            "Compare the incoming document's clauses against the reference and identify "
            "where the deviations matter to Legal review. Respond with STRICT JSON only: "
            "{\"summary\": one-paragraph assessment, \"key_findings\": [3-5 short findings], "
            "\"review_focus\": [2-4 specific clauses for the reviewer to check]}.\n\n"
            "INCOMING (" + str(inc.get("name", "")) + ", type " + str(inc.get("type", "")) + "):\n"
            + json.dumps({"fields": inc.get("fields", []), "flags": inc.get("flags", [])}, indent=1)[:4000] +
            "\n\nREFERENCE (" + str(ref.get("label", "")) + "):\n"
            + json.dumps(ref.get("fields", {}), indent=1)[:4000] +
            "\n\nCLAUSE DIFFS (status aligned/changed/missing):\n"
            + json.dumps(diffs[:10], indent=1)[:3000]
        )
        out, model_used = ollama_chat_fallback([
            {"role": "system", "content": "You are a contract-review assistant at Southlake Health. Be specific and conservative; flag real clause risks, not style."},
            {"role": "user", "content": prompt},
        ], temperature=0.2, timeout=120, fmt="json")
        data = json.loads(out["message"]["content"])
        return {"ok": True, "model": model_used,
                "data": {"summary": data.get("summary", ""), "key_findings": data.get("key_findings", []), "review_focus": data.get("review_focus", [])}}
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:200]})


@app.post("/api/ai-proposal")
def ai_proposal(payload: dict):
    """Local-LLM remediation draft for a flagged clause (Ollama, on this machine).

    Body: { flag_field, flag_if, doc_num, doc_name, doc_type, severity }
    Returns { ok, model, data: { proposal, rationale } } — ok:false when the
    local engine is unavailable or its output is unusable; the UI then falls
    back to its standard clause library (clearly labelled).
    """
    try:
        field = str(payload.get("flag_field", ""))[:120]
        flag_if = str(payload.get("flag_if", ""))[:400]
        doc = f"#{payload.get('doc_num', '')} {payload.get('doc_name', '')}".strip()
        doc_type = str(payload.get("doc_type", ""))
        severity = str(payload.get("severity", ""))
        purpose = str(payload.get("purpose", "remediation"))
        if purpose == "summary":
            prompt = (
                "You are the risk officer of a hospital's document-management program. "
                "Given the portfolio facts below, write a short executive summary (2-3 sentences): "
                "where risk is concentrated and what to do first. Then one top priority. "
                "Respond with STRICT JSON only: {\"summary\": 2-3 sentences, \"priority\": one sentence}. "
                f"\n\nPORTFOLIO FACTS (computed in real time from monitored contracts):\n{flag_if}"
            )
            sysp = "Hospital document-risk officer. Concise, factual, no invented numbers."
        else:
            prompt = (
                "You are a hospital contracts reviewer drafting a remediation proposal. "
                "For the flagged issue below, produce a short concrete proposal a legal team "
                "could put in the contract, plus one sentence on why it matters. "
                "Respond with STRICT JSON only: {\"proposal\": the clause text / action, \"rationale\": one sentence}. "
                "Keep the whole answer under 120 words.\n\n"
                f"Document: {doc} ({doc_type})\nSeverity: {severity}\nFlag: {field}\nIssue: {flag_if}"
            )
            sysp = "Contract-remediation assistant at Southlake Health. Practical, specific, conservative."
        out, model_used = ollama_chat_fallback([
            {"role": "system", "content": sysp},
            {"role": "user", "content": prompt},
        ], temperature=0.3, timeout=120, fmt="json")
        data = json.loads(out["message"]["content"])
        if purpose == "summary":
            summary = str(data.get("summary", "")).strip()
            if not summary:
                raise ValueError("empty summary")
            return {"ok": True, "model": model_used,
                    "data": {"proposal": summary, "rationale": str(data.get("priority", "")).strip()[:300]}}
        proposal = str(data.get("proposal", "")).strip()
        if not proposal:
            raise ValueError("empty proposal")
        return {"ok": True, "model": model_used,
                "data": {"proposal": proposal[:800], "rationale": str(data.get("rationale", "")).strip()[:300]}}
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:200]})


def retrieve_snippets(question: str, limit: int = 3):
    """RAG retrieval for /api/ai-chat: keyword-match the question against the
    on-disk archive + research docs and return up to `limit` short snippets.
    Purely local — same corpus and readers as /api/search.
    """
    STOP = {"the", "and", "for", "with", "what", "which", "where", "when",
            "how", "why", "are", "is", "can", "should", "would", "does",
            "doc", "docs", "document", "documents", "contract", "contracts",
            "please", "tell", "show", "list", "many", "much", "any", "about"}
    words = re.findall(r"[A-Za-z0-9\$%./-]{4,}", question.lower())
    kws = []
    for w in words:
        if w in STOP:
            continue
        if w not in kws:
            kws.append(w)
        if len(kws) >= 4:
            break
    if not kws:
        kws = words[:1] or [question.strip()[:20].lower()]

    dirs = [d for d in [ARCHIVE_DIR, BASE_DIR / "web-dashboard" / "public" / "research" / "contracts"] if d.exists()]
    allowed = {".md", ".txt", ".csv", ".json", ".docx", ".doc", ".pdf"}

    def read_text(f: Path) -> str:
        ext = f.suffix.lower()
        try:
            if ext in {".txt", ".md", ".csv", ".json"}:
                return f.read_text(encoding="utf-8", errors="ignore")
            if ext in {".docx", ".doc"}:
                from docx import Document
                doc = Document(str(f))
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            if ext == ".pdf":
                from pypdf import PdfReader
                t = "\n".join((p.extract_text() or "") for p in PdfReader(str(f)).pages)
                return re.sub(r"[\x00-\x08\x0b-\x1f]", " ", t)
        except Exception:
            return ""
        return ""

    hits: List[Dict] = []
    seen: set = set()
    # one pass per keyword; rank files by how many distinct keywords they hit
    scored: Dict[str, int] = {}
    texts: Dict[str, tuple] = {}
    for base in dirs:
        for f in sorted(base.rglob("*")):
            if not f.is_file() or f.suffix.lower() not in allowed:
                continue
            text = read_text(f)
            if not text:
                continue
            tl = text.lower()
            n_hit = sum(1 for k in kws if k in tl)
            if n_hit == 0:
                continue
            key = f.as_posix()
            scored[key] = scored.get(key, 0) + n_hit
            texts[key] = (text, base, f)
    for key in sorted(scored, key=scored.get, reverse=True)[:limit]:
        text, base, f = texts[key]
        first = next(k for k in kws if k in text.lower())
        idx = text.lower().find(first)
        start = max(0, idx - 60)
        snippet = ("…" if start > 0 else "") + text[start:idx + len(first) + 240].replace("\n", " ").strip() + "…"
        try:
            rel = f.relative_to(base).as_posix()
        except ValueError:
            rel = f.name
        hits.append({"path": rel, "score": scored[key], "snippet": snippet[:400]})
    return hits


@app.post("/api/ai-chat")
def ai_chat(payload: dict):
    """Local-LLM chat copilot for the dashboard (Ollama on this machine, no cloud).

    Body: { message, context, history: [{role, content}...] }
    RAG context = app state snapshot sent by the UI + on-disk archive snippets
    matched against the question. Returns { ok, model, ms, answer, sources }.
    ok:false when the local engine is unavailable — the UI says so and never
    falls back to a cloud provider.
    """
    t0 = time.time()
    try:
        message = str(payload.get("message", "")).strip()[:500]
        context = str(payload.get("context", "")).strip()[:2400]
        history = payload.get("history", [])[-3:]
        if not message:
            return JSONResponse({"ok": False, "error": "empty message"}, status_code=400)

        snippets = retrieve_snippets(message, limit=3)
        rag = ""
        if snippets:
            rag = "\n\nRELEVANT EXCERPTS FROM THE ON-DISK ARCHIVE (cite the file path):\n" + "\n".join(
                f"- {s['path']}: {s['snippet']}" for s in snippets
            )

        msgs = [{"role": "system", "content": (
            "You are the CCDM compliance copilot at Southlake Health, a hospital. "
            "You answer questions about the document portfolio, flags, retention rules and policies "
            "using ONLY the context below. Be concise (under 150 words), concrete, and cite document "
            "numbers (#n) or file paths when they help. If the context does not contain the answer, "
            "say so plainly — do not invent facts or numbers."        )}]
        for h in history:
            role = "assistant" if str(h.get("role", "")) == "assistant" else "user"
            msgs.append({"role": role, "content": str(h.get("content", ""))[:400]})
        msgs.append({"role": "user", "content": (
            f"APP STATE SNAPSHOT (live):\n{context}\n{rag}\n\nQUESTION: {message}"
        )})
        out, model_used = ollama_chat_fallback(msgs, temperature=0.2, timeout=150)
        answer = (out.get("message", {}).get("content") or "").strip()
        if not answer:
            raise ValueError("empty LLM answer")
        return {
            "ok": True, "model": model_used, "ms": int((time.time() - t0) * 1000),
            "answer": answer[:900],
            "sources": [s["path"] for s in snippets],
        }
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:200]})


@app.post("/api/classify-and-file")
async def classify_and_file(files: List[UploadFile] = File(...)):
    """Upload files, run AI classification, and auto-file into the correct folder."""
    results = []
    for file in files:
        try:
            ext = Path(file.filename or "unknown").suffix.lower()
            if ext not in {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".docx", ".doc", ".txt", ".md"}:
                results.append({"filename": file.filename, "error": f"Unsupported: {ext}"})
                continue

            # Save temporarily
            save_path = UPLOADS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            content = await file.read()
            with open(save_path, "wb") as f:
                f.write(content)

            # Process (OCR + rules)
            result = process_file(str(save_path))
            if "error" in result:
                results.append({"filename": file.filename, "error": result["error"]})
                continue

            # Local LLM extraction (Ollama) augments the rules engine; degrades to rules-only when offline
            engine = "rules"
            try:
                llm = ollama_extract(result.get("text", result.get("text_preview", "")))
                if llm:
                    engine = "ollama+rules"
                    if llm.get("document_type") in {"NDA", "CDA", "MOU", "Procurement", "Data_Sharing", "Clinical_Trial", "Other"}:
                        result["document_type"] = llm["document_type"]
                    for mc in (llm.get("missing_clauses") or [])[:3]:
                        result.setdefault("flags", []).append({
                            "severity": "Medium", "field": "missing_fields",
                            "flag_if": f"LLM extraction: expected clause not found — {mc}",
                        })
            except Exception:
                pass
            result["engine"] = engine

            # Determine folder: client 12-category Southlake/HIROC taxonomy (from top flag's field)
            flags = result.get("flags", [])
            if flags:
                top_flag = flags[0]
                m = SOUTHLAKE_FLAG_MAP.get(top_flag.get("field", ""), None)
                category = m[0] if m else top_flag.get("risk_category", "Uncategorized")
            else:
                category = "Clean"

            # Subcategory = document type (what the AI detected)
            doc_type = result.get("document_type", "Other")
            # Sanitize for folder name
            subcategory = re.sub(r'[^a-zA-Z0-9_ ]', '_', doc_type)

            # Normalize category (client's 12 categories + Clean + Uncategorized)
            valid_cats = {"Care", "Human Resources", "Financial", "Leadership",
                         "Information Management/Technology", "Facilities", "Regulatory",
                         "External Relations", "Regulation - Professional", "Teaching",
                         "Research", "Community Health", "Clean", "Uncategorized"}
            if category not in valid_cats:
                category = "Uncategorized"

            # File it
            target_dir = ARCHIVE_DIR / category / subcategory
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / save_path.name
            import shutil
            shutil.move(str(save_path), str(target_path))

            result["filed_to"] = f"data/archive/{category}/{subcategory}/{save_path.name}"
            results.append(result)
        except Exception as e:
            results.append({"filename": file.filename, "error": str(e)})

    return JSONResponse({"uploaded": len(results), "results": results})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
