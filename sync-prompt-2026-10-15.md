# Prototype Spec — Critical Corporate Document Management
## Southlake Health · 2026-10-15

Repo: `github.com/murphywenjun-del/critical-corporate-document-management`
Live demo: `https://murphywenjun-del.github.io/critical-corporate-document-management/`

---

## Background

Building a prototype for **Southlake Health** (400→500 bed tertiary referral hospital, Newmarket ON). The system ingests contracts, amendments, and policies via a **local LLM** (Llama 3.1 8B / Ollama) — no cloud, PHI stays on-site. It extracts key fields, runs rule checks, scores risks, and presents findings in a dashboard.

All current data is synthetic (11 contracts). Alicia will replace with de-identified real documents.

---

## 1. Risk Taxonomy — HEROC

The client's risk framework is **HEROC**, not generic "risk categories".

**Level 1 — 4 categories:**
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

**Every risk flag carries all three levels** (category → subcategory → department). The UI filter is context-aware: selecting a subcategory narrows the department options to those mapped under it.

---

## 2. L×I Quantitative Scoring

**5×5 Likelihood × Impact matrix.** Score = L × I, range 1–25.

**Labels must be short and plain-language** (audience is hospital staff, not risk analysts):
```
Likelihood:  1=Rare · 2=Unlikely · 3=Might happen · 4=Likely · 5=Will happen
Impact:      1=Tiny · 2=Small · 3=Noticeable · 4=Major · 5=Severe
```

**Color bands:**
```
Score ≥20 → red       12–19 → orange       6–11 → yellow       <6 → green
```

Show a **Risk Matrix tab** (5×5 grid, color-coded, with methodology panel explaining the scoring). Show L, I, Score columns in the risk register table.

---

## 3. Amendment Tracking — Closed Loop

**5-step workflow:**
```
pending → reviewed → executed → verified → archived
```

Requirements:
- **Parent → child visual link**: show which amendment belongs to which parent contract
- **Expandable detail cards**: click to reveal risk flags, key fields, status buttons
- **Human verification at `verified`**: show a checklist (signatures collected, effective date correct, cross-referenced docs updated)
- **Bidirectional status changes**: user can move forward OR backward (e.g. verified → pending) to prevent mis-taps
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
  supersedesOriginal: boolean  // true = replaces original, false = extends
}

interface ContractDoc {
  baseContractId: number | null  // null = not an amendment; N = parent contract #
  amendments?: Amendment[]
}
```

---

## 4. Document Impact Cascades (Cross-Refs)

**Purpose:** When Doc A changes, Doc B/C may need updating. The system should **discover gaps the hospital hasn't noticed** — not just track parent→amendment links.

**5-step workflow:**
```
detected → acknowledged → fixing → verified → closed
```

**Each cross-ref entry:**
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
  keyChanges: string[]      // specific clause-level changes
}
```

**Status colors:** synced=green, gap=red, unknown=yellow.

**Same modal confirmation pattern** as amendments (before/after + key changes + verification checklist on `verified`).

**Demo data — 6 cross-refs:**
```
#10 DSA §3.2       → Security & Privacy Policy §4.1      GAP      (retention 24mo vs 48mo)
#10 DSA §5.1       → Breach Response Plan §2.3           GAP      (48h vs 24h notification)
#10 DSA §7.2       → Records Mgmt Schedule Item 12       UNKNOWN  (audit rights missing)
#11 Amendment §2.1 → #10 DSA §3.2                        SYNCED   (amendment updates parent)
#2 MOU §8          → #5 NDA §4                            GAP      (confidentiality term mismatch)
#9 IT MSA §12      → #9 IT MSA Exhibit B                  SYNCED   (SLA credits aligned)
```

---

## 5. Multi-Dimensional Search

**4-level context-aware filters** (Risk Register tab):
```
Severity (All / Critical / High / Medium / Low)
  → HEROC Category (All / Operational / Financial / Reputational / Continuity)
    → Subcategory (context-aware: options narrow to selected category)
      → Clinical Dept (context-aware: options narrow to selected subcategory)
```

**Sidebar filters (persistent, apply across all tabs):**
- Contract Type: NDA / MOU / Procurement / Data_Sharing
- Risk Level: Low / Critical
- Department: 22 Southlake departments
- Expiry: Expired / <30d / <90d / >90d

**Expiry Tickler (Deadlines tab):**
- Sorted by urgency: expired → <30d → <90d → >90d
- Color-coded rows: red / orange / yellow / green
- Show renewal notice deadline (how many days before expiry the notice must be sent)

---

## 6. UI Requirements

- **6 tabs**: Risk Register · Risk Matrix · Contracts · Deadlines · Amendments · Cross-Refs
- **Left sidebar**: settings (repo path, expiry date, local AI toggle, model selector, signing authority) + filters
- **Flat professional design**: teal/white, no gradients, no animations, no gratuitous shadows
- **Expandable detail cards** everywhere (contracts, amendments, cross-refs)
- **Modal confirmation** for all status changes (in-page, not browser dialog)
- **KPI row** at top: document count, critical flags, expired/expiring, avg compliance %

---

## 7. Data Constraints

- **No cloud**: all LLM inference via Ollama (local). No API keys sent to US cloud.
- **PHIPA compliance**: any data handling must support audit logging (who did what, when).
- **De-identified demo data**: current 11 contracts are synthetic. Replace with Alicia's real (de-identified) docs when available.

---

## 8. Open / Pending

- [ ] Replace synthetic data with de-identified real contracts (waiting on Alicia)
- [ ] Validate precise clause location accuracy across page breaks (OCR)
- [ ] Determine hosting: GitHub Pages (static only) vs Vercel/Railway (can run Python API)
- [ ] Add PHIPA audit log (timestamped action history)
- [ ] Bulk import: upload a folder of contracts at once

---

## Quick Start

```bash
git clone https://github.com/murphywenjun-del/critical-corporate-document-management.git
cd critical-corporate-document-management/web-dashboard
npm install && npm run dev   # → http://localhost:5173
```
