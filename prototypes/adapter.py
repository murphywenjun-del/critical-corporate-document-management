# Adapter: Agnes output → test_framework.py input
## Bridges the gap between Agnes structured extraction and the rules engine
## Usage: from adapter import agnes_to_framework_fields
##        fields = agnes_to_framework_fields(agnes_result)
##        analyzer.analyze(fields["text"], fields["doc_type"])

import sys
from pathlib import Path
from typing import Dict, Optional

# Add prototypes to path
sys.path.insert(0, str(Path(__file__).parent))
from test_framework import ContractAnalyzer


def agnes_to_framework_fields(agnes_result: Dict) -> Dict:
    """
    Convert Agnes extraction result into format compatible with ContractAnalyzer.
    
    Args:
        agnes_result: dict from agnes_ocr.extract_contract_text()
    
    Returns:
        dict with keys: "text", "doc_type", "fields_override"
    """
    doc_type = agnes_result.get("document_type", "Other")
    
    # Map Agnes types to framework types
    type_map = {
        "NDA": "NDA",
        "MOU": "MOU",
        "Procurement": "Procurement",
        "Data_Sharing": "Data_Sharing",
        "Policy": "Procurement",  # default to procurement for unknown types
        "Other": "Procurement",
    }
    framework_type = type_map.get(doc_type, "Procurement")
    
    # Build override dict for fields that Agnes extracted
    fields_override = {}
    
    if agnes_result.get("effective_date"):
        fields_override["effective_date"] = agnes_result["effective_date"]
    if agnes_result.get("expiry_date"):
        fields_override["expiry_date"] = agnes_result["expiry_date"]
    if agnes_result.get("vp_signature_count") is not None:
        fields_override["vp_count"] = agnes_result["vp_signature_count"]
    
    # Boolean flags from Agnes
    bool_flags = {
        "has_phipa_clause": "has_phipa",
        "has_indemnity": "has_indemnity",
        "has_slas": "has_sla",
        "has_data_security": "has_data_sec",
        "has_audit_rights": "has_audit",
        "has_return_destruction": "has_return_dest",
        "auto_renewal": "has_renewal",
    }
    for agnes_key, fw_key in bool_flags.items():
        if agnes_result.get(agnes_key) is not None:
            fields_override[fw_key] = agnes_result[agnes_key]
    
    # Numeric fields
    if agnes_result.get("breach_hours") is not None:
        fields_override["breach_hours"] = agnes_result["breach_hours"]
    if agnes_result.get("termination_days") is not None:
        fields_override["termination_days"] = agnes_result["termination_days"]
    if agnes_result.get("renewal_notice_days") is not None:
        fields_override["renewal_notice_days"] = agnes_result["renewal_notice_days"]
    
    # Indemnity cap - special handling
    ind_cap = agnes_result.get("indemnity_cap")
    if ind_cap is not None:
        fields_override["indemnity_has_cap"] = ind_cap
    
    return {
        "text": "",  # placeholder — actual text needs to be reconstructed or passed separately
        "doc_type": framework_type,
        "fields_override": fields_override,
        "confidence": agnes_result.get("confidence", 0.8),
        "key_clauses": agnes_result.get("key_clauses", []),
    }


def run_pipeline(agnes_result: Dict) -> Dict:
    """
    Full pipeline: Agnes result → rules engine → risk findings.
    
    This is the main entry point for the hybrid architecture.
    """
    adapter = agnes_to_framework_fields(agnes_result)
    
    # For now, we need the original text to run the rules engine
    # In production, store the original text alongside agnes_result
    analyzer = ContractAnalyzer()
    
    # Note: analyzer.analyze() needs the raw text. 
    # The adapter provides fields_override which can be merged.
    # For testing, we'll run analyze() on a placeholder text
    # and then override the fields.
    
    return {
        "adapter": adapter,
        "analyzer": analyzer,
        "status": "ready",
        "message": "Call analyzer.analyze(text, doc_type) with the original contract text",
    }


# ============================================================================
# 测试：用虚构合同验证 adapter
# ============================================================================

def test_adapter():
    """Test that the adapter properly maps Agnes output to framework fields."""
    # Simulated Agnes output for Contract 1 (NDA, compliant)
    mock_agnes = {
        "document_type": "NDA",
        "parties": ["SOUTHLAKE HEALTH", "COMMUNITY CARE PARTNERS INC."],
        "effective_date": "2024-03-15",
        "expiry_date": "2029-03-15",
        "vp_signature_count": 2,
        "has_phipa_clause": True,
        "has_indemnity": False,
        "indemnity_has_cap": None,
        "has_slas": False,
        "breach_notification_hours": 48,
        "termination_notice_days": 60,
        "auto_renewal": False,
        "renewal_notice_days": None,
        "has_data_security": False,
        "has_audit_rights": False,
        "has_return_destruction": True,
        "ocr_quality": "Good",
        "confidence": 0.95,
    }
    
    result = agnes_to_framework_fields(mock_agnes)
    print("Adapter test (Contract 1 NDA):")
    print(f"  doc_type: {result['doc_type']}")
    print(f"  vp_count: {result['fields_override'].get('vp_count')}")
    print(f"  has_phipa: {result['fields_override'].get('has_phipa')}")
    print(f"  has_return_dest: {result['fields_override'].get('has_return_dest')}")
    print(f"  effective_date: {result['fields_override'].get('effective_date')}")
    print(f"  expiry_date: {result['fields_override'].get('expiry_date')}")
    print(f"  confidence: {result['confidence']}")
    print()
    
    # Verify
    assert result["doc_type"] == "NDA"
    assert result["fields_override"]["vp_count"] == 2
    assert result["fields_override"]["has_phipa"] == True
    assert result["fields_override"]["has_return_dest"] == True
    print("✅ Adapter test passed!")


if __name__ == "__main__":
    test_adapter()
