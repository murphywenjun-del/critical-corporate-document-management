# Client Meeting #3 — Action Prompt
## Southlake Health · 2026-10-15

**Attendees:** Sam Fielding (CIO), Sonia Pagura (CPO), Matthew Meyer, Tanya Howell (Legal), Nicole (demo) — client side. Wenjun (Ivy) — host + demo.

---

## Decisions Made

### 1. Risk Taxonomy → HEROC (P0, confirmed)

- Client confirmed the risk framework is **HEROC**, not ROCK (which was discussed earlier but rejected)
- 4 top-level categories: **Operational / Financial / Reputational / Continuity**
- Every risk flag must carry both `category` and `subcategory`
- Scoring: **Likelihood (1–5) × Impact (1–5)** = score 1–25. Replaces the old Low/Med/High scale
- Labels must be short, plain-language (hospital staff audience, not risk analysts)

### 2. System Features (P0–P1, confirmed)

| Feature | Priority | Status at meeting |
|---|---|---|
| Compliance dashboard: hard gaps vs best-practice gaps shown separately | P1 |  |
| Amendment tracking: link amendments to parent contracts, superseded docs archived but retained | P0 |  |
| Multi-dimensional search: filter by department / contract type / expiry date | P1 |  |
| Expiry tickler: reminders for termination & renewal dates, color-coded by urgency | P1 |  |
| Precise clause location: cross-page identification accuracy | P1 |  |

### 3. Deployment & Handover

- **Local Llama model** deployment unchanged (no cloud, data stays on-site)
- Need to confirm deployment environment with **Wilson (EA)**
- 400 real documents transition plan: TBD
- Phase 2 (admin role + AD/LDAP integration): **out of scope for this phase**

### 4. Cross-Referencing (new, from client)

- Client explicitly requested: "The project team will incorporate cross-referencing between original contracts and associated amendments into the prototype"
- Purpose: discover document impact cascades — if Doc A changes, which parts of Doc B/C need updating?
- Goal: find gaps the hospital hasn't noticed yet

---

## Action Items (Ivy Team)

| # | Task | Priority |
|---|---|---|
| 1 | Align HEROC categories + add `subcategory` field to every flag | P0 |
| 2 | Implement L×I scoring (1–25) in UI, color-coded, with Risk Matrix tab | P0 |
| 3 | Pre-set risk triggers: dual signature / governing law / auto-renewal / cybersecurity | P0 |
| 4 | Amendment tracking: data model (parent↔child) + closed-loop UI workflow | P0 |
| 5 | Document impact cascades: cross-ref detection + status tracking | P0 |
| 6 | Compliance dashboard: hard vs best-practice gap view | P1 |
| 7 | Multi-dimensional search: department / type / expiry filters | P1 |
| 8 | Expiry tickler: urgency-colored deadline reminders | P1 |
| 9 | Precise clause cross-page validation (OCR) | P1 |
| 10 | Confirm deployment environment with Wilson (EA) | P1 |

---

## Constraints (from client)

- **No cloud**: all LLM inference must run locally (Ollama + Llama). No PHI to US cloud.
- **PHIPA**: any data handling must support audit logging (who did what, when)
- **400 real docs**: transition plan needed, but Phase 1 uses synthetic demo data
- **De-identified contracts**: Alicia will provide; use to replace current synthetic data

---

## What to Build / Verify

### P0 (must be done before next client meeting)

1. **HEROC alignment** — every flag has `risk_category` (4 values) + `subcategory` (14 values). UI shows both.
2. **L×I scoring** — 5×5 matrix, score = L×I, color bands (red ≥20, orange 12–19, yellow 6–11, green <6). Risk Matrix tab with methodology panel.
3. **Amendment closed-loop** — 5-step workflow (pending→reviewed→executed→verified→archived), human verification at `verified`, bidirectional status changes, modal confirmation showing before/after content.
4. **Cross-ref impact cascades** — 5-step workflow (detected→acknowledged→fixing→verified→closed), each cross-ref shows `beforeText` / `afterText` / `keyChanges`, status = synced/gap/unknown.
5. **Pre-set risk triggers** — at minimum: dual signature check, governing law mismatch, auto-renewal clause, cybersecurity gap.

### P1 (nice to have, can be next sprint)

6. **Compliance dashboard** — separate view for hard compliance gaps vs best-practice gaps, with compliance rate %.
7. **Multi-dimensional search** — 4-level context-aware filters: Severity → HEROC Category → Subcategory → Clinical Department.
8. **Expiry tickler** — Deadlines tab sorted by urgency (expired→<30d→<90d→>90d), color-coded, shows renewal notice deadline.
9. **Cross-page clause validation** — verify that the system can accurately locate a clause that spans page breaks in a PDF. Needs OCR engine.
10. **Deployment confirmation** — meet with Wilson (EA) to confirm: Ollama host, Llama model size, disk requirements, network isolation.

---

## Demo Data (current state)

- 11 synthetic contracts in `research/contracts/` (NDA, MOU, IT MSA, DSA, Procurement, Marketing, Clinical Trial, Lease, + amendments)
- 39 risk flags across all contracts
- 6 cross-ref links (2 synced, 3 gap, 1 unknown)
- 3 amendments (1 on MOU, 1 on DSA, 1 standalone amendment doc)
- All data in `web-dashboard/src/data.ts` (static, no API needed for demo)

---

## New Features — What We Need to Build (from meeting)

These are the specific new features the client requested that are **not yet in the prototype**. Each one has a clear scope and acceptance criteria.

### N1. Multi-Dimensional Search (需新增)
- **What**: Filter the risk register and contract list by **department**, **contract type**, and **expiry date window** simultaneously
- **Where**: Left sidebar (persistent across all tabs) + quick filters above the Risk Register table
- **Acceptance**: Selecting "Department = IT" + "Expiry = <90d" + "Type = NDA" returns only matching flags. 4-level cascade: Severity → HEROC Category → Subcategory → Clinical Dept (each level narrows the next)
- **Data needed**: Every `ContractDoc` has `department` + `expiryDate` + `renewalNoticeDays`. Every `Flag` has `risk_category` + `subcategory` + `department`

### N2. Expiry Tickler (需新增)
- **What**: A **Deadlines tab** that lists all contracts sorted by urgency, with color-coded urgency bars
- **Where**: 5th tab in the main navigation
- **Acceptance**: 
  - 4 KPI cards at top: Expired count / <30d count / <90d count / Active count
  - Each row shows: contract name, expiry date, days remaining, renewal notice deadline, urgency color bar
  - Expired = red bg, <30d = orange, <90d = yellow, >90d = green
  - Sorted ascending by days remaining (most urgent first)
- **Data needed**: `expiryDate` (ISO date) + `renewalNoticeDays` (int) on every `ContractDoc`

### N3. Precise Clause Location — Cross-Page Validation (需验证)
- **What**: Verify that when a clause spans a page break in a PDF, the system correctly identifies the clause boundary and doesn't truncate or mis-attribute
- **Where**: Testing/verification task, not a UI feature
- **Acceptance**: 
  - Take 3 real PDFs with clauses spanning page breaks
  - Run the OCR + extraction pipeline
  - Confirm the extracted clause text is complete and attributed to the correct section number
  - Document any failures with page numbers
- **Blocker**: Needs OCR engine running. Currently uses Agnes OCR (`agnes_ocr.py`)

### N4. Pre-set Risk Triggers (P0, 需新增)
- **What**: 4 specific risk triggers that the client explicitly named, pre-loaded into the rules engine
- **Triggers**:
  1. **Dual signature check** — flag if fewer than 2 VP-level signatures on contracts that require it
  2. **Governing law mismatch** — flag if the contract's governing law doesn't match Southlake's default (Ontario)
  3. **Auto-renewal clause** — flag if the contract auto-renews without explicit opt-out mechanism
  4. **Cybersecurity gap** — flag if data security / encryption / breach notification clauses are missing or below standard
- **Where**: `test_framework.py` (Python rules engine) + `data.ts` (demo data)
- **Acceptance**: Each trigger produces a `Flag` with correct `severity`, `likelihood`, `impact`, `risk_category`, `subcategory`, `department`

### N5. Document Impact Cascades — Cross-Refs (需新增)
- **What**: When a contract is amended, automatically detect which OTHER documents reference the changed clauses and flag them as needing updates
- **Where**: 6th tab (Cross-Refs) + data model
- **Acceptance**:
  - `DocLink` model: `sourceNum` → `targetName` + `targetClause` + `status` (synced/gap/unknown)
  - Each link shows `beforeText` / `afterText` / `keyChanges`
  - 5-step workflow: detected → acknowledged → fixing → verified → closed
  - Modal confirmation on every status change (shows before/after + key changes)
  - At least 6 demo cross-refs in the data

### N6. Amendment Closed-Loop (需新增)
- **What**: Track amendments through a 5-step lifecycle with human verification
- **Where**: 5th tab (Amendments)
- **Acceptance**:
  - 5-step workflow: pending → reviewed → executed → verified → archived
  - Parent → child visual link (amendment doc card shows which parent it belongs to)
  - Expandable detail cards: risk flags, key fields, status buttons
  - Bidirectional status changes (can go backward to prevent mis-taps)
  - Modal confirmation showing before/after content + key changes + verification checklist
- **Data needed**: `Amendment` interface + `ContractDoc.baseContractId` + `ContractDoc.amendments[]`

### N7. Compliance Dashboard — Hard vs Best Practice (需增强)
- **What**: Separate view showing hard compliance gaps (mandatory requirements not met) vs best-practice gaps (should-haves, not legally required)
- **Where**: Could be a section within the Risk Register tab or a standalone KPI panel
- **Acceptance**:
  - Two columns or side-by-side cards: "Hard Gaps" (red) vs "Best Practice" (yellow)
  - Each gap shows: contract name, specific clause, what's missing, severity
  - Compliance rate % per contract (hard gaps only)
  - Remediation list: ordered by risk_score descending

### N8. Test with Fabricated Documents (client request)
- **What**: Client explicitly requested: "The project team will test the platform with completed documents containing fabricated information"
- **Acceptance**:
  - Create 5–8 synthetic "completed" contracts (fully signed, no gaps)
  - Run through the pipeline
  - Confirm: zero flags, 100% compliance rate, no false positives
  - Document the test results
- **Purpose**: Show the client the system doesn't cry wolf on clean documents

---

## UI Requirements

- 6 tabs: Risk Register · Risk Matrix · Contracts · Deadlines · Amendments · Cross-Refs
- Left sidebar: settings (repo, expiry date, local AI toggle, model, signing authority) + filters
- Flat professional design: teal/white, no gradients, no animations
- Expandable detail cards for contracts, amendments, cross-refs
- In-page modal (not `window.confirm()`) for all status changes
- KPI row: document count · critical flags · expired/expiring · avg compliance %
