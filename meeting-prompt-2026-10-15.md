# Prototype Action Prompt — Southlake Health Document Management
## 2026-10-15

You are building a **Critical Corporate Document Management** prototype for Southlake Health (400→500 bed tertiary referral hospital, Newmarket ON). The system ingests contracts, amendments, and policies via a **local LLM** (no cloud, PHI stays on-site), extracts key fields, runs rule checks, scores risks, and presents findings in a web dashboard.

All current data is synthetic (11 contracts, 39 risk flags, 6 cross-ref links, 3 amendments). Real de-identified contracts will replace these later.

---

## Constraints

- **No cloud**: all LLM inference runs locally (Ollama + Llama). No PHI leaves the hospital boundary.
- **PHIPA**: any data handling must support audit logging (who did what, when).
- **HEROC is the client's risk taxonomy** (Operational / Financial / Reputational / Continuity), not generic "risk categories".
- **Labels must be short, plain-language** — hospital staff audience, not risk analysts.
- **Flat professional UI**: teal/white, no gradients, no animations.

---

## What to Build

### 1. HEROC Risk Taxonomy (P0)

3-level structure, every risk flag carries all three:

**Level 1 — 4 HEROC categories:**
```
Operational · Financial · Reputational · Continuity
```

**Level 2 — 14 subcategories:**
```
Operational:
  Clinical Practice · Staffing & HR · IT Systems & Security ·
  Procurement & Vendors · Facilities & Safety

Financial:
  Budget & Licensing · Contract Pricing · IP & Indemnity

Reputational:
  Data Privacy & PHIPA · Public Relations · Patient Experience

Continuity:
  Access & Availability · Termination & Exit · Data Migration & Audit
```

**Level 3 — 15 Southlake clinical departments mapped to subcategories:**

| Subcategory | Departments |
|---|---|
| Clinical Practice | Emergency, Cardiac/CICU, Critical Care/ICU, Surgery, Paediatrics, Maternal Child |
| Staffing & HR | Mental Health, Geriatrics, Palliative Care |
| IT Systems & Security | Diagnostics, Cancer (Stronach), Rehabilitation, Restorative Care |
| Procurement & Vendors | Family Medicine, Anesthesiology |
| Facilities & Safety | Cancer (Stronach), Surgery |
| Budget & Licensing | Cancer (Stronach), Cardiac/CICU, Critical Care/ICU |
| Contract Pricing | Surgery, Diagnostics |
| IP & Indemnity | Cancer (Stronach), Paediatrics |
| Data Privacy & PHIPA | Maternal Child, Mental Health, Paediatrics |
| Public Relations | Cancer (Stronach), Emergency |
| Patient Experience | Palliative Care, Geriatrics, Restorative Care |
| Access & Availability | Emergency, Cardiac/CICU, Critical Care/ICU, Cancer (Stronach) |
| Termination & Exit | Surgery, Anesthesiology |
| Data Migration & Audit | Diagnostics, Paediatrics, Research |

---

### 2. L×I Quantitative Scoring (P0)

**5×5 Likelihood × Impact matrix.** Score = L × I, range 1–25.

**Labels (short, plain-language):**
```
Likelihood:  1=Rare · 2=Unlikely · 3=Might happen · 4=Likely · 5=Will happen
Impact:      1=Tiny · 2=Small · 3=Noticeable · 4=Major · 5=Severe
```

**Color bands:**
```
Score ≥20 → red       12–19 → orange       6–11 → yellow       <6 → green
```

Build:
- A **Risk Matrix tab** (5×5 grid, color-coded, with methodology panel explaining scoring)
- L, I, Score columns in the risk register table with color coding
- Every flag carries `likelihood` (1–5), `impact` (1–5), `risk_score` (L×I)

---

### 3. Pre-set Risk Triggers (P0)

4 specific triggers the client explicitly named:

1. **Dual signature check** — flag if fewer than 2 VP-level signatures on contracts that require it
2. **Governing law mismatch** — flag if the contract's governing law doesn't match Southlake's default (Ontario)
3. **Auto-renewal clause** — flag if the contract auto-renews without explicit opt-out mechanism
4. **Cybersecurity gap** — flag if data security / encryption / breach notification clauses are missing or below standard

Each trigger produces a risk flag with: severity, likelihood, impact, risk_score, HEROC category, subcategory, department.

---

### 4. Amendment Closed-Loop (P0)

Track amendments through a 5-step lifecycle:
```
pending → reviewed → executed → verified → archived
```

Requirements:
- **Parent → child visual link**: amendment doc card shows which parent contract it belongs to
- **Expandable detail cards**: click to reveal risk flags, key fields, status buttons
- **Human verification at `verified`**: show checklist (signatures collected, effective date correct, cross-referenced docs updated)
- **Bidirectional status changes**: user can move forward OR backward to prevent mis-taps
- **Modal confirmation on every status change**: in-page modal (not `window.confirm()`) showing:
  - Document name + target
  - Before/after content (red/green boxes)
  - Key changes list
  - Status transition (from → to)
  - Verification checklist if moving to `verified`

**Data model:**
```typescript
interface Amendment {
  id: number
  label: string
  effectiveDate: string
  keyChanges: string[]
  supersedesOriginal: boolean
}

interface ContractDoc {
  baseContractId: number | null  // null = not an amendment; N = parent contract #
  amendments?: Amendment[]
}
```

---

### 5. Document Impact Cascades — Cross-Refs (P0)

When Doc A changes, detect which parts of Doc B/C need updating. Goal: find gaps the hospital hasn't noticed.

**5-step workflow:**
```
detected → acknowledged → fixing → verified → closed
```

**Data model:**
```typescript
interface DocLink {
  sourceNum: number          // contract # that changed
  sourceClause: string       // e.g. "§3.2"
  targetName: string         // affected document
  targetClause: string       // e.g. "§4.1"
  changeDescription: string
  status: string             // 'synced' | 'gap' | 'unknown'
  riskIfNotUpdated: string
  beforeText: string         // what target currently says
  afterText: string         // what it should say
  keyChanges: string[]       // specific clause-level changes
}
```

**Status colors:** synced=green, gap=red, unknown=yellow.

**Modal confirmation** on every status change (same pattern as amendments: before/after + key changes + verification checklist on `verified`).

**Include at least 6 demo cross-refs in the data.**

---

### 6. Multi-Dimensional Search (P1)

**4-level context-aware filters** (risk register tab):
```
Severity (All / Critical / High / Medium / Low)
  → HEROC Category (All / Operational / Financial / Reputational / Continuity)
    → Subcategory (context-aware: options narrow to selected category)
      → Clinical Dept (context-aware: options narrow to selected subcategory)
```

**Sidebar filters (persistent across all tabs):**
- Contract Type: NDA / MOU / Procurement / Data_Sharing
- Risk Level: Low / Critical
- Department: 22 Southlake departments (15 clinical + 7 admin)
- Expiry: Expired / <30d / <90d / >90d

**Data model:**
```typescript
interface ContractDoc {
  department: string        // Southlake department
  expiryDate: string        // ISO date
  renewalNoticeDays: number // days before expiry to send renewal notice
}

interface Flag {
  risk_category: string     // HEROC 4 categories
  subcategory: string       // 14 subcategories
  department: string        // Southlake department
}
```

---

### 7. Expiry Tickler (P1)

A **Deadlines tab** listing all contracts sorted by urgency:
- 4 KPI cards at top: Expired count / <30d count / <90d count / Active count
- Each row: contract name, expiry date, days remaining, renewal notice deadline, color-coded urgency bar
- Expired = red, <30d = orange, <90d = yellow, >90d = green
- Sorted ascending by days remaining (most urgent first)

---

### 8. Compliance Dashboard — Hard vs Best Practice (P1)

Separate view showing:
- Two columns: "Hard Gaps" (red) vs "Best Practice Gaps" (yellow)
- Each gap: contract name, specific clause, what's missing, severity
- Compliance rate % per contract (hard gaps only)
- Remediation list ordered by risk_score descending

---

### 9. Cross-Page Clause Validation (P1)

Verify that when a clause spans a page break in a PDF, the system correctly identifies the clause boundary without truncation or mis-attribution.

Acceptance:
- Test with 3 PDFs that have clauses spanning page breaks
- Confirm extracted clause text is complete and attributed to the correct section number
- Document any failures with page numbers

---

### 10. Test with Fabricated Documents (client request)

The client explicitly requested: "The project team will test the platform with completed documents containing fabricated information."

- Create 5–8 synthetic "completed" contracts (fully signed, no gaps, all fields present)
- Run through the pipeline
- Confirm: **zero flags, 100% compliance rate, no false positives**
- Document results to show the client the system doesn't cry wolf on clean documents

---

## UI Spec

- **6 tabs**: Risk Register · Risk Matrix · Contracts · Deadlines · Amendments · Cross-Refs
- **Left sidebar**: settings (repo path, expiry date, local AI toggle, model selector, signing authority) + filters
- **Flat professional design**: teal/white, no gradients, no animations, no heavy shadows
- **Expandable detail cards** for contracts, amendments, cross-refs
- **In-page modal** (not `window.confirm()`) for all status changes
- **KPI row** at top: document count · critical flags · expired/expiring · avg compliance %

---

## P0 vs P1

| Priority | Items |
|----------|-------|
| **P0** (before next client meeting) | HEROC taxonomy · L×I scoring · Pre-set triggers · Amendment closed-loop · Cross-ref cascades |
| **P1** (next sprint) | Compliance dashboard · Multi-dim search · Expiry tickler · Cross-page validation · Fabricated doc test · Deployment confirmation |

---

## Client Action Items (for tracking, not our build scope)

- Sam Fielding: provide legacy contracts + recurring problems
- Tanya Howell: guide Alicia on redaction sensitivity
- Sonia Pagura: share updated operational/financial/reputational contacts
- Alicia: prepare anonymized contract documents
- Matthew Meyer + Sam Fielding: coordinate with Warren on technical transfer
- Ivy Team: define hosting/infrastructure/handover requirements, meet with EA manager on deployment environment
