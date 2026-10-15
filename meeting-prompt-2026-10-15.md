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
| Compliance dashboard: hard gaps vs best-practice gaps shown separately | P1 | ✅ Done |
| Amendment tracking: link amendments to parent contracts, superseded docs archived but retained | P0 | ✅ Done |
| Multi-dimensional search: filter by department / contract type / expiry date | P1 | ✅ Done |
| Expiry tickler: reminders for termination & renewal dates, color-coded by urgency | P1 | ✅ Done |
| Precise clause location: cross-page identification accuracy | P1 | ⚠️ Needs validation with OCR |

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

## UI Requirements

- 6 tabs: Risk Register · Risk Matrix · Contracts · Deadlines · Amendments · Cross-Refs
- Left sidebar: settings (repo, expiry date, local AI toggle, model, signing authority) + filters
- Flat professional design: teal/white, no gradients, no animations
- Expandable detail cards for contracts, amendments, cross-refs
- In-page modal (not `window.confirm()`) for all status changes
- KPI row: document count · critical flags · expired/expiring · avg compliance %
