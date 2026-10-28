// ── Types ───────────────────────────────────────────────────────────────────

export interface Flag {
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  field: string
  highlightField?: string
  flag_if: string
  // ── Quantitative L×I scoring (v6) ──
  likelihood: number   // 1-5
  impact: number       // 1-5
  risk_score: number   // L × I (1-25)
  compliance_type: 'hard' | 'best_practice'
  risk_category: string // HIROC: Operational | Financial | Reputational | Continuity
  subcategory: string  // HIROC subcategory (e.g. Clinical Practice, Data Privacy & PHIPA)
  department: string   // Southlake department affected
  status: string       // 'open' | 'remediated' | 'accepted'
  source: string       // 'rule' | 'ai_scan'
  ai_suggestion?: string // AI-proposed resolution
}

export interface DocLink {
  sourceNum: number          // Contract that was changed
  sourceClause: string       // Which clause changed (e.g. "§8.2 Data Retention")
  targetName: string         // Affected document (internal policy, external contract, etc.)
  targetClause: string       // Which part of target is affected
  changeDescription: string  // What changed in the source
  status: string  // 'synced' | 'gap' | 'unknown'
  riskIfNotUpdated: string   // Plain-language: what happens if not updated
  // ── Before/after for modal display ──
  beforeText: string         // What the target document currently says (old value)
  afterText: string          // What the target document should say (new value)
  keyChanges: string[]       // Bullet list of specific changes
}

export interface TextHighlight {
  text: string
  severity: 'Critical' | 'High' | 'Medium'
  reason: string
}

export interface Amendment {
  id: string
  label: string
  effectiveDate: string
  keyChanges: string[]
  supersedesOriginal: boolean
}

export interface ComplianceStats {
  hardGaps: number
  bpGaps: number
  complianceRate: number  // 0-1
  topRiskField: string | null
}

export interface ContractDoc {
  num: number
  name: string
  displayName: string
  type: string
  summary: string
  filePath: string
  riskScore: number       // 1-25 (L×I based)
  riskLevel: string
  flagsCount: number
  flags: Flag[]
  extractedFields: Array<{ label: string; value: string; status: '✓' | '✗' | '?' }>
  jev: JevData
  textHighlights: TextHighlight[]
  // ── Compliance stats (v6) ──
  compliance: ComplianceStats
  // ── Amendment linking (v6) ──
  baseContractId?: number   // If this is an amendment, which base contract
  amendments?: Amendment[]   // If this is a base contract, its amendments
  // ── Multi-dimensional search fields (v7) ──
  department: string        // e.g. "Operations", "Finance", "IT", "Legal"
  expiryDate: string        // ISO date string for tickler system
  renewalNoticeDays?: number // Days before expiry to send renewal notice
  // ── RBAC + retention (v8, 2026-10-17 meeting) ──
  confidentiality: Confidentiality
  retentionYears: number      // Years post-expiry the document must be retained
  retentionBasis: string      // Plain-language records-schedule rationale
  retentionOwner: string      // Who gets notified at the retention deadline
}

export interface JevData {
  riskSeverity: { choice: string; confidence: number }
  needsHumanReview: number
  isComplianceRelated: number
  shouldAlert: number
  decisionConfidence: number
}

// ── RBAC (2026-10-17 meeting: role-based access control) ──────────────────
// Confidentiality levels, low → high. Roles may only see documents at or
// below their access ceiling (all levels listed in role.access).
export type Confidentiality = 'public' | 'internal' | 'confidential' | 'restricted'

export interface Role {
  id: string
  label: string
  user: string          // Demo persona (employee)
  access: Confidentiality[]
}

export const ROLES: Role[] = [
  {
    id: 'legal', label: 'Legal & Compliance', user: 'Tanya Howell · Legal Counsel',
    access: ['public', 'internal', 'confidential', 'restricted'],
  },
  {
    id: 'clinical', label: 'Clinical Operations', user: 'Sonia Pagura · CPO',
    access: ['public', 'internal', 'confidential'],
  },
  {
    id: 'finance', label: 'Finance & Procurement', user: 'David Kumar · VP Finance',
    access: ['public', 'internal', 'confidential'],
  },
  {
    id: 'readonly', label: 'General Staff (Read-only)', user: 'Wilson · Executive Assistant',
    access: ['public', 'internal'],
  },
]

export const CONF_LABEL: Record<Confidentiality, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  restricted: 'Restricted (PHI)',
}

export const CONF_BADGE: Record<Confidentiality, string> = {
  public: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  internal: 'bg-sky-50 text-sky-700 border-sky-200',
  confidential: 'bg-amber-50 text-amber-700 border-amber-200',
  restricted: 'bg-red-50 text-red-700 border-red-200',
}

export function canView(role: Role, doc: Pick<ContractDoc, 'confidentiality'>): boolean {
  return role.access.includes(doc.confidentiality)
}

// ── Retention management (2026-10-17 meeting: retention period alerts) ────
// Demo reference "today" — all expiry/retention math uses this date so the
// demo state is stable regardless of the real clock.
export const DEMO_TODAY = '2026-10-15'

export function retentionUntil(c: Pick<ContractDoc, 'expiryDate' | 'retentionYears'>): string {
  if (!c.expiryDate) return ''
  const d = new Date(c.expiryDate + 'T00:00:00')
  d.setFullYear(d.getFullYear() + c.retentionYears)
  return d.toISOString().slice(0, 10)
}

export type RetentionStatus = 'elapsed' | 'imminent' | 'retained'

export function retentionState(c: Pick<ContractDoc, 'expiryDate' | 'retentionYears'>): {
  until: string
  daysLeft: number
  status: RetentionStatus
} {
  if (!c.expiryDate) return { until: '', daysLeft: 0, status: 'retained' }
  const until = retentionUntil(c)
  const daysLeft = Math.ceil((new Date(until).getTime() - new Date(DEMO_TODAY).getTime()) / 86400000)
  const status: RetentionStatus = daysLeft < 0 ? 'elapsed' : daysLeft <= 90 ? 'imminent' : 'retained'
  return { until, daysLeft, status }
}

// ── Risk framework (2026-10-17 meeting, item 3) ────────────────────────────
// Single integration point for Southlake's internal risk scoring / risk
// register framework. When the client's register arrives (Matthew → Brian
// request in flight), its likelihood/impact labels, band thresholds, and any
// custom scoring weights replace the values below — no UI changes needed.
// Current values are the AI default: 5×5 Likelihood×Impact, score bands
// ≥20 red / 12–19 orange / 6–11 yellow / <6 green.
export const RISK_FRAMEWORK = {
  source: 'AI default — pending Southlake internal risk register (expected ~early Nov)',
  likelihoodLabels: ['Rare', 'Unlikely', 'Might happen', 'Likely', 'Will happen'],
  impactLabels: ['Tiny', 'Small', 'Noticeable', 'Major', 'Severe'],
  bands: { red: 20, orange: 12, yellow: 6 },
  viewNotes: [
    'Single-contract: L×I score per flag, band determines red/orange/green.',
    'Portfolio: field-frequency patterns (same flag in ≥3 contracts = systemic trend).',
  ],
}

// ── Template Matching / AI Contract Comparison (2026-10-17 meeting) ──────
// Compares an incoming contract against approved templates / executed
// agreements: clause-level diff, similarity estimate, and a "needs attention"
// shortlist. Deterministic clause alignment (demo engine). Phase 2 adds LLM
// clause matching via local Ollama. The CLAUSE_RISK_RULES table is the
// integration point for Southlake's internal risk framework when it arrives.

export interface TemplateRef {
  id: string
  name: string
  kind: 'template' | 'executed'
  type: string                    // NDA | CDA | DSA | Clinical_Trial | Procurement
  fieldValues: Record<string, string>  // clause field → reference value
  notes?: string
}

export const TEMPLATE_LIBRARY: TemplateRef[] = [
  {
    id: 'tpl-nda', name: 'Southlake Standard NDA (Approved Template)', kind: 'template', type: 'NDA',
    fieldValues: {
      'Parties': 'Southlake Health + counterparty',
      'Effective Date': 'Date of last signature',
      'Expiry Date': '5-year term',
      'VP Signatures': '2 — VP Operations + VP Finance',
      'PHIPA Compliance': 'Yes — compliance clause',
      'Breach Notification': '48 hours',
      'Return/Destruction': '30-day destruction + certification',
      'Confidential Scope': '4 defined categories',
    },
    notes: 'Approved 2023 by Legal. Baseline for all NDAs.',
  },
  {
    id: 'tpl-dsa', name: 'Standard Data Sharing Agreement (Executed 2025)', kind: 'executed', type: 'Data_Sharing',
    fieldValues: {
      'PHIPA Compliance': 'Full declaration — §4',
      'Breach Notification': '24–48 hours',
      'Audit Rights': 'Annual audit, 30-day notice',
      'Data Minimization': 'Yes — §5.2',
      'Security Standards': 'AES-256 at rest, TLS 1.2+',
      'Purpose Limitation': 'Specific research purpose',
      'Data Retention': '5 years post-termination',
      'Governing Law': 'Province of Ontario',
      'VP Signatures': '2 — VP Operations + VP Finance',
    },
    notes: 'Executed with Regional Health Authority (contract #13). Reference for all DSA review.',
  },
  {
    id: 'tpl-cda', name: 'CDA — Clinical Disclosure Agreement (Executed)', kind: 'executed', type: 'CDA',
    fieldValues: {
      'Governing Law': 'Province of Ontario',
      'VP Signatures': '2 — authorized VPs',
      'PHIPA Compliance': 'Yes — clinical data addendum',
      'Breach Notification': '48 hours',
      'Confidential Scope': 'Clinical + research data defined',
      'Return/Destruction': 'Certified destruction on request',
    },
    notes: 'Confidential disclosure baseline for clinical/research collaborations.',
  },
  {
    id: 'tpl-cta', name: 'Clinical Trial Agreement (Standard Template)', kind: 'template', type: 'Clinical_Trial',
    fieldValues: {
      'GCP Compliance': 'ICH E6(R2)',
      'Adverse Event Reporting': 'Per §7 — 24h serious / 30d non-serious',
      'IP Ownership': 'Joint — Southlake + sponsor',
      'Safety Oversight': 'DSMB required',
      'Data Handling': 'De-identified only',
      'Governing Law': 'Province of Ontario',
      'VP Signatures': '2 — VP Operations + VP Research',
    },
    notes: 'Standard trial structure pending research-agreement samples from client.',
  },
  {
    id: 'tpl-proc', name: 'Procurement Services Agreement (Standard)', kind: 'template', type: 'Procurement',
    fieldValues: {
      'Indemnity Cap': 'Capped at 2× annual fee',
      'SLA': '99.5% uptime with service credits',
      'Insurance': '$2M CGL + $1M cyber liability',
      'Termination': '60 days written notice',
      'Fee Increase': 'CPI-linked, no auto-escalation',
      'Governing Law': 'Province of Ontario',
      'VP Signatures': '2 — authorized VPs',
    },
    notes: 'Standard vendor services structure (superseding ad-hoc terms).',
  },
]

// Per-field evaluation: given the incoming contract's extracted value for a
// template clause, decide alignment (1 = aligned, 0.5 = partial/unknown,
// 0 = deviates) and optionally a risk callout. ctx = classified doc type.
type ClauseCtx = { type: string }
const CLAUSE_CHECKS: Array<{
  match: RegExp                       // label matcher (case-insensitive)
  check: (value: string, status: string, ctx: ClauseCtx) => { score: 0 | 0.5 | 1; risk?: 'Critical' | 'High' | 'Medium' | 'Low'; reason?: string }
}> = [
  {
    match: /vp signatures/i,
    check: (v, s) => {
      const t = v.toLowerCase()
      if (t.startsWith('0') || /0 of \d/.test(t)) return { score: 0, risk: 'Critical', reason: 'Execution by unauthorized signatories — 0 VP signatures' }
      if (s === '?') return { score: 0.5, risk: 'Medium', reason: 'Signatories unverifiable' }
      if (s === '✗') return { score: 0, risk: 'High', reason: 'Signature requirement not met' }
      return { score: 1 }
    },
  },
  {
    match: /governing law/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('ontario')) return { score: 1 }
      return { score: 0, risk: 'High', reason: 'Non-Ontario governing law — jurisdictional conflict for Southlake (internal standard)' }
    },
  },
  {
    match: /phia compliance/i,
    check: (v, s) => {
      const t = v.toLowerCase()
      if (t.startsWith('not') || t === 'no' || t === 'none') return { score: 0, risk: 'Critical', reason: 'PHIPA compliance declaration missing' }
      if (s === '?') return { score: 0.5, risk: 'Medium', reason: 'PHIPA status unverified' }
      if (s === '✓' || t.startsWith('yes')) return { score: 1 }
      return { score: 0.5 }
    },
  },
  {
    match: /breach notification/i,
    check: (v, s) => {
      const t = v.toLowerCase()
      if (t.startsWith('not') || t === 'none' || t === 'no') return { score: 0, risk: 'High', reason: 'No breach notification timeline' }
      if (/\d+\s*(h|hour)/.test(t) || /48|24/.test(t)) return { score: 1 }
      if (s === '?') return { score: 0.5, risk: 'Medium', reason: 'Breach notification unconfirmed' }
      return { score: 0.5 }
    },
  },
  {
    match: /indemnity cap/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('none') || t.includes('uncapped') || t.includes('not subject') || t.includes('no monetary cap'))
        return { score: 0, risk: 'High', reason: 'Uncapped indemnity — unlimited financial exposure' }
      return { score: 1 }
    },
  },
  {
    match: /indemnity clause/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t === 'not present' || t.startsWith('not') && t.includes('no')) return { score: 0, risk: 'High', reason: 'Indemnity clause missing entirely' }
      return { score: 1 }
    },
  },
  {
    match: /purpose limitation/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('broad')) return { score: 0, risk: 'Medium', reason: 'Data use purpose too broad — allows publication/collaborator sharing' }
      return { score: 1 }
    },
  },
  {
    match: /audit rights/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.startsWith('not') || t === 'no') return { score: 0, risk: 'Medium', reason: 'No audit rights clause' }
      return { score: 1 }
    },
  },
  {
    match: /data minimization/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.startsWith('not') || t === 'no') return { score: 0, risk: 'Medium', reason: 'Data minimization principle absent' }
      return { score: 1 }
    },
  },
  {
    match: /security standards|data security/i,
    check: (v, s, ctx) => {
      const t = v.toLowerCase()
      if (t.startsWith('no') || t.startsWith('not') || t.startsWith('none'))
        return { score: 0, risk: ctx.type === 'Data_Sharing' ? 'High' : 'Medium', reason: 'Security standards / PHI data protection not specified' }
      if (s === '?') return { score: 0.5, risk: 'Medium', reason: 'Security standards unverified' }
      return { score: 1 }
    },
  },
  {
    match: /return\/?destruction/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.startsWith('not') || t === 'no') return { score: 0, risk: 'Medium', reason: 'No return or destruction clause' }
      return { score: 1 }
    },
  },
  {
    match: /confidential scope/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('vague')) return { score: 0, risk: 'Medium', reason: "Confidential scope vague — 'all non-public information'" }
      return { score: 1 }
    },
  },
  {
    match: /binding language/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('mixed') || t.includes('conflict')) return { score: 0, risk: 'High', reason: 'Conflicting binding language creates legal ambiguity' }
      return { score: 1 }
    },
  },
  {
    match: /encryption/i,
    check: (v, s) => {
      const t = v.toLowerCase()
      if (t.includes('aes') || t.includes('tls')) return { score: 1 }
      if (s === '?') return { score: 0.5, risk: 'Medium', reason: 'Encryption requirements unverified' }
      return { score: 0, risk: 'High', reason: 'No encryption specified for protected data' }
    },
  },
  {
    match: /^version |conflict/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('conflict')) return { score: 0, risk: 'High', reason: 'Duplicate / conflicting versions in circulation' }
      return { score: 1 }
    },
  },
  {
    match: /ocr quality/i,
    check: (v) => {
      const t = v.toLowerCase()
      if (t.includes('poor')) return { score: 0, risk: 'Medium', reason: 'Scan quality limits review — key fields illegible' }
      return { score: 1 }
    },
  },
  {
    match: /pen testing/i,
    check: (_v, s) => (s === '?' ? { score: 0.5, risk: 'Medium', reason: 'Pen-testing requirement unverified' } : { score: 1 }),
  },
  {
    match: /amendment 1|parent contract/i,
    check: (_v, s) => (s === '?' ? { score: 0.5, risk: 'Medium', reason: 'Amendment not yet executed — gap in coverage' } : s === '✗' ? { score: 0, risk: 'High', reason: 'Parent contract expired — coverage gap' } : { score: 1 }),
  },
]

// Field weights: execution/PHI/cap clauses carry more (Luca's "97% similar"
// case should be dominated by the few clauses that actually matter).
const FIELD_WEIGHTS: Record<string, number> = {
  'VP Signatures': 3, 'PHIPA Compliance': 3, 'Breach Notification': 3,
  'Indemnity Cap': 3, 'Governing Law': 3, 'Binding Language': 3,
  'Security Standards': 2, 'Data Security (PHI)': 2, 'Encryption': 2, 'Insurance': 1,
}

export function fieldWeight(label: string): number {
  for (const [k, w] of Object.entries(FIELD_WEIGHTS)) if (label.toLowerCase().includes(k.toLowerCase())) return w
  return 1
}

// Type classification: keyword scoring over type + name + summary
const TYPE_KEYWORDS: Array<{ type: string; kw: RegExp; w: number }> = [
  { type: 'Clinical_Trial', kw: /clinical trial|ich|e6|adverse event|sponsor|protocol/i, w: 3 },
  { type: 'Data_Sharing', kw: /data shar|phi\b|de-identified|deidentified|research data/i, w: 2 },
  { type: 'NDA', kw: /\bnda\b|non-?disclosure|mutual confidentiality/i, w: 2 },
  { type: 'CDA', kw: /\bcda\b|confidential disclosure/i, w: 2 },
  { type: 'Procurement', kw: /procure|vendor|service agreement|license|it master|infrastructure/i, w: 1 },
  { type: 'MOU', kw: /\bmou\b|memorandum|partnership/i, w: 1 },
]

export function classifyType(c: Pick<ContractDoc, 'type' | 'name' | 'summary'>): { type: string; confidence: number; evidence: string } {
  let best = { type: c.type, score: 0, evidence: '' }
  for (const r of TYPE_KEYWORDS) {
    const hay = `${c.name} ${c.summary}`
    const m = hay.match(new RegExp(r.kw.source, 'gi'))
    const s = (m ? m.length : 0) * r.w + (c.type === r.type ? r.w : 0)
    if (s > best.score) best = { type: r.type, score: s, evidence: m ? m.join(', ') : 'type field' }
  }
  const maxPossible = 6
  return { type: best.score > 0 ? best.type : c.type, confidence: Math.min(1, best.score / maxPossible), evidence: best.evidence || c.type }
}

export interface DiffRow {
  field: string
  refValue: string
  incomingValue: string      // '—' when absent
  status: 'aligned' | 'changed' | 'missing'
  risk?: 'Critical' | 'High' | 'Medium' | 'Low'
  reason?: string
  weight: number
}

export interface TemplateMatchResult {
  classifiedType: string
  typeConfidence: number
  typeEvidence: string
  similarity: number        // 0-100
  verdict: string           // plain-language band
  diffs: DiffRow[]
  attention: DiffRow[]      // risk-ordered shortlist
  totalClauses: number
  alignedCount: number
}

function findFieldValue(c: ContractDoc, label: string): { value: string; status: string } | null {
  const l = label.toLowerCase()
  for (const f of c.extractedFields) {
    if (f.label.toLowerCase() === l) return { value: f.value, status: f.status }
  }
  for (const f of c.extractedFields) {
    if (f.label.toLowerCase().includes(l) || l.includes(f.label.toLowerCase())) return { value: f.value, status: f.status }
  }
  // Alias: "Return/Destruction" ≈ "Data Destruction" (wording variants across contracts)
  if (/destruction/i.test(label)) {
    for (const f of c.extractedFields) if (/destruction/i.test(f.label) && f.label.toLowerCase() !== l) return { value: f.value, status: f.status }
  }
  return null
}

export function matchTemplate(c: ContractDoc, tpl: TemplateRef): TemplateMatchResult {
  const cls = classifyType(c)
  const ctx: ClauseCtx = { type: cls.type }
  const diffs: DiffRow[] = []
  let scoreSum = 0
  let weightSum = 0
  for (const [label, refValue] of Object.entries(tpl.fieldValues)) {
    const w = fieldWeight(label)
    weightSum += w
    const found = findFieldValue(c, label)
    let row: DiffRow
    if (!found) {
      row = { field: label, refValue, incomingValue: '—', status: 'missing', weight: w, risk: 'Medium', reason: 'Clause absent from incoming document' }
      scoreSum += 0
    } else {
      const evalResult = CLAUSE_CHECKS.find((chk) => chk.match.test(label))?.check(found.value, found.status, ctx) ?? { score: 1 as const }
      if (evalResult.score === 1) {
        row = { field: label, refValue, incomingValue: found.value, status: 'aligned', weight: w }
        scoreSum += w
      } else if (evalResult.score === 0.5) {
        row = { field: label, refValue, incomingValue: found.value, status: 'changed', weight: w, risk: evalResult.risk, reason: evalResult.reason }
        scoreSum += 0.5 * w
      } else {
        row = { field: label, refValue, incomingValue: found.value, status: 'changed', weight: w, risk: evalResult.risk ?? 'Medium', reason: evalResult.reason }
        scoreSum += 0
      }
    }
    diffs.push(row)
  }
  const similarity = weightSum > 0 ? Math.round((scoreSum / weightSum) * 100) : 0
  const verdict = similarity >= 90 ? 'Near-standard — routine review'
    : similarity >= 70 ? 'Minor deviations — spot-check highlighted clauses'
    : 'Material deviation — focused review of highlighted clauses'
  const riskOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const attention = diffs.filter((d) => d.risk).sort((a, b) =>
    (riskOrder[a.risk!] ?? 9) - (riskOrder[b.risk!] ?? 9) || b.weight - a.weight)
  return {
    classifiedType: cls.type, typeConfidence: cls.confidence, typeEvidence: cls.evidence,
    similarity, verdict, diffs, attention,
    totalClauses: diffs.length, alignedCount: diffs.filter((d) => d.status === 'aligned').length,
  }
}

// ── Data ────────────────────────────────────────────────────────────────────


// ── Southlake Health Departments (clinical + admin) ────────────────────────────
export const SOUTHDEPARTMENTS = [
  // Clinical
  'Emergency',
  'Cardiac / CICU',
  'Cancer (Stronach)',
  'Paediatrics',
  'Maternal Child',
  'Mental Health',
  'Surgery',
  'Anesthesiology',
  'Critical Care / ICU',
  'Palliative Care',
  'Restorative Care',
  'Rehabilitation',
  'Geriatrics',
  'Family Medicine',
  'Diagnostics',
  // Admin
  'Legal & Compliance',
  'IT / Info Systems',
  'Finance & Procurement',
  'Human Resources',
  'Quality & Patient Safety',
  'Facilities',
  'Data Privacy Office',
  'Research',
] as const

export type SouthlakeDept = typeof SOUTHDEPARTMENTS[number]

// ── HIROC subcategories (2-level) ───────────────────────────────────────────────
export const HIROC_SUBCATS: Record<string, string[]> = {
  'Operational': [
    'Clinical Practice',
    'Staffing & HR',
    'IT Systems & Security',
    'Procurement & Vendors',
    'Facilities & Safety',
  ],
  'Financial': [
    'Budget & Licensing',
    'Contract Pricing',
    'IP & Indemnity',
  ],
  'Reputational': [
    'Data Privacy & PHIPA',
    'Public Relations',
    'Patient Experience',
  ],
  'Continuity': [
    'Access & Availability',
    'Termination & Exit',
    'Data Migration & Audit',
  ],
}

// Map: subcategory → default Southlake department
export const SUBCAT_DEPT: Record<string, string> = {
  'Clinical Practice': 'Critical Care / ICU',
  'Staffing & HR': 'Human Resources',
  'IT Systems & Security': 'IT / Info Systems',
  'Procurement & Vendors': 'Finance & Procurement',
  'Facilities & Safety': 'Facilities',
  'Budget & Licensing': 'Finance & Procurement',
  'Contract Pricing': 'Finance & Procurement',
  'IP & Indemnity': 'Legal & Compliance',
  'Data Privacy & PHIPA': 'Data Privacy Office',
  'Public Relations': 'Quality & Patient Safety',
  'Patient Experience': 'Quality & Patient Safety',
  'Access & Availability': 'Critical Care / ICU',
  'Termination & Exit': 'Legal & Compliance',
  'Data Migration & Audit': 'IT / Info Systems',
}


// ── Clinical dept → HIROC subcategory mapping (Southlake) ─────────────
// Each subcategory maps to the clinical departments most exposed to that risk type.
export const SUBCAT_DEPTS: Record<string, string[]> = {
  'Clinical Practice': [
    'Emergency',
    'Cardiac / CICU',
    'Critical Care / ICU',
    'Surgery',
    'Paediatrics',
    'Maternal Child',
  ],
  'Staffing & HR': [
    'Mental Health',
    'Geriatrics',
    'Palliative Care',
  ],
  'IT Systems & Security': [
    'Diagnostics',
    'Cancer (Stronach)',
    'Rehabilitation',
    'Restorative Care',
  ],
  'Procurement & Vendors': [
    'Family Medicine',
    'Anesthesiology',
  ],
  'Facilities & Safety': [
    'Cancer (Stronach)',
    'Surgery',
  ],
  'Budget & Licensing': [
    'Cancer (Stronach)',
    'Cardiac / CICU',
    'Critical Care / ICU',
  ],
  'Contract Pricing': [
    'Surgery',
    'Diagnostics',
  ],
  'IP & Indemnity': [
    'Cancer (Stronach)',
    'Paediatrics',
  ],
  'Data Privacy & PHIPA': [
    'Maternal Child',
    'Mental Health',
    'Paediatrics',
  ],
  'Public Relations': [
    'Cancer (Stronach)',
    'Emergency',
  ],
  'Patient Experience': [
    'Palliative Care',
    'Geriatrics',
    'Restorative Care',
  ],
  'Access & Availability': [
    'Emergency',
    'Cardiac / CICU',
    'Critical Care / ICU',
    'Cancer (Stronach)',
  ],
  'Termination & Exit': [
    'Surgery',
    'Anesthesiology',
  ],
  'Data Migration & Audit': [
    'Diagnostics',
    'Paediatrics',
    'Research',
  ],
}

// ── Criteria-based compliance (per contract type) ──────────────────────────────
// Sam's proposal: applicability varies by document type
export const CRITERIA_BY_TYPE: Record<string, string[]> = {
  'NDA': [
    'PHIPA / privacy compliance clause',
    'Data return or destruction on termination',
    'Breach notification timeline ≤ 48h',
    'Governing law = Ontario',
    'Minimum 2 VP-level signatures',
    'Confidentiality term ≥ 3 years',
  ],
  'MOU': [
    'Clear binding vs non-binding language',
    'Financial caps defined',
    'Termination mechanism with notice period',
    'Governing law = Ontario',
    'Minimum 2 VP-level signatures',
  ],
  'Procurement': [
    'SLA with measurable KPIs',
    'Service credits for SLA failure',
    'Insurance requirements specified',
    'Data security + encryption standards',
    'Termination for convenience clause',
    'Governing law = Ontario',
  ],
  'Data_Sharing': [
    'PHIPA compliance declaration',
    'Data minimization principle',
    'Breach notification timeline ≤ 24h',
    'Audit rights clause',
    'Governing law = Ontario',
    'Data retention period defined',
  ],
}


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
    compliance: { hardGaps: 0, bpGaps: 0, complianceRate: 1.0, topRiskField: null },
    department: "Legal & Compliance", expiryDate: "2029-03-15",
    confidentiality: "public", retentionYears: 5, retentionBasis: "NDA confidentiality period — 5 years post-term", retentionOwner: "Legal & Compliance",
  },
  {
    num: 2, name: "MOU_Missing_Second_Signature_2024", displayName: "MOU — Missing VP Signatures",
    type: "MOU",
    summary: "MOU with Executive Director & CMO signing (neither is VP). Mixed binding/non-binding language creates legal ambiguity.",
    filePath: "research/contracts/02_MOU_Missing_Second_Signature_2024.md",
    riskScore: 25.0, riskLevel: "Critical", flagsCount: 3, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found — signed by Executive Director & CMO", likelihood: 5, impact: 5, risk_score: 25, compliance_type: "hard", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update signatories per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 119 days ago (May 31, 2026)", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "High", field: "binding_language", flag_if: "Both binding and non-binding language present — creates legal ambiguity", likelihood: 4, impact: 5, risk_score: 20, compliance_type: "hard", risk_category: "Financial", subcategory: "Contract Pricing", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update binding language per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  

    ],
    textHighlights: [],
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
    compliance: { hardGaps: 3, bpGaps: 0, complianceRate: 0.57, topRiskField: "signatories" },
    department: "Quality & Patient Safety", expiryDate: "2026-05-31",
    confidentiality: "internal", retentionYears: 7, retentionBasis: "Corporate records — 7 years post-termination", retentionOwner: "Quality & Patient Safety",
  },
  {
    num: 3, name: "Procurement_HealthIT_Service_Agreement_2023", displayName: "Procurement — HealthIT Service Agreement",
    type: "Procurement",
    summary: "EHR vendor agreement with unlimited indemnity, auto-increasing fees without cap, and 90-day convenience termination.",
    filePath: "research/contracts/03_Procurement_HealthIT_Service_Agreement_2023.md",
    riskScore: 21.0, riskLevel: "Critical", flagsCount: 3, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 270 days ago (Dec 31, 2025)", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "High", field: "indemnity_cap", highlightField: "a monetary cap", flag_if: "Indemnity clause has no monetary cap", likelihood: 3, impact: 5, risk_score: 15, compliance_type: "best_practice", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update indemnity cap per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "Medium", field: "termination_conv", highlightField: "ninety", flag_if: "Convenience termination notice period of 90 days is excessive", likelihood: 2, impact: 2, risk_score: 4, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update termination conv per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  
    ],
    textHighlights: [
      { text: "Robert Thompson", severity: "Critical", reason: "Signatory is Executive Director, not an authorized VP" },
      { text: "not intended to create legally binding obligations", severity: "High", reason: "Non-binding language creates legal ambiguity" },
      { text: "shall be binding", severity: "High", reason: "Conflicting binding language" },
      { text: "ninety (90) days", severity: "Medium", reason: "Termination notice period of 90 days is excessive" },
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
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.68 }, needsHumanReview: 0.58, isComplianceRelated: 0.99, shouldAlert: 0.78, decisionConfidence: 1.97 },
    compliance: { hardGaps: 1, bpGaps: 2, complianceRate: 0.67, topRiskField: "expiry_date" },
    department: "IT / Info Systems", expiryDate: "2025-12-31",
    confidentiality: "confidential", retentionYears: 1, retentionBasis: "Superseded by IT MSA #9 — 1 year post-supersession", retentionOwner: "IT / Info Systems",
  },
  {
    num: 4, name: "DSA_Provider_Data_Sharing_2024", displayName: "Data Sharing — Provider DSA",
    type: "Data_Sharing",
    summary: "Data sharing with University Health Research Institute — zero PHIPA compliance mention, no breach notification, no VP signatories.",
    filePath: "research/contracts/04_DSA_Provider_Data_Sharing_2024.md",
    riskScore: 25.0, riskLevel: "Critical", flagsCount: 7, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Only 0 VP signatures found — Director & CRO signed", likelihood: 5, impact: 5, risk_score: 25, compliance_type: "hard", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update signatories per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Critical", field: "phia_compliance", flag_if: "Missing PHIPA compliance declaration entirely", likelihood: 5, impact: 5, risk_score: 25, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update phia compliance per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "purpose_limitation", flag_if: "Data use purpose too broad — allows publication and sharing with collaborators", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update purpose limitation per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "breach_timeline", flag_if: "Missing breach notification timeline", likelihood: 4, impact: 4, risk_score: 16, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update breach timeline per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "High", field: "security_standards", flag_if: "No security standards specified", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update security standards per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "Medium", field: "audit_rights", flag_if: "No audit rights clause", likelihood: 2, impact: 3, risk_score: 6, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update audit rights per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "data_minimization", flag_if: "No data minimization principle stated", likelihood: 2, impact: 3, risk_score: 6, compliance_type: "best_practice", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update data minimization per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  

    ],
    textHighlights: [
      { text: "December 31, 2025", severity: "High", reason: "Contract expired 270+ days ago" },
      { text: "not be subject to a monetary cap", severity: "High", reason: "Uncapped indemnity" },
      { text: "ninety (90) days", severity: "Medium", reason: "Excessive termination notice" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, University Health Research Institute", status: "✓" },
      { label: "VP Signatures", value: "0 — Susan Park (Director), Dr. Richard Foster (CRO)", status: "✗" },
      { label: "PHIPA Compliance", value: "NOT MENTIONED anywhere in document", status: "✗" },
      { label: "Breach Notification", value: "Not mentioned", status: "✗" },
      { label: "Purpose Limitation", value: "Too broad — academic research, publication, conferences, collaborators", status: "✗" },
      { label: "Audit Rights", value: "Not mentioned", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.62 }, needsHumanReview: 0.66, isComplianceRelated: 0.96, shouldAlert: 0.78, decisionConfidence: 2.32 },
    compliance: { hardGaps: 5, bpGaps: 2, complianceRate: 0.12, topRiskField: "signatories" },
    department: "Research", expiryDate: "2025-12-31",
    confidentiality: "restricted", retentionYears: 10, retentionBasis: "PHI data sharing — 10 years (PHIPA best practice)", retentionOwner: "Data Privacy Office",
  },
  {
    num: 5, name: "NDA_Old_Vendor_2022", displayName: "NDA — Expired Vendor Agreement",
    type: "NDA",
    summary: "NDA expired ~956 days ago with no renewal or termination. Also missing PHIPA compliance and return/destruction clauses.",
    filePath: "research/contracts/05_NDA_Old_Vendor_2022.md",
    riskScore: 21.5, riskLevel: "Critical", flagsCount: 4, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 956 days ago", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "Critical", field: "phia_compliance", flag_if: "Missing PHIPA compliance declaration entirely", likelihood: 4, impact: 5, risk_score: 20, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update phia compliance per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "High", field: "breach_notification", flag_if: "Missing breach notification requirement", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: `Add §12.3: `,
  },
      { severity: "Medium", field: "return_destruction", flag_if: "Missing return or destruction clause", likelihood: 3, impact: 3, risk_score: 9, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update return destruction per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
          { severity: "High", field: "governing_law", flag_if: "Governing law references Alberta instead of Ontario — creates jurisdictional conflict for Southlake", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "hard", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update governing law per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
],
    textHighlights: [
      { text: "Susan Park", severity: "Critical", reason: "Signatory is Director, not authorized VP" },
      { text: "Publication in peer-reviewed journals", severity: "High", reason: "Data use purpose too broad" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, HealthTech Ventures Ltd.", status: "✓" },
      { label: "Effective Date", value: "February 14, 2022", status: "✓" },
      { label: "Expiry Date", value: "February 14, 2024 (EXPIRED ~956 days ago)", status: "✗" },
      { label: "VP Signatures", value: "2 (Lisa Martinez VP Ops, Tom Anderson VP Procurement)", status: "✓" },
      { label: "PHIPA Compliance", value: "Not mentioned", status: "✗" },
      { label: "Confidential Scope", value: "Vague — 'all non-public information'", status: "✗" },
      { label: "Return/Destruction", value: "Not mentioned", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.52 }, needsHumanReview: 0.47, isComplianceRelated: 0.78, shouldAlert: 0.78, decisionConfidence: 2.74 },
    compliance: { hardGaps: 3, bpGaps: 1, complianceRate: 0.50, topRiskField: "expiry_date" },
    department: "Legal & Compliance", expiryDate: "2024-02-14",
    confidentiality: "internal", retentionYears: 2, retentionBasis: "Lapsed vendor NDA — 2 years post-termination", retentionOwner: "Legal & Compliance",
  },
  {
    num: 6, name: "Procurement_Security_Services_2024", displayName: "Procurement — Security Services",
    type: "Procurement",
    summary: "Well-drafted security services agreement. Only alert: renewal within 90-day threshold. Expired 545 days ago.",
    filePath: "research/contracts/06_Procurement_Security_Services_2024.md",
    riskScore: 20.5, riskLevel: "Critical", flagsCount: 2, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 545 days ago (March 31, 2025)", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "High", field: "indemnity_clause", flag_if: "Missing indemnity clause entirely", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "best_practice", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update indemnity clause per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  

    ],
    textHighlights: [
      { text: "March 31, 2025", severity: "High", reason: "Contract expired 545+ days ago" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, SecurePro Services Inc.", status: "✓" },
      { label: "Effective Date", value: "April 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "March 31, 2025", status: "✓" },
      { label: "VP Signatures", value: "2 (Mark Johnson VP Ops, Amanda White VP Finance)", status: "✓" },
      { label: "Annual Fee", value: "$420,000 ($35,000/month)", status: "✓" },
      { label: "SLA", value: "15-min urgent / 30-min standard response, 24/7 coverage", status: "✓" },
      { label: "Indemnity Clause", value: "Not present", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.33 }, needsHumanReview: 0.57, isComplianceRelated: 0.24, shouldAlert: 0.77, decisionConfidence: 2.57 },
    compliance: { hardGaps: 1, bpGaps: 1, complianceRate: 0.78, topRiskField: "expiry_date" },
    department: "Quality & Patient Safety", expiryDate: "2025-03-31",
    confidentiality: "confidential", retentionYears: 7, retentionBasis: "Procurement records — 7 years post-termination", retentionOwner: "Quality & Patient Safety",
  },
  {
    num: 7, name: "MOU_Partnership_Duplicate_Versions", displayName: "MOU — Duplicate/Conflicting Versions",
    type: "MOU",
    summary: "Two versions of the same MOU with conflicting financial terms ($100K vs $150K), different signatories, and different binding language.",
    filePath: "research/contracts/07_MOU_Partnership_Duplicate_Versions.md",
    riskScore: 22.0, riskLevel: "Critical", flagsCount: 5, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Contract expired 423 days ago (July 31, 2025)", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "High", field: "binding_language", flag_if: "V1 non-binding vs V2 partially binding — creates legal ambiguity", likelihood: 4, impact: 5, risk_score: 20, compliance_type: "hard", risk_category: "Financial", subcategory: "Contract Pricing", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update binding language per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "High", field: "duplicate_version", flag_if: "Two active versions in circulation with conflicting terms", likelihood: 4, impact: 4, risk_score: 16, compliance_type: "hard", risk_category: "Financial", subcategory: "Budget & Licensing", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update duplicate version per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },

      { severity: "High", field: "conflicting_finance", flag_if: "$100K vs $150K annual commitment between versions", likelihood: 3, impact: 5, risk_score: 15, compliance_type: "hard", risk_category: "Financial", subcategory: "Budget & Licensing", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update conflicting finance per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "termination_clause", flag_if: "Missing termination clause in both versions", likelihood: 2, impact: 3, risk_score: 6, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update termination clause per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  

    ],
    textHighlights: [
      { text: "VERSION 1", severity: "High", reason: "Conflicting terms with VERSION 2" },
      { text: "$100,000/year", severity: "High", reason: "V1 financial commitment conflicts with V2" },
      { text: "$150,000/year", severity: "High", reason: "V2 financial commitment" },
      { text: "supersedes all prior understandings", severity: "High", reason: "V2 claims supersession but both remain active" },
    ],
    extractedFields: [
      { label: "Version 1", value: "Effective Aug 1, 2023 · $100K/year · 2-year term · VP+VP signed · Non-binding", status: "✓" },
      { label: "Version 2", value: "Effective Oct 15, 2023 · $150K/year · 3-year term · VP+CEO signed · Partially binding", status: "✓" },
      { label: "Conflict: Financial", value: "$100K vs $150K annual commitment", status: "✗" },
      { label: "Conflict: Signatories", value: "VP+VP (v1) vs VP+CEO (v2)", status: "✗" },
      { label: "Conflict: Binding", value: "Non-binding (v1) vs Partially binding (v2)", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.54 }, needsHumanReview: 0.80, isComplianceRelated: 0.83, shouldAlert: 0.87, decisionConfidence: 1.66 },
    compliance: { hardGaps: 4, bpGaps: 1, complianceRate: 0.29, topRiskField: "expiry_date" },
    // ── Amendment linking: Contract 7 IS the base, and has 2 versions ──
    
    department: "Quality & Patient Safety", expiryDate: "2025-07-31",
    confidentiality: "internal", retentionYears: 7, retentionBasis: "Partnership MOU — 7 years post-termination", retentionOwner: "Quality & Patient Safety",
    amendments: [
      {
        id: "v1",
        label: "Original MOU (v1)",
        effectiveDate: "Aug 1, 2023",
        keyChanges: ["$100K/year", "2-year term", "VP+VP signatories", "Non-binding"],
        supersedesOriginal: false,
      },
      {
        id: "v2",
        label: "Amended MOU (v2)",
        effectiveDate: "Oct 15, 2023",
        keyChanges: ["$150K/year (+$50K)", "3-year term", "VP+CEO signatories", "Partially binding", "Supersedes v1"],
        supersedesOriginal: true,
      },
    ],
  },
  {
    num: 8, name: "Legacy_IT_Contract_2019_Scan", displayName: "Procurement — Legacy IT (Low-Quality Scan)",
    type: "Procurement",
    summary: "2019 IT license agreement — 150 DPI scan with stains, rotated pages, and faded text. Critical fields are illegible.",
    filePath: "research/contracts/08_Legacy_IT_Contract_2019_Scan.md",
    riskScore: 25.0, riskLevel: "Critical", flagsCount: 6, flags: [
      { severity: "Critical", field: "signatories", flag_if: "Cannot verify — names and titles obscured by scan quality", likelihood: 5, impact: 5, risk_score: 25, compliance_type: "hard", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update signatories per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Critical", field: "missing_fields", flag_if: "Cannot verify key clauses due to scan quality", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update missing fields per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "effective_date", flag_if: "Missing effective date — only approximate 'March 2019' readable", likelihood: 3, impact: 3, risk_score: 9, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update effective date per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "indemnity_cap", flag_if: "Indemnity clause has no monetary cap (partially visible but unverifiable)", likelihood: 3, impact: 5, risk_score: 15, compliance_type: "best_practice", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update indemnity cap per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "ocr_quality", flag_if: "Low-quality scan — key fields illegible (150 DPI, stains, rotation)", likelihood: 4, impact: 3, risk_score: 12, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Review and update ocr quality per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "expiry_date", flag_if: "Missing expiry date — cannot determine from scan", likelihood: 3, impact: 3, risk_score: 9, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  }
  
    ],
    textHighlights: [
      { text: "VERSION 1", severity: "High", reason: "Conflicting terms between v1 and v2" },
      { text: "VERSION 2", severity: "High", reason: "Second version supersedes v1" },
      { text: "$100,000/year", severity: "High", reason: "V1 financial commitment" },
      { text: "$150,000/year", severity: "High", reason: "V2 financial commitment" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health (confirmed), vendor name obscured", status: "?" },
      { label: "Effective Date", value: "~March 2019 (approximate only)", status: "?" },
      { label: "Expiry Date", value: "Unknown — scan quality prevents reading", status: "✗" },
      { label: "VP Signatures", value: "Cannot verify — names and titles obscured by stains", status: "?" },
      { label: "License Fee", value: "Cannot verify — amount covered by stain", status: "?" },
      { label: "OCR Quality", value: "Poor — 150 DPI, stained pages, rotated content", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.86 }, needsHumanReview: 0.90, isComplianceRelated: 0.86, shouldAlert: 0.91, decisionConfidence: 0.0 },
    compliance: { hardGaps: 4, bpGaps: 2, complianceRate: 0.33, topRiskField: "signatories" },
    department: "IT / Info Systems", expiryDate: "2022-03-01",
    confidentiality: "confidential", retentionYears: 3, retentionBasis: "Legacy 2019 license — 3-year records review cycle", retentionOwner: "IT / Info Systems",
  },
  // ── NEW Contract 9: IT Master Services Agreement (from Exelon/NSW template structure) ──
  {
    num: 9, name: "IT_Master_Services_Agreement_2024", displayName: "IT Master Services — Cloud Infrastructure",
    type: "Procurement",
    summary: "Comprehensive 3-year IT support agreement with CloudWorks Inc. Well-drafted with SLA, service credits, and insurance. 2 VP signed. Missing: indemnity cap + PHI data security clause.",
    filePath: "research/contracts/09_IT_Master_Services_Agreement_2024.md",
    riskScore: 15.5, riskLevel: "High", flagsCount: 2, flags: [
      { severity: "High", field: "indemnity_cap", highlightField: "not subject to a monetary cap", flag_if: "Indemnity clause explicitly states no monetary cap", likelihood: 3, impact: 5, risk_score: 15, compliance_type: "best_practice", risk_category: "Financial", subcategory: "IP & Indemnity", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update indemnity cap per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "conflicting_finance", flag_if: "Detected different annual fee amounts: 320,000 vs 45,000", likelihood: 3, impact: 5, risk_score: 15, compliance_type: "hard", risk_category: "Financial", subcategory: "Budget & Licensing", department: "Finance & Procurement", status: "open", source: "ai_scan",
    ai_suggestion: 'Review and update conflicting finance per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
          { severity: "Medium", field: "auto_renewal", flag_if: "Contract auto-renews for 1-year periods — no explicit opt-out mechanism beyond 60-day notice window", likelihood: 3, impact: 3, risk_score: 9, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update auto renewal per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
],
    textHighlights: [
      { text: "not subject to a monetary cap", severity: "High", reason: "Uncapped indemnity creates unlimited financial liability" },
      { text: "99.9%", severity: "Medium", reason: "Uptime guarantee is aggressive — verify SLA credit mechanism" },
      { text: "PHI", severity: "Critical", reason: "Agreement handles PHI but data security clause is missing" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, CloudWorks Infrastructure Inc.", status: "✓" },
      { label: "Effective Date", value: "June 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "May 31, 2027 (3-year term)", status: "✓" },
      { label: "VP Signatures", value: "2 (Patricia Wong VP IT, Mark Johnson VP Ops)", status: "✓" },
      { label: "Annual Fee", value: "$320,000 base + $45,000 support", status: "✓" },
      { label: "SLA", value: "99.9% uptime, 2-hour P1 response, 5% credit/hr downtime", status: "✓" },
      { label: "Indemnity Cap", value: "None — explicitly uncapped", status: "✗" },
      { label: "Data Security (PHI)", value: "Not addressed — no encryption or access controls specified", status: "✗" },
      { label: "Auto-Renewal", value: "Yes — 1-year periods, 60-day notice", status: "✓" },
      { label: "Insurance", value: "$2M CGL + $1M cyber liability", status: "✓" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.61 }, needsHumanReview: 0.42, isComplianceRelated: 0.88, shouldAlert: 0.72, decisionConfidence: 2.45 },
    compliance: { hardGaps: 1, bpGaps: 1, complianceRate: 0.78, topRiskField: "indemnity_cap" },
    department: "IT / Info Systems", expiryDate: "2027-05-31",
    confidentiality: "confidential", retentionYears: 7, retentionBasis: "IT MSA — 7 years post-termination", retentionOwner: "IT / Info Systems",
  },
  // ── NEW Contract 10: Health Data Sharing + Amendment (from ETHP template structure) ──
  {
    num: 10, name: "Health_Data_Sharing_Services_2024", displayName: "Health DSA — Regional Hospital (with Amendment)",
    type: "Data_Sharing",
    summary: "Data sharing with Regional Hospital Authority for de-identified patient outcomes. Has PHIPA + 2 VPs. Expired 45 days. Amendment 1 extends term + adds data categories.",
    filePath: "research/contracts/10_Health_Data_Sharing_Services_2024.md",
    riskScore: 21.0, riskLevel: "Critical", flagsCount: 3, flags: [
      { severity: "High", field: "expiry_date", flag_if: "Base contract expired 45 days ago (Aug 1, 2026) — amendment not yet executed", likelihood: 5, impact: 4, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement" , status: "open", source: "rule",
    ai_suggestion: 'Add clause: This agreement expires on [DATE]. Either party may terminate with 60 days written notice.',
  },
      { severity: "High", field: "breach_timeline", flag_if: "No breach notification timeline specified", likelihood: 4, impact: 4, risk_score: 16, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update breach timeline per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "audit_rights", flag_if: "No audit rights clause in base or amendment", likelihood: 2, impact: 3, risk_score: 6, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update audit rights per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  }
  

    ],
    textHighlights: [
      { text: "August 1, 2026", severity: "High", reason: "Base contract expiry — 45 days overdue" },
      { text: "Amendment No. 1", severity: "Medium", reason: "Extends term + adds data categories — not yet fully executed" },
      { text: "research collaborators", severity: "High", reason: "Amendment broadens data sharing scope" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, Regional Hospital Authority", status: "✓" },
      { label: "Effective Date", value: "September 1, 2024", status: "✓" },
      { label: "Expiry Date", value: "August 1, 2026 (EXPIRED 45 days)", status: "✗" },
      { label: "VP Signatures", value: "2 (Lisa Martinez VP Ops, David Kumar VP Finance)", status: "✓" },
      { label: "PHIPA Compliance", value: "Yes — Section 4", status: "✓" },
      { label: "Breach Notification", value: "Not mentioned in base or amendment", status: "✗" },
      { label: "Audit Rights", value: "Not mentioned", status: "✗" },
      { label: "Amendment 1", value: "Extends to Jan 1, 2028 + adds ICD-10 codes + collaborator sharing", status: "?" },
    ],
    jev: { riskSeverity: { choice: "critical", confidence: 0.55 }, needsHumanReview: 0.61, isComplianceRelated: 0.94, shouldAlert: 0.82, decisionConfidence: 2.10 },
    compliance: { hardGaps: 2, bpGaps: 1, complianceRate: 0.625, topRiskField: "expiry_date" },
    // ── Amendment linking: base + amendment ──
    
    department: "Research", expiryDate: "2026-08-01",
    confidentiality: "restricted", retentionYears: 10, retentionBasis: "PHI data sharing — 10 years (PHIPA)", retentionOwner: "Data Privacy Office",
    amendments: [
      {
        id: "base",
        label: "Original DSA",
        effectiveDate: "Sep 1, 2024",
        keyChanges: ["De-identified outcomes data", "3-year term", "PHIPA compliant", "No breach notification timeline"],
        supersedesOriginal: false,
      },
      {
        id: "amend-1",
        label: "Amendment No. 1 (pending execution)",
        effectiveDate: "Aug 15, 2026",
        keyChanges: ["Extends term to Jan 1, 2028", "Adds ICD-10 diagnosis codes", "Allows sharing with research collaborators", "Adds data minimization clause"],
        supersedesOriginal: true,
      },
    ],
  },
  // ── Contract 11: DSA Amendment No.1 (cross-reference demo) ──
  {
    num: 11, name: "DSA_Amendment_No1_Extended_Retention_2026", displayName: "DSA Amendment No.1 — Extended Retention + ICD-10",
    type: "Data_Sharing",
    summary: "Amendment to Health DSA: extends retention 3→5yr, adds ICD-10 codes, strengthens breach notification (48h→24h) + annual pen-testing. PENDING EXECUTION — missing VP signatures.",
    filePath: "research/contracts/11_DSA_Amendment_No1_Extended_Retention_2026.md",
    riskScore: 18.0, riskLevel: "High", flagsCount: 4, flags: [
      { severity: "High", field: "signatories", flag_if: "Amendment pending execution — both VP signatures missing", likelihood: 4, impact: 5, risk_score: 20, compliance_type: "hard", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Review and update signatories per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "High", field: "breach_timeline", flag_if: "Amends breach notification from 48h to 24h — not yet in force until executed", likelihood: 3, impact: 4, risk_score: 12, compliance_type: "hard", risk_category: "Reputational", subcategory: "Data Privacy & PHIPA", department: "Data Privacy Office", status: "open", source: "rule",
    ai_suggestion: 'Review and update breach timeline per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "security_standards", flag_if: "New ICD-10 data elements require AES-256 encryption — compliance unverified", likelihood: 3, impact: 3, risk_score: 9, compliance_type: "best_practice", risk_category: "Operational", subcategory: "Procurement & Vendors", department: "Finance & Procurement", status: "open", source: "rule",
    ai_suggestion: 'Review and update security standards per Southlake Health compliance policy. Consult Legal (Tanya Howell) for clause language.',
  },
      { severity: "Medium", field: "expiry_date", flag_if: "Parent DSA expired 45 days ago — amendment extends to Jan 2028 but gap exists", likelihood: 4, impact: 4, risk_score: 16, compliance_type: "hard", risk_category: "Continuity", subcategory: "Termination & Exit", department: "Legal & Compliance", status: "open", source: "rule",
    ai_suggestion: 'Add clause: "This agreement expires on [DATE]. Either party may terminate with 60 days written notice." Insert into §Termination.',
  },
    ],
    textHighlights: [
      { text: "PENDING EXECUTION", severity: "High", reason: "Both VP signatures missing — amendment not yet in force" },
      { text: "twenty-four (24) hours", severity: "Medium", reason: "Tightens breach notification from 48h to 24h" },
      { text: "five (5) years", severity: "Medium", reason: "Extended data retention period" },
      { text: "ICD-10-CM", severity: "Medium", reason: "New data element — requires enhanced security" },
    ],
    extractedFields: [
      { label: "Parties", value: "Southlake Health + Regional Hospital Network", status: "✓" },
      { label: "Effective Date", value: "January 1, 2027 (pending execution)", status: "?" },
      { label: "VP Signatures", value: "0 of 4 required (2 per party)", status: "✗" },
      { label: "PHIPA Compliance", value: "Yes — extends original §4.1", status: "✓" },
      { label: "Breach Notification", value: "24h (amended from 48h)", status: "?" },
      { label: "Encryption", value: "AES-256 at rest, TLS 1.2+ in transit", status: "✓" },
      { label: "Pen Testing", value: "Annual third-party required", status: "?" },
      { label: "Parent Contract", value: "Health DSA #10 (expired Aug 1, 2026)", status: "✗" },
    ],
    jev: { riskSeverity: { choice: "high", confidence: 0.72 }, needsHumanReview: 0.85, isComplianceRelated: 0.91, shouldAlert: 0.78, decisionConfidence: 1.85 },
    compliance: { hardGaps: 3, bpGaps: 1, complianceRate: 0.5, topRiskField: "signatories" },
    department: "Research", expiryDate: "2027-01-01",
    confidentiality: "restricted", retentionYears: 10, retentionBasis: "PHI data sharing amendment — 10 years (PHIPA)", retentionOwner: "Data Privacy Office",
    baseContractId: 10,
  },
  {
    num: 12, name: "NDA_Clean_Compliant_2025", displayName: "NDA — Fully Compliant (Test)",
    type: "NDA",
    summary: "Clean NDA with all required fields: 2 VP signatures, Ontario governing law, 48h breach notification, data destruction clause, 5-year confidentiality. TEST DOCUMENT — should produce zero flags.",
    filePath: "research/contracts/12_NDA_Clean_Compliant_2025.md",
    riskScore: 0, riskLevel: "Low", flagsCount: 0, flags: [],
    jev: { riskSeverity: { choice: "low", confidence: 0.95 }, needsHumanReview: 0.05, isComplianceRelated: 1.0, shouldAlert: 0.0, decisionConfidence: 0.0 },
    textHighlights: [],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, TestVendor Inc.", status: "✓" },
      { label: "Effective Date", value: "January 15, 2025", status: "✓" },
      { label: "Expiry Date", value: "January 15, 2030", status: "✓" },
      { label: "VP Signatures", value: "2 — VP Operations + VP Finance", status: "✓" },
      { label: "Governing Law", value: "Province of Ontario", status: "✓" },
      { label: "Breach Notification", value: "48 hours", status: "✓" },
      { label: "Data Destruction", value: "30-day destruction + certification", status: "✓" },
      { label: "Confidentiality Term", value: "5 years post-termination", status: "✓" },
    ],
    compliance: { hardGaps: 0, bpGaps: 0, complianceRate: 1.0, topRiskField: "none" },
    department: "Legal & Compliance", expiryDate: "2030-01-15",
    confidentiality: "public", retentionYears: 5, retentionBasis: "Test document — 5-year confidentiality period", retentionOwner: "Legal & Compliance",
  },
  {
    num: 13, name: "DSA_Clean_Compliant_2025", displayName: "Data Sharing — Fully Compliant (Test)",
    type: "Data_Sharing",
    summary: "Clean DSA with PHIPA compliance, 24h breach notification, audit rights, data minimization, 5-year retention, 2 VP signatures. TEST DOCUMENT — should produce zero flags.",
    filePath: "research/contracts/13_DSA_Clean_Compliant_2025.md",
    riskScore: 0, riskLevel: "Low", flagsCount: 0, flags: [],
    jev: { riskSeverity: { choice: "low", confidence: 0.92 }, needsHumanReview: 0.08, isComplianceRelated: 1.0, shouldAlert: 0.0, decisionConfidence: 0.0 },
    textHighlights: [],
    extractedFields: [
      { label: "Parties", value: "Southlake Health, Regional Health Authority", status: "✓" },
      { label: "Effective Date", value: "March 1, 2025", status: "✓" },
      { label: "Expiry Date", value: "March 1, 2028", status: "✓" },
      { label: "VP Signatures", value: "2 — VP Operations + VP Finance", status: "✓" },
      { label: "PHIPA Compliance", value: "Full declaration present", status: "✓" },
      { label: "Breach Notification", value: "24 hours", status: "✓" },
      { label: "Audit Rights", value: "Annual audit with 30-day notice", status: "✓" },
      { label: "Data Retention", value: "5 years post-termination", status: "✓" },
      { label: "Governing Law", value: "Province of Ontario", status: "✓" },
    ],
    compliance: { hardGaps: 0, bpGaps: 0, complianceRate: 1.0, topRiskField: "none" },
    department: "Research", expiryDate: "2028-03-01",
    confidentiality: "public", retentionYears: 10, retentionBasis: "PHI-compliant DSA (test) — 10 years", retentionOwner: "Research",
  },
]

// ── Cross-reference links (document impact cascades) ──
// Purpose: if Doc A's clause changed, which other docs (B, C) need updating?
// Discover gaps the hospital hasn't identified yet.

export const docLinks: DocLink[] = [
  {
    sourceNum: 11,
    sourceClause: "§1.1 Data Retention (3yr → 5yr)",
    targetName: "Southlake Security Policy v2.1",
    targetClause: "§7.3 Data Retention Schedule",
    changeDescription: "Amendment #11 extends DSA retention from 3 to 5 years",
    status: "gap",
    riskIfNotUpdated: "Security Policy still says 3-year retention. After the 5-year DSA period, Southlake may be legally required to keep data but its policy authorizes destruction at year 3. Compliance violation + potential PHIPA breach.",
    beforeText: "§7.3: All shared personal health information shall be destroyed no later than three (3) years following termination of the applicable data sharing agreement.",
    afterText: "§7.3: All shared personal health information shall be destroyed no later than five (5) years following termination of the applicable data sharing agreement, unless perpetual retention is required for research purposes under de-identification.",
    keyChanges: ["Retention period: 3 years → 5 years", "Exception added: perpetual retention for de-identified research data", "Destruction certification deadline: unchanged (30 days)"],
  },
  {
    sourceNum: 11,
    sourceClause: "§3.1 Breach Notification (48h → 24h)",
    targetName: "Breach Response Plan (2024 edition)",
    targetClause: "§4.2 Notification Timeline",
    changeDescription: "Amendment tightens breach notification from 48h to 24h",
    status: "gap",
    riskIfNotUpdated: "Breach Response Plan still instructs staff to notify within 48h. If a breach occurs under the amended DSA, Southlake would miss the 24h contractual deadline. Penalty exposure + regulatory risk.",
    beforeText: "§4.2: Upon discovery of a reportable security incident, the Privacy Office shall notify the affected party within forty-eight (48) hours of confirmation.",
    afterText: "§4.2: Upon discovery of a reportable security incident under the amended DSA, the Privacy Office shall notify the affected party within twenty-four (24) hours of confirmation. Escalation to CIO required within 2 hours of discovery.",
    keyChanges: ["Notification deadline: 48 hours → 24 hours", "New: CIO escalation within 2 hours of discovery", "Applies only to incidents under amended DSA (not all breaches)"],
  },
  {
    sourceNum: 11,
    sourceClause: "§2.1 New Data Elements (ICD-10 codes)",
    targetName: "Data Classification Register",
    targetClause: "§3 Controlled Data Types",
    changeDescription: "Amendment adds ICD-10-CM and ATC drug codes to shared data",
    status: "unknown",
    riskIfNotUpdated: "ICD-10 codes are not yet listed in Southlake's data classification register. Without classification, encryption and access controls for these new data types may not be in place. Unintended disclosure risk.",
    beforeText: "§3: Controlled data types include: patient demographics, lab results, medication records (ATC Level 4), encounter summaries. ICD-10 codes are not listed.",
    afterText: "§3: Controlled data types include: patient demographics, lab results, medication records (ATC Level 4), encounter summaries, ICD-10-CM diagnosis codes, ICD-10-CA procedure codes, drug class (ATC Level 2). All classified as SENSITIVE per PHIPA s.39.",
    keyChanges: ["Add ICD-10-CM diagnosis codes to controlled types", "Add ICD-10-CA procedure codes to controlled types", "Add ATC Level 2 drug class to controlled types", "All new types classified as SENSITIVE"],
  },
  {
    sourceNum: 11,
    sourceClause: "§3.2 Annual Penetration Testing",
    targetName: "Vendor Security Requirements Doc",
    targetClause: "§5.4 Third-party Security Testing",
    changeDescription: "Amendment requires RHN to undergo annual third-party pen-testing",
    status: "unknown",
    riskIfNotUpdated: "Southlake's vendor security requirements don't mention annual pen-testing. If RHN doesn't comply, Southlake has no contractual basis to enforce it or to terminate.",
    beforeText: "§5.4: Third-party vendors shall maintain a current SOC 2 Type II report and provide it to Southlake annually. No penetration testing requirement specified.",
    afterText: "§5.4: Third-party vendors shall maintain a current SOC 2 Type II report and provide it to Southlake annually. Vendors handling SENSITIVE data shall undergo annual third-party penetration testing. A summary report (critical/high findings remediated) shall be delivered to Southlake CISO within 90 days.",
    keyChanges: ["New: annual third-party pen-testing required", "Applies to vendors handling SENSITIVE data", "Report deadline: 90 days to CISO", "Critical/high findings must be remediated before report"],
  },
  {
    sourceNum: 10,
    sourceClause: "§4.1 Permitted Data Elements",
    targetName: "Research Data Use Protocol",
    targetClause: "§2 Scope of Permitted Data",
    changeDescription: "Base DSA limits data to de-identified outcomes only",
    status: "synced",
    riskIfNotUpdated: "Protocol correctly reflects base DSA scope. No gap.",
    beforeText: "§2: Permitted data: de-identified patient outcomes, encounter summaries, lab results. No ICD-10 codes, no medication class data.",
    afterText: "§2: Permitted data: de-identified patient outcomes, encounter summaries, lab results. No ICD-10 codes, no medication class data. (Matches DSA §4.1)",
    keyChanges: [],
  },
  {
    sourceNum: 10,
    sourceClause: "§11.3 Breach Notification (48h)",
    targetName: "Southlake Privacy Office SOP",
    targetClause: "Step 3: Notify within 48 hours",
    changeDescription: "Base DSA specifies 48h breach notification to RHN",
    status: "gap",
    riskIfNotUpdated: "SOP says 48h but Amendment #11 (pending) changes this to 24h. Once the amendment is executed, the SOP becomes outdated. Privacy Office may miss the tighter deadline.",
    beforeText: "Step 3: Within 48 hours of confirming a breach, the Privacy Office shall notify the affected party in writing, including: nature of breach, data types affected, estimated record count, and contact person.",
    afterText: "Step 3: Within 24 hours of confirming a breach under the amended DSA, the Privacy Office shall notify the affected party in writing, including: nature of breach, data types affected, estimated record count, contact person, and immediate CIO notification. For all other breaches: 48 hours.",
    keyChanges: ["Dual timeline: 24h for amended DSA breaches, 48h for all others", "New: immediate CIO notification required", "Written notification content: unchanged"],
  },
  {
    sourceNum: 9,
    sourceClause: "§5.2 Cybersecurity Requirements",
    targetName: "IT Operations Runbook v4",
    targetClause: "Appendix B: Vendor Security Controls",
    changeDescription: "MSA §5.2 now requires zero-trust access for all vendor personnel",
    status: "gap",
    riskIfNotUpdated: "Runbook still documents legacy VPN-based access for vendor staff. If audited, Southlake cannot demonstrate zero-trust compliance for MSA-covered vendors.",
    beforeText: "Vendor access: Standard VPN with MFA. Access granted per onboarding form. Review annually.",
    afterText: "Vendor access: Zero-trust architecture per MSA §5.2. Device attestation required. Conditional access policies enforced. Review quarterly + on any role change.",
    keyChanges: ["Zero-trust access model", "Device attestation requirement", "Quarterly review cadence"]
  },
  {
    sourceNum: 10,
    sourceClause: "§3.4 PHI De-identification Standard",
    targetName: "Research Data Governance Policy",
    targetClause: "§4.1 De-identification Methods",
    changeDescription: "DSA #10 now mandates HIPAA Safe Harbor de-identification (18-field removal)",
    status: "gap",
    riskIfNotUpdated: "Research policy still references k-anonymity (k=5). Safe Harbor is stricter — current method would not meet the DSA requirement. Risk of re-identification in research outputs.",
    beforeText: "De-identification: k-anonymity model, k≥5. Minimum cell size 5. Expert determination per HIPAA §164.514(b)(2).",
    afterText: "De-identification: HIPAA Safe Harbor method per DSA §3.4. All 18 identifiers removed. No re-identification attempts. Validation: quarterly sampling (n=100) by Privacy Officer.",
    keyChanges: ["Safe Harbor method (not k-anonymity)", "18-field removal mandate", "Quarterly validation sampling"]
  },
  {
    sourceNum: 13,
    sourceClause: "§7.1 Environmental Liability & Indemnification",
    targetName: "Risk Register (Enterprise)",
    targetClause: "Entry #ENV-2024-03",
    changeDescription: "Waste management contract adds Southlake as indemnified party for hazardous material spills",
    status: "gap",
    riskIfNotUpdated: "Enterprise risk register still lists waste vendor liability under 'Operational' (low). Per new contract §7.1, spill liability transfers to Southlake. Risk score must be upgraded to 'High' and insurance rider required.",
    beforeText: "Risk: Vendor handles all environmental liability. Southlake exposure: None. Category: Operational (Low).",
    afterText: "Risk: Per Contract #13 §7.1, Southlake indemnifies vendor for hazardous material spills on-site. Southlake exposure: Unlimited. Category: Environmental (High). Action: Add insurance rider within 30 days.",
    keyChanges: ["Liability transfer to Southlake", "Unlimited exposure", "Insurance rider required within 30 days"]
  }
]

// Map contract name → flags for the detail panel
export const flagsByContract: Record<string, Flag[]> = {}
for (const c of contracts) {
  flagsByContract[`Contract_${c.num}_${c.name.split("—")[0].trim().split(" ")[0]}`] = c.flags
}
export const flagsByNum: Record<number, Flag[]> = {}
for (const c of contracts) {
  flagsByNum[c.num] = c.flags
}

// Pipeline stage definitions
export const pipelineStages = [
  { label: 'Document Input', icon: '📄', desc: 'PDF / DOCX / Image upload' },
  { label: 'Agnes OCR', icon: '👁️', desc: 'Text extraction & structured parsing' },
  { label: 'Rules Engine', icon: '⚙️', desc: '25+ validated policy rules' },
  { label: 'Jev Decision', icon: '🎯', desc: 'Typed risk classification' },
  { label: 'Evidence Store', icon: '📋', desc: 'Audit trail + citations' },
  { label: 'Human Review', icon: '👤', desc: 'Escalation queue' },
]

// ── Portfolio-level compliance stats (v6) ──
export const portfolioStats = {
  totalContracts: contracts.length,
  criticalCount: contracts.filter(c => c.riskLevel === "Critical").length,
  highCount: contracts.filter(c => c.riskLevel === "High").length,
  lowCount: contracts.filter(c => c.riskLevel === "Low").length,
  totalFlags: contracts.reduce((s, c) => s + c.flagsCount, 0),
  totalHardGaps: contracts.reduce((s, c) => s + c.compliance.hardGaps, 0),
  totalBpGaps: contracts.reduce((s, c) => s + c.compliance.bpGaps, 0),
  avgRiskScore: contracts.reduce((s, c) => s + c.riskScore, 0) / contracts.length,
  avgComplianceRate: contracts.reduce((s, c) => s + c.compliance.complianceRate, 0) / contracts.length,
  // Priority remediation: top 5 by risk score
  priorityList: [...contracts].filter(c => c.flagsCount > 0).sort((a, b) => b.riskScore - a.riskScore).slice(0, 5),
}