# Sync Prompt — Critical Corporate Document Management Prototype
## 2026-10-15 Session (v7 → v10)

Share this prompt with your teammate to sync on today's changes.
Repo: `github.com/murphywenjun-del/critical-corporate-document-management`
Live demo: `https://murphywenjun-del.github.io/critical-corporate-document-management/`

---

## Context (read first)

We are building a **Critical Corporate Document Management** prototype for **Southlake Health**
(400→500 bed tertiary referral hospital, Newmarket ON). The system:

- Ingests contracts / amendments / policies via local LLM (Llama 3.1 8B via Ollama) — **no cloud, data stays on-site**
- Extracts key fields (parties, expiry, signatures, indemnity caps, SLAs, PHIPA clauses)
- Runs 22 rule checks → 39 risk flags with **quantitative L×I scoring (1–25)**
- Maps risks to the client's **HEROC taxonomy** (Operational / Financial / Reputational / Continuity)
- Tracks **amendments** and **document impact cascades** with a 5-step closed-loop workflow
- Presents everything in a React dashboard with **4-level context-aware filters**

All demo data is synthetic (`research/contracts/01–11`). Alicia will replace with de-identified real contracts.

---

## What Changed Today

### 1. HEROC Risk Taxonomy Alignment (P0) — DONE

The client uses **HEROC**, not generic "risk categories". We aligned the system:

**Level 1 — 4 HEROC categories:**
```
Operational · Financial · Reputational · Continuity
```

**Level 2 — 14 subcategories** (in `data.ts` → `HEROC_SUBCATS`):
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

**Level 3 — 15 Southlake clinical departments mapped to subcategories** (`SUBCAT_DEPTS`):
```
Clinical Practice    → Emergency, Cardiac/CICU, Critical Care/ICU, Surgery, Paediatrics, Maternal Child
Staffing & HR        → Mental Health, Geriatrics, Palliative Care
IT Systems & Security→ Diagnostics, Cancer (Stronach), Rehabilitation, Restorative Care
Procurement & Vendors→ Family Medicine, Anesthesiology
Facilities & Safety  → Cancer (Stronach), Surgery
Budget & Licensing   → Cancer (Stronach), Cardiac/CICU, Critical Care/ICU
Contract Pricing     → Surgery, Diagnostics
IP & Indemnity       → Cancer (Stronach), Paediatrics
Data Privacy & PHIPA → Maternal Child, Mental Health, Paediatrics
Public Relations     → Cancer (Stronach), Emergency
Patient Experience   → Palliative Care, Geriatrics, Restorative Care
Access & Avail       → Emergency, Cardiac/CICU, Critical Care/ICU, Cancer (Stronach)
Termination & Exit   → Surgery, Anesthesiology
Data Migration       → Diagnostics, Paediatrics, Research
```

**Where to find it:**
- `data.ts` → `HEROC_SUBCATS`, `SUBCAT_DEPTS`, `SOUTHDEPARTMENTS` (22 depts)
- `data.ts` → every `Flag` object has `subcategory` + `department` fields
- `test_framework.py` → `SUBCATEGORY_MAP` (22 field→subcategory mappings for the Python engine)

---

### 2. Quantitative L×I Scoring (P0) — DONE

**5×5 Likelihood × Impact matrix**, score = L × I (range 1–25).

**Labels (short, plain-language for hospital staff):**
```
Likelihood:  1=Rare · 2=Unlikely · 3=Might happen · 4=Likely · 5=Will happen
Impact:      1=Tiny · 2=Small · 3=Noticeable · 4=Major · 5=Severe
```

**Color bands:**
```
Score ≥20 → red      (critical)
12–19     → orange   (high)
6–11      → yellow   (medium)
<6        → green    (low)
```

**Where to find it:**
- `data.ts` → every `Flag` has `likelihood`, `impact`, `risk_score`
- `App.tsx` → **Risk Matrix tab** (5×5 grid with methodology panel)
- `App.tsx` → Risk Register table shows L, I, Score columns with color coding
- `test_framework.py` → `_flag()` auto-derives `subcategory` via `SUBCATEGORY_MAP`

---

### 3. Amendment Tracking — Closed Loop (P0–P1) — DONE

**5-step workflow:** `pending → reviewed → executed → verified → archived`

- **Human verification** at `verified` step (checklist: signatures, effective date, cross-refs updated)
- **Bidirectional status changes** — can go back (e.g. verified → pending) to avoid mis-taps
- **Expandable detail cards** — click to see risk flags, key fields, status buttons
- **Amendment doc cards** — parent → child visual link (e.g. #10 DSA → #11 Amendment No.1)

**Demo data:**
- Contract #10 (Health DSA) has 3 amendments
- Contract #11 (DSA Amendment No.1) is a standalone amendment doc with `baseContractId: 10`
- 4 flags on #11: missing VP signatures, breach timeline tightening, ICD-10 encryption, parent expiry gap

**Where to find it:**
- `App.tsx` → `AmendmentsView` component (closed-loop, modal-confirmed)
- `data.ts` → `Amendment` interface (`id`, `label`, `effectiveDate`, `keyChanges`, `supersedesOriginal`)
- `data.ts` → `ContractDoc.baseContractId` (nullable, links amendment → parent)
- `research/contracts/11_DSA_Amendment_No1_Extended_Retention_2026.md` (demo doc)

---

### 4. Document Impact Cascades — Cross-Refs (P0–P1) — DONE

**Purpose:** Doc A changed → Doc B/C need updating → discover gaps the hospital missed.

**5-step workflow:** `detected → acknowledged → fixing → verified → closed`

**6 demo cross-refs** (`docLinks` in `data.ts`):
```
#10 DSA §3.2  →  Security & Privacy Policy §4.1    (GAP — retention 24mo vs 48mo)
#10 DSA §5.1  →  Breach Response Plan §2.3         (GAP — 48h vs 24h notification)
#10 DSA §7.2  →  Records Management Schedule Item 12 (UNKNOWN — audit rights missing)
#11 Amendment §2.1 → #10 DSA §3.2                  (SYNCED — amendment updates parent)
#2 MOU §8     →  #5 NDA §4                         (GAP — confidentiality term mismatch)
#9 IT MSA §12 →  #9 IT MSA Exhibit B               (SYNCED — SLA credits aligned)
```

**Each cross-ref has:**
- `beforeText` / `afterText` — what the target doc says now vs what it should say
- `keyChanges` — specific clause-level changes
- `status`: `synced` (green) / `gap` (red) / `unknown` (yellow)
- `riskIfNotUpdated` — consequence description

**Where to find it:**
- `App.tsx` → `CrossRefsView` component
- `data.ts` → `DocLink` interface + `docLinks` array (6 entries)

---

### 5. Modal Confirmation on Status Changes — DONE

**Every status button click opens an in-page modal** (not a browser `confirm()`):

```
┌─────────────────────────────────────────────┐
│ Confirm: Verified ✓                         │
├─────────────────────────────────────────────┤
│ #10 Data Sharing Agreement                  │
│   → Security & Privacy Policy               │
│                                             │
│ Before (current in target)  [red box]       │
│ "Retention period is 24 months..."         │
│                                             │
│ After (required by source)   [green box]    │
│ "Retention period is 48 months..."         │
│                                             │
│ Key Changes                                 │
│  • §3.2: 24 months → 48 months            │
│  • §5.1: deletion → 48-month window        │
│                                             │
│ Status: Detected → Verified ✓               │
│                                             │
│ Before confirming, verify:                  │
│  □ Clause updated                           │
│  □ No other docs still reference old value  │
│  □ Logged in document control register      │
├─────────────────────────────────────────────┤
│  [Cancel]              [Confirm → Verified]  │
└─────────────────────────────────────────────┘
```

Applies to **both** Amendments and Cross-Refs tabs. Cancel = no change. Confirm = state updates.

---

### 6. Multi-Dimensional Search + Expiry Tickler — DONE

**4-level context-aware filters** (Risk Register tab):
```
Severity (All/Critical/High/Medium/Low)
  → HEROC Category (All/Operational/Financial/Reputational/Continuity)
    → Subcategory (context-aware: shows depts under selected sub)
      → Clinical Dept (context-aware: filtered by selected subcategory)
```

**Sidebar filters:**
- Contract Type (NDA / MOU / Procurement / Data_Sharing)
- Risk Level (Low / Critical)
- Department (22 Southlake depts — `SOUTHDEPARTMENTS` constant)
- Expiry (Expired / <30d / <90d / >90d)

**Expiry Tickler (Deadlines tab):**
- Sorted by urgency: expired → <30d → <90d → >90d
- Color-coded: red (expired), orange (<30d), yellow (<90d), green (>90d)
- Shows renewal notice deadlines (`renewalNoticeDays` field)

---

### 7. UI Professionalism — DONE

- **Flat design**, teal/white color scheme, no gratuitous shadows/gradients
- **6 tabs**: Risk Register · Risk Matrix · Contracts · Deadlines · Amendments · Cross-Refs
- **Left sidebar**: settings (repo path, expiry date, local AI toggle, Ollama address, model, signing authority) + filters
- **Expandable detail cards** everywhere (contracts, amendments, cross-refs)
- **Modal confirmations** for all status changes (no `window.confirm()`)

---

## File Map (what to read first)

```
web-dashboard/
├── src/
│   ├── App.tsx          ← 1567 lines, all 6 views + modal + filters
│   └── data.ts          ← 639 lines, all demo data + interfaces + constants
├── vite.config.ts       ← base: '/critical-corporate-document-management/' for GH Pages
├── server.py            ← Python API (optional, for pipeline status)
└── package.json

prototypes/
├── test_framework.py   ← 22 rules, SUBCATEGORY_MAP, L×I scoring
└── test-report.json    ← 10/10 tests pass

research/contracts/
├── 01–08               ← original synthetic contracts
├── 09_IT_Master_Services_Agreement_2024.md
├── 10_Health_Data_Sharing_Services_2024.md
└── 11_DSA_Amendment_No1_Extended_Retention_2026.md

项目日志.md              ← full work log (v1–v10)
```

---

## Key Interfaces (data.ts)

```typescript
interface Flag {
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  field: string                    // which contract field triggered this
  highlightField?: string          // text to highlight in the contract
  flag_if: string                 // human-readable description
  likelihood: number              // 1–5
  impact: number                  // 1–5
  risk_score: number              // L × I (1–25)
  compliance_type: 'hard' | 'best_practice'
  risk_category: string           // HEROC: Operational/Financial/Reputational/Continuity
  subcategory: string            // 14 HEROC subcategories
  department: string             // Southlake department
}

interface DocLink {
  sourceNum: number             // contract # that changed
  sourceClause: string          // e.g. "§3.2"
  targetName: string            // affected document name
  targetClause: string          // e.g. "§4.1"
  changeDescription: string
  status: string                // 'synced' | 'gap' | 'unknown'
  riskIfNotUpdated: string
  beforeText: string            // what target currently says
  afterText: string            // what it should say
  keyChanges: string[]         // specific clause-level changes
}

interface Amendment {
  id: number
  label: string
  effectiveDate: string
  keyChanges: string[]
  supersedesOriginal: boolean
}

interface ContractDoc {
  num: number
  name: string
  displayName: string
  type: string
  department: string            // Southlake dept
  expiryDate: string
  renewalNoticeDays: number
  baseContractId: number | null // amendment → parent link
  amendments?: Amendment[]
  flags: Flag[]
  extractedFields: ExtractedField[]
  textHighlights: TextHighlight[]
  // ...
}
```

---

## Workflow States (closed-loop)

```
Amendments:  pending → reviewed → executed → verified → archived
Cross-Refs:  detected → acknowledged → fixing → verified → closed

All status changes:
  - Must confirm via in-page modal (shows before/after + key changes)
  - Can go forward OR backward (bidirectional, prevents mis-taps)
  - 'verified' / 'closed' step shows a human verification checklist
```

---

## What's Still Pending (for next session)

- [ ] **Alicia's de-identified real contracts** → replace synthetic data in `data.ts`
- [ ] **Precise clause location validation** → verify cross-page OCR accuracy on real PDFs
- [ ] **Hosting / handover** → determine if GitHub Pages is sufficient or need Vercel/Railway for the Python API
- [ ] **PHIPA audit log** → add timestamped action log for data privacy compliance
- [ ] **Bulk import** → let users upload a folder of contracts at once (currently one-by-one)

---

## Quick Start (for your teammate)

```bash
# Clone
git clone https://github.com/murphywenjun-del/critical-corporate-document-management.git
cd critical-corporate-document-management

# Run the dashboard
cd web-dashboard
npm install
npm run dev          # → http://localhost:5173

# Run the Python test engine (optional, 10/10 tests)
cd ../prototypes
python3 test_framework.py

# Deploy to GitHub Pages (already configured)
cd web-dashboard
npm run build
cd ..
# (dist/ is already pushed to gh-pages branch — site is live at
#  https://murphywenjun-del.github.io/critical-corporate-document-management/)
```

---

## Design Decisions (don't undo these without discussion)

1. **HEROC is the client taxonomy** — not generic "risk categories". Subcategories map to Southlake's actual departments.
2. **L×I uses short plain-language labels** — "Might happen" not "Possible", "Noticeable" not "Moderate". Hospital staff, not risk analysts.
3. **Closed-loop with bidirectional status** — you can go backward to avoid mis-taps. Modal confirmation on every change.
4. **Data stays local** — Llama via Ollama, no cloud. Southlake won't send PHI to US cloud.
5. **Cross-references = impact cascades** — not just "parent → amendment". The point is to find gaps the hospital missed.
6. **Flat professional UI** — teal/white, no gradients, no animations. Hospital staff need to scan, not be entertained.
