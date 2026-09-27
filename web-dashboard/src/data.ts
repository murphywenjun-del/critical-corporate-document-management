// ── Types ───────────────────────────────────────────────────────────────────

interface Flag {
  severity: 'Critical' | 'High' | 'Medium'
  field: string
  flag_if: string
}

interface TextHighlight {
  text: string
  severity: 'Critical' | 'High' | 'Medium'
  reason: string
}

interface ContractDoc {
  num: number
  name: string
  displayName: string
  type: string
  summary: string
  filePath: string
  riskScore: number
  riskLevel: string
  flagsCount: number
  flags: Flag[]
  extractedFields: Array<{ label: string; value: string; status: '✓' | '✗' | '?' }>
  jev: JevData
  textHighlights: TextHighlight[]
}

interface JevData {
  riskSeverity: { choice: string; confidence: number }
  needsHumanReview: number
  isComplianceRelated: number
  shouldAlert: number
  decisionConfidence: number
}

// ── Data ────────────────────────────────────────────────────────────────────

export const contracts: ContractDoc[] = [
  {
    num: 1, name: "NDA_Standard_Compliant_2024", displayName: "NDA — Standard Compliant",
    type: "NDA",
    summary: "Clean mutual NDA with full PHIPA compliance, 2 VP signatures, 5-year term, well-defined confidential scope.",
    filePath: "research/contracts/01_NDA_Standard_Compliant_2024.md",
    riskScore: 1.0, riskLevel: "Low", flagsCount: 0, flags: [],
    textHighlights: [],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, Community Care Partners Inc.", status: "✓" },
      { label: "Effective Date", value: "March 15, 2024", status: "✓" },
      { label: "Expiry Date", value: "March 15, 2029 (5 years)", status: "✓" },
      { label: "VP Signatures", value: "2 (Maria Gonzalez VP Ops, James Chen VP Finance)", status: "✓" },
      { label: "PHIPA Compliance", value: "Yes — detailed clause in Section 3", status: "✓" },
      { label: "Breach Notification", value: "48 hours", status: "✓" },
      { label: "Return/Destruction", value: "Yes — 30-day window with certification", status: "✓" },
      { label: "Confidential Scope", value: "Well-defined with 4 categories", status: "✓" },
    ],
    jev: { riskSeverity: { choice: "medium", confidence: 0.48 }, needsHumanReview: 0.35, isComplianceRelated: 0.99, shouldAlert: 0.55, decisionConfidence: 2.19 },
  },
  {
    num: 2, name: "MOU_Missing_Second_Signature_2024", displayName: "MOU — Missing VP Signatures",
    type: "MOU",
    summary: "MOU with Executive Director & CMO signing (neither is VP). Mixed binding/non-binding language creates legal ambiguity.",
    filePath: "research/contracts/02_MOU_Missing_Second_Signature_2024.md",
    riskScore: 4.7, riskLevel: "Critical", flagsCount: 3, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found — signed by Executive Director & CMO" },
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 119 days ago (May 31, 2026)" },
      { severity: "High", field: "binding_language", flag_if: "Both binding and non-binding language present — creates legal ambiguity" },
    ],
    textHighlights: [], // Clean NDA — no risk terms
    extractedFields: [
      { label: "Parties", value: "Southlake Health, York Region Community Health Network", status: "✓" },
      { label: "Effective Date", value: "June 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "May 31, 2026", status: "✓" },
      { label: "VP Signatures", value: "0 — Robert Thompson (Exec Dir), Dr. Amanda Lee (CMO)", status: "✗" },
      { label: "Financial Cap", value: "$250,000/year", status: "✓" },
      { label: "Termination", value: "90 days written notice", status: "✓" },
      { label: "Binding Language", value: "Mixed — says not binding BUT has binding financial commitments", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.57 }, needsHumanReview: 0.49, isComplianceRelated: 0.96, shouldAlert: 0.68, decisionConfidence: 2.16 },
  },
  {
    num: 3, name: "Procurement_HealthIT_Service_Agreement_2023", displayName: "Procurement — HealthIT Service Agreement",
    type: "Procurement",
    summary: "EHR vendor agreement with unlimited indemnity, auto-increasing fees without cap, and 90-day convenience termination.",
    filePath: "research/contracts/03_Procurement_HealthIT_Service_Agreement_2023.md",
    riskScore: 4.1, riskLevel: "Critical", flagsCount: 3, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 270 days ago (Dec 31, 2025)" },
      { severity: "High", field: "indemnity_cap", flag_if: "Indemnity clause has no monetary cap" },
      { severity: "Medium", field: "termination_conv", flag_if: "Convenience termination notice period of 90 days is excessive (should be ≤60)" },
    ],
    textHighlights: [
      { text: "Robert Thompson", severity: "Critical", reason: "Signatory is Executive Director, not an authorized VP — contract cannot legally bind Southlake" },
      { text: "Executive Director", severity: "Critical", reason: "Only VPs are authorized to sign binding documents per Southlake policy" },
      { text: "Dr. Amanda Lee", severity: "Critical", reason: "Signatory is Chief Medical Officer, not an authorized VP — missing required second VP signature" },
      { text: "Chief Medical Officer", severity: "Critical", reason: "CMO is not on the authorized signatory list for corporate contracts" },
      { text: "not intended to create legally binding obligations", severity: "High", reason: "Non-binding language creates legal ambiguity about enforceability" },
      { text: "shall be binding", severity: "High", reason: "Conflicting binding language — same document claims both binding and non-binding" },
      { text: "ninety (90) days", severity: "Medium", reason: "Termination notice period of 90 days is excessive; standard is ≤60 days" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, MedSoft Solutions Inc.", status: "✓" },
      { label: "Effective Date", value: "January 1, 2023", status: "✓" },
      { label: "Expiry Date", value: "December 31, 2025", status: "✓" },
      { label: "VP Signatures", value: "2 (Patricia Wong VP IT, David Kumar VP Finance)", status: "✓" },
      { label: "Annual Fee", value: "$180,000 + $45,000 support (+ $15K/module)", status: "✓" },
      { label: "Indemnity Cap", value: "None — uncapped mutual indemnification", status: "✗" },
      { label: "Fee Increase", value: "5% annual auto-increase or CPI, whichever greater — no overall cap", status: "✗" },
      { label: "SLA", value: "99.5% uptime, 5% credit per hour of downtime", status: "✓" },
      { label: "Breach Notification", value: "72 hours", status: "✓" },
      { label: "Auto-Renewal", value: "Yes — 1-year periods, 30-day notice", status: "?" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.68 }, needsHumanReview: 0.58, isComplianceRelated: 0.99, shouldAlert: 0.78, decisionConfidence: 1.97 },
  },
  {
    num: 4, name: "DSA_Provider_Data_Sharing_2024", displayName: "Data Sharing — Provider DSA",
    type: "Data_Sharing",
    summary: "Data sharing with University Health Research Institute — zero PHIPA compliance mention, no breach notification, no VP signatories.",
    filePath: "research/contracts/04_DSA_Provider_Data_Sharing_2024.md",
    riskScore: 5.0, riskLevel: "Critical", flagsCount: 7, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found — Director & CRO signed" },
      { severity: "Critical", field: "phia_compliance", flag_if: "Missing PHIPA compliance declaration entirely" },
      { severity: "High", field: "purpose_limitation", flag_if: "Data use purpose too broad — allows publication and sharing with collaborators" },
      { severity: "High", field: "breach_timeline", flag_if: "Missing breach notification timeline" },
      { severity: "High", field: "security_standards", flag_if: "Missing security standards or below NCSG" },
      { severity: "Medium", field: "audit_rights", flag_if: "Missing audit rights clause" },
      { severity: "Medium", field: "data_minimization", flag_if: "Missing data minimization principle" },
    ],
    textHighlights: [
      { text: "December 31, 2025", severity: "High", reason: "Contract expired 270+ days ago — operating without valid agreement" },
      { text: "not be subject to a monetary cap", severity: "High", reason: "Uncapped indemnity creates unlimited financial liability for Southlake" },
      { text: "ninety (90) days", severity: "Medium", reason: "Convenience termination notice period of 90 days is excessive" },
      { text: "five percent (5%)", severity: "Medium", reason: "Annual fee increase of 5% or CPI without an overall cap — costs escalate indefinitely" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, University Health Research Institute", status: "✓" },
      { label: "Effective Date", value: "September 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "August 31, 2027", status: "✓" },
      { label: "VP Signatures", value: "0 — Susan Park (Director), Dr. Richard Foster (CRO)", status: "✗" },
      { label: "PHIPA Compliance", value: "NOT MENTIONED anywhere in document", status: "✗" },
      { label: "Breach Notification", value: "Not mentioned", status: "✗" },
      { label: "Purpose Limitation", value: "Too broad — academic research, publication, conferences, collaborators", status: "✗" },
      { label: "Audit Rights", value: "Not mentioned", status: "✗" },
      { label: "Security Standards", value: "Not specified", status: "✗" },
      { label: "Data Minimization", value: "Not explicitly stated", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.62 }, needsHumanReview: 0.66, isComplianceRelated: 0.96, shouldAlert: 0.78, decisionConfidence: 2.32 },
  },
  {
    num: 5, name: "NDA_Old_Vendor_2022", displayName: "NDA — Expired Vendor Agreement",
    type: "NDA",
    summary: "NDA expired ~956 days ago with no renewal or termination. Also missing PHIPA compliance and return/destruction clauses.",
    filePath: "research/contracts/05_NDA_Old_Vendor_2022.md",
    riskScore: 4.6, riskLevel: "Critical", flagsCount: 4, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 956 days ago (February 14, 2024)" },
      { severity: "Critical", field: "phia_compliance", flag_if: "Involves health information but no PHIPA declaration" },
      { severity: "High", field: "breach_notification", flag_if: "Missing breach notification requirement" },
      { severity: "Medium", field: "return_destruction", flag_if: "Missing return or destruction clause" },
    ],
    textHighlights: [
      { text: "Susan Park", severity: "Critical", reason: "Signatory is Director, Quality and Privacy — not an authorized VP under Southlake policy" },
      { text: "Director, Quality and Privacy", severity: "Critical", reason: "Director-level signatory lacks authority to bind Southlake contractually" },
      { text: "Dr. Richard Foster", severity: "Critical", reason: "Signatory is Chief Research Officer — not an authorized VP under Southlake policy" },
      { text: "Chief Research Officer", severity: "Critical", reason: "CRO is not on the authorized signatory list; zero VP signatures on record" },
      { text: "Publication in peer-reviewed journals", severity: "High", reason: "Data use purpose is too broad — allows publication which may expose patient-adjacent data" },
      { text: "Sharing with research collaborators", severity: "High", reason: "No restriction on data sharing with third-party collaborators beyond the contracting parties" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, HealthTech Ventures Ltd.", status: "✓" },
      { label: "Effective Date", value: "February 14, 2022", status: "✓" },
      { label: "Expiry Date", value: "February 14, 2024 (EXPIRED ~956 days ago)", status: "✗" },
      { label: "VP Signatures", value: "2 (Lisa Martinez VP Ops, Tom Anderson VP Procurement)", status: "✓" },
      { label: "PHIPA Compliance", value: "Not mentioned", status: "✗" },
      { label: "Confidential Scope", value: "Vague — 'all non-public information' (no specific definition)", status: "✗" },
      { label: "Return/Destruction", value: "Not mentioned", status: "✗" },
      { label: "Breach Notification", value: "Not mentioned", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.52 }, needsHumanReview: 0.47, isComplianceRelated: 0.78, shouldAlert: 0.78, decisionConfidence: 2.74 },
  },
  {
    num: 6, name: "Procurement_Security_Services_2024", displayName: "Procurement — Security Services",
    type: "Procurement",
    summary: "Well-drafted security services agreement. Only alert: renewal within 90-day threshold.",
    filePath: "research/contracts/06_Procurement_Security_Services_2024.md",
    riskScore: 4.2, riskLevel: "Critical", flagsCount: 2, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 545 days ago (March 31, 2025)" },
      { severity: "High", field: "indemnity_clause", flag_if: "Missing indemnity clause entirely" },
    ],
    textHighlights: [
      { text: "February 14, 2022", severity: "High", reason: "Effective date — contract has been expired for ~956 days with no renewal documented" },
      { text: "period of two", severity: "High", reason: "Two-year term ended February 14, 2024 — agreement is lapsed" },
      { text: "Vice President, Operations", severity: "Medium", reason: "VP Ops signed but no second VP signature on file for this agreement" },
      { text: "Vice President, Procurement", severity: "Medium", reason: "VP Procurement signed but procurement authorization is separate from VP signing authority" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, SecurePro Services Inc.", status: "✓" },
      { label: "Effective Date", value: "April 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "March 31, 2025", status: "✓" },
      { label: "VP Signatures", value: "2 (Mark Johnson VP Ops, Amanda White VP Finance)", status: "✓" },
      { label: "Annual Fee", value: "$420,000 ($35,000/month)", status: "✓" },
      { label: "SLA", value: "15-min urgent / 30-min standard response, 24/7 coverage", status: "✓" },
      { label: "Termination for Convenience", value: "30 days", status: "✓" },
      { label: "Auto-Renewal", value: "Yes — 1-year periods, 60-day notice", status: "✓" },
      { label: "Insurance", value: "$2,000,000 per occurrence CGL", status: "✓" },
      { label: "Indemnity Clause", value: "Not present", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.33 }, needsHumanReview: 0.57, isComplianceRelated: 0.24, shouldAlert: 0.77, decisionConfidence: 2.57 },
  },
  {
    num: 7, name: "MOU_Partnership_Duplicate_Versions", displayName: "MOU — Duplicate/Conflicting Versions",
    type: "MOU",
    summary: "Two versions of the same MOU with conflicting financial terms ($100K vs $150K), different signatories, and different binding language.",
    filePath: "research/contracts/07_MOU_Partnership_Duplicate_Versions.md",
    riskScore: 4.6, riskLevel: "Critical", flagsCount: 5, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 423 days ago (July 31, 2025 for v1 / Oct 14, 2026 for v2)" },
      { severity: "High", field: "binding_language", flag_if: "Version 1: non-binding · Version 2: partially binding — contradictory legal positions" },
      { severity: "Medium", field: "termination_clause", flag_if: "No termination clause in either version" },
      { severity: "High", field: "duplicate_version", flag_if: "Multiple versions detected — possible duplicate or conflict" },
      { severity: "High", field: "conflicting_finance", flag_if: "Conflicting amounts for same financial tag: $100,000 vs $150,000" },
    ],
    textHighlights: [
      { text: "March 31, 2025", severity: "High", reason: "Contract expired 545+ days ago — security services currently operating under lapsed agreement" },
      { text: "April 1, 2024", severity: "Medium", reason: "Original effective date — over a year since inception with no formal renewal" },
      { text: "INSURANCE", severity: "Medium", reason: "Insurance requirement present but no indemnification clause exists in this agreement" },
      { text: "$2,000,000 per occurrence", severity: "Medium", reason: "Insurance coverage is specified but there is no reciprocal indemnity protection" },
    ],
    extractedFields: [
      { label: "Version 1", value: "Effective Aug 1, 2023 · $100K/year · 2-year term · VP+VP signed · Non-binding", status: "✓" },
      { label: "Version 2", value: "Effective Oct 15, 2023 · $150K/year · 3-year term · VP+CEO signed · Partially binding", status: "✓" },
      { label: "Conflict: Financial", value: "$100K vs $150K annual commitment", status: "✗" },
      { label: "Conflict: Signatories", value: "VP+VP (v1) vs VP+CEO (v2)", status: "✗" },
      { label: "Conflict: Binding Nature", value: "Non-binding (v1) vs Partially binding (v2)", status: "✗" },
      { label: "Supersession Clause", value: "V2 states it supersedes all prior understandings", status: "?" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.54 }, needsHumanReview: 0.80, isComplianceRelated: 0.83, shouldAlert: 0.87, decisionConfidence: 1.66 },
  },
  {
    num: 8, name: "Legacy_IT_Contract_2019_Scan", displayName: "Procurement — Legacy IT (Low-Quality Scan)",
    type: "Procurement",
    summary: "2019 IT license agreement — 150 DPI scan with stains, rotated pages, and faded text. Critical fields are illegible.",
    filePath: "research/contracts/08_Legacy_IT_Contract_2019_Scan.md",
    riskScore: 5.0, riskLevel: "Critical", flagsCount: 6, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found — names obscured by scan quality" },
      { severity: "High", field: "effective_date", flag_if: "Missing effective date — only approximate 'March 2019' readable" },
      { severity: "Medium", field: "expiry_date", flag_if: "Missing expiry date — cannot determine from scan" },
      { severity: "High", field: "indemnity_cap", flag_if: "Indemnity clause has no monetary cap (partially visible but unverifiable)" },
      { severity: "Medium", field: "ocr_quality", flag_if: "Low-quality scan — key fields illegible (150 DPI, stains, rotation)" },
      { severity: "Critical", field: "missing_fields", flag_if: "Cannot verify key clauses due to scan quality" },
    ],
    textHighlights: [
      { text: "VERSION 1", severity: "High", reason: "First version of this agreement — conflicting terms exist between v1 and v2" },
      { text: "VERSION 2", severity: "High", reason: "Second version supersedes v1 but both remain in circulation creating legal ambiguity" },
      { text: "$100,000/year", severity: "High", reason: "Version 1 financial commitment — conflicts with Version 2 amount of $150,000/year" },
      { text: "$150,000/year", severity: "High", reason: "Version 2 financial commitment — $50K/year increase over Version 1 creates billing ambiguity" },
      { text: "not legally binding", severity: "High", reason: "Version 1 states non-binding — creates uncertainty about enforceability of obligations" },
      { text: "supersedes all prior understandings", severity: "High", reason: "Version 2 claims supersession but both versions remain active in the document repository" },
      { text: "legally binding agreement", severity: "High", reason: "Version 2 is partially binding — contradicts Version 1 which is non-binding" },
      { text: "August 1, 2023", severity: "Medium", reason: "Version 1 effective date — over 2 years ago with no clear resolution of conflicting versions" },
      { text: "October 15, 2023", severity: "Medium", reason: "Version 2 effective date — only 2.5 months after v1, suggesting rushed replacement" },
      { text: "July 31, 2025", severity: "Medium", reason: "Version 1 expiry — contract has been operating in a legal limbo since expiration" },
      { text: "October 14, 2026", severity: "Medium", reason: "Version 2 expiry — approaching; dual-version uncertainty remains unresolved" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health (confirmed), vendor name obscured", status: "?" },
      { label: "Effective Date", value: "~March 2019 (approximate only)", status: "?" },
      { label: "Expiry Date", value: "Unknown — scan quality prevents reading", status: "✗" },
      { label: "VP Signatures", value: "Cannot verify — names and titles obscured by stains", status: "?" },
      { label: "License Fee", value: "Cannot verify — amount covered by stain", status: "?" },
      { label: "Indemnity Terms", value: "Cannot verify — text illegible", status: "?" },
      { label: "SLA Terms", value: "Partially visible — '99% uptime?' (unverified)", status: "?" },
      { label: "OCR Quality", value: "Poor — 150 DPI, stained pages, rotated content", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.86 }, needsHumanReview: 0.90, isComplianceRelated: 0.86, shouldAlert: 0.91, decisionConfidence: 0.0 },
  },
]

// Map contract name → flags for the detail panel
export const flagsByContract: Record<string, Flag[]> = {}
for (const c of contracts) {
  flagsByContract[`Contract_${c.num}_${c.name.split('—')[0].trim().split(' ')[0]}`] = c.flags
}
// Also map by display name prefix
export const flagsByNum: Record<number, Flag[]> = {}
for (const c of contracts) {
  flagsByNum[c.num] = c.flags
}

// Pipeline stage definitions
export const pipelineStages = [
  { label: 'Document Input', icon: '📄', desc: 'PDF / DOCX / Image upload' },
  { label: 'Agnes OCR', icon: '👁️', desc: 'Text extraction & structured parsing' },
  { label: 'Rules Engine', icon: '⚙️', desc: '8 validated policy rules' },
  { label: 'Jev Decision', icon: '🎯', desc: 'Typed risk classification' },
  { label: 'Evidence Store', icon: '📋', desc: 'Audit trail + citations' },
  { label: 'Human Review', icon: '👤', desc: 'Escalation queue' },
]
