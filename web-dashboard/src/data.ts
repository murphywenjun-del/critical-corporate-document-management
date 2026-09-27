export const contracts: ContractResult[] = [
  {
    contract_name: "Contract_1_NDA", contract_num: 1, document_type: "NDA",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 0,
    rules_risk_level: "Low", rules_risk_score: 1.0,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "medium", confidence: 0.48, probabilities: { low: 0.03, medium: 0.61, high: 0.36, critical: 0.0 } },
      needs_human_review: { type: "noul", noul: 0.35 },
      is_compliance_related: { type: "noul", noul: 0.99 },
      should_alert: { type: "noul", noul: 0.55 },
      decision_confidence: { type: "score", score: 2.19, confidence: 0.63 }
    }},
    timestamp: "2026-09-26T19:00:34"
  },
  {
    contract_name: "Contract_2_MOU", contract_num: 2, document_type: "MOU",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 3,
    rules_risk_level: "Critical", rules_risk_score: 4.7,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "high", confidence: 0.57, probabilities: { low: 0.03, high: 0.67, medium: 0.27, critical: 0.02 } },
      needs_human_review: { type: "noul", noul: 0.49 },
      is_compliance_related: { type: "noul", noul: 0.96 },
      should_alert: { type: "noul", noul: 0.68 },
      decision_confidence: { type: "score", score: 2.16, confidence: 0.55 }
    }},
    timestamp: "2026-09-26T19:00:35"
  },
  {
    contract_name: "Contract_3_Procurement", contract_num: 3, document_type: "Procurement",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 3,
    rules_risk_level: "Critical", rules_risk_score: 4.1,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "high", confidence: 0.68, probabilities: { low: 0.0, high: 0.77, medium: 0.23, critical: 0.0 } },
      needs_human_review: { type: "noul", noul: 0.58 },
      is_compliance_related: { type: "noul", noul: 0.99 },
      should_alert: { type: "noul", noul: 0.78 },
      decision_confidence: { type: "score", score: 1.97, confidence: 0.73 }
    }},
    timestamp: "2026-09-26T19:00:35"
  },
  {
    contract_name: "Contract_4_DataSharing", contract_num: 4, document_type: "Data_Sharing",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 7,
    rules_risk_level: "Critical", rules_risk_score: 5.0,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "critical", confidence: 0.62, probabilities: { medium: 0.03, high: 0.25, critical: 0.71, low: 0.01 } },
      needs_human_review: { type: "noul", noul: 0.66 },
      is_compliance_related: { type: "noul", noul: 0.96 },
      should_alert: { type: "noul", noul: 0.78 },
      decision_confidence: { type: "score", score: 2.32, confidence: 0.39 }
    }},
    timestamp: "2026-09-26T19:00:36"
  },
  {
    contract_name: "Contract_5_NDA", contract_num: 5, document_type: "NDA",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 4,
    rules_risk_level: "Critical", rules_risk_score: 4.6,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "critical", confidence: 0.52, probabilities: { critical: 0.64, high: 0.26, low: 0.02, medium: 0.08 } },
      needs_human_review: { type: "noul", noul: 0.47 },
      is_compliance_related: { type: "noul", noul: 0.78 },
      should_alert: { type: "noul", noul: 0.78 },
      decision_confidence: { type: "score", score: 2.74, confidence: 0.72 }
    }},
    timestamp: "2026-09-26T19:00:37"
  },
  {
    contract_name: "Contract_6_Procurement", contract_num: 6, document_type: "Procurement",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 2,
    rules_risk_level: "Critical", rules_risk_score: 4.2,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "critical", confidence: 0.33, probabilities: { high: 0.46, low: 0.0, critical: 0.5, medium: 0.04 } },
      needs_human_review: { type: "noul", noul: 0.57 },
      is_compliance_related: { type: "noul", noul: 0.24 },
      should_alert: { type: "noul", noul: 0.77 },
      decision_confidence: { type: "score", score: 2.57, confidence: 0.63 }
    }},
    timestamp: "2026-09-26T19:00:37"
  },
  {
    contract_name: "Contract_7_MOU", contract_num: 7, document_type: "MOU",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 5,
    rules_risk_level: "Critical", rules_risk_score: 4.6,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "critical", confidence: 0.54, probabilities: { low: 0.0, critical: 0.66, medium: 0.02, high: 0.32 } },
      needs_human_review: { type: "noul", noul: 0.80 },
      is_compliance_related: { type: "noul", noul: 0.83 },
      should_alert: { type: "noul", noul: 0.87 },
      decision_confidence: { type: "score", score: 1.66, confidence: 0.40 }
    }},
    timestamp: "2026-09-26T19:00:38"
  },
  {
    contract_name: "Contract_8_Procurement", contract_num: 8, document_type: "Procurement",
    extraction_method: "rules", agnes_ok: true, rules_flags_count: 6,
    rules_risk_level: "Critical", rules_risk_score: 5.0,
    jeV_result: { model: "jev-1.13.0", answers: {
      risk_severity: { type: "choice", choice: "high", confidence: 0.86, probabilities: { high: 0.89, medium: 0.01, low: 0.0, critical: 0.1 } },
      needs_human_review: { type: "noul", noul: 0.90 },
      is_compliance_related: { type: "noul", noul: 0.86 },
      should_alert: { type: "noul", noul: 0.91 },
      decision_confidence: { type: "score", score: 0.0, confidence: 1.0 }
    }},
    timestamp: "2026-09-26T19:00:39"
  }
]

export const flagsByContract: Record<string, Array<{ severity: string; field: string; flag_if: string }>> = {
  "Contract_1_NDA": [],
  "Contract_2_MOU": [
    { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found" },
    { severity: "High", field: "expiry_date", flag_if: "Contract expired 119 days ago" },
    { severity: "High", field: "binding_language", flag_if: "Both binding and non-binding language present" }
  ],
  "Contract_3_Procurement": [
    { severity: "High", field: "expiry_date", flag_if: "Contract expired 270 days ago" },
    { severity: "High", field: "indemnity_cap", flag_if: "Indemnity clause has no monetary cap" },
    { severity: "Medium", field: "termination_conv", flag_if: "Convenience termination notice period of 90 days is excessive" }
  ],
  "Contract_4_DataSharing": [
    { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found" },
    { severity: "Critical", field: "phia_compliance", flag_if: "Missing PHIPA compliance declaration" },
    { severity: "High", field: "purpose_limitation", flag_if: "Data use purpose too broad or unrestricted" },
    { severity: "High", field: "breach_timeline", flag_if: "Missing breach notification timeline" },
    { severity: "High", field: "security_standards", flag_if: "Missing security standards or below NCSG" },
    { severity: "Medium", field: "audit_rights", flag_if: "Missing audit rights clause" },
    { severity: "Medium", field: "data_minimization", flag_if: "Missing data minimization principle" }
  ],
  "Contract_5_NDA": [
    { severity: "High", field: "expiry_date", flag_if: "Contract expired 956 days ago" },
    { severity: "Critical", field: "phia_compliance", flag_if: "Involves health information but no PHIPA declaration" },
    { severity: "High", field: "breach_notification", flag_if: "Missing breach notification requirement" },
    { severity: "Medium", field: "return_destruction", flag_if: "Missing return or destruction clause" }
  ],
  "Contract_6_Procurement": [
    { severity: "High", field: "expiry_date", flag_if: "Contract expired 545 days ago" },
    { severity: "High", field: "indemnity_clause", flag_if: "Missing indemnity clause entirely" }
  ],
  "Contract_7_MOU": [
    { severity: "High", field: "expiry_date", flag_if: "Contract expired 423 days ago" },
    { severity: "High", field: "binding_language", flag_if: "Both binding and non-binding language present" },
    { severity: "Medium", field: "termination_clause", flag_if: "Missing termination clause" },
    { severity: "High", field: "duplicate_version", flag_if: "Multiple versions detected — possible duplicate or conflict" },
    { severity: "High", field: "conflicting_finance", flag_if: "Conflicting amounts for same financial tag: $100,000 vs $150,000" }
  ],
  "Contract_8_Procurement": [
    { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found" },
    { severity: "High", field: "effective_date", flag_if: "Missing effective date" },
    { severity: "Medium", field: "expiry_date", flag_if: "Missing expiry date" },
    { severity: "High", field: "indemnity_cap", flag_if: "Indemnity clause has no monetary cap" },
    { severity: "Medium", field: "ocr_quality", flag_if: "Low-quality scan — key fields illegible" },
    { severity: "Critical", field: "missing_fields", flag_if: "Cannot verify key clauses due to scan quality" }
  ]
}
