# CCDM Prototype — Handover & Final Documentation

> Per Matthew's 2026-10-17 request: complete documentation of what was built, how it
> works, its capabilities and limits, client test feedback, what's done vs. still to do,
> and how a follow-on team picks up. **This document is a living handover — update it
> after every build round and after user testing.**

Last updated: 2026-10-28 (v42). Owner: Ivy Team (Wenjun + teammate). Client: Southlake Health.
Final delivery: 2026-11-24. User testing: 2026-11-10 → 17 (Tanya + Sam, 30–60 min, see `presentation/user-test-plan.md`).

---

## 1. What this system is

A web-based **Critical Corporate Document Management (CCDM)** prototype for Southlake Health:
a contract-portfolio workbench that combines AI flagging of risky clauses, a centralized
contract repository with full-text search, RBAC-style role visibility, document retention
& disposal tracking, template comparison for contract review, and portfolio-level risk
insights. Built for legal/records workflows (PHI-aware), not a full e-signature or DMS product.

Live demo (GH Pages): `https://murphywenjun-del.github.io/critical-corporate-document-management/?demo=1`
Login (non-demo): `SL1123` / `Southlake#2026` (demo credentials, frontend-only).

## 2. Architecture

```
web-dashboard/                  React 18 + Vite + TypeScript (single-page app)
  src/App.tsx                   All UI components (tabs, views, modals) — one file by design (prototype)
  src/data.ts                   Demo data + domain model + engines (RBAC, retention, template match, risk framework)
  src/types.ts                  Shared types
  dist/                         Built bundle → mirrored to gh-pages branch (Vite base /critical-corporate-document-management/)
server.py                       FastAPI (port 8000) — local API only, NOT hosted on Pages
  GET /api/status               health
  GET /api/folder-tree          real on-disk archive tree (counts from disk, not computed)
  GET /api/search?q=            full-text search over data/archive/**/*.md + research contracts (snippets)
  GET /api/classify-and-file    rule-based auto-filing of uploaded docs into HIROC category tree
data/archive/                   The actual on-disk "centralized repository" (HIROC 4 cats → 14 subcats → 22 depts)
public/research/contracts/      Source contract .md files (13 demo contracts)
presentation/                   Demo scripts, user-test-plan
```

Key principle (client requirement): **every on-disk figure in the UI comes from the API**,
never from in-memory static data. Folder trees, file counts, search hits, archive views — all
disk-backed through `server.py`.

### Build & deploy
```
cd web-dashboard && npx tsc --noEmit && npm run build
# dist/ → commit to gh-pages branch → GH Pages legacy mode serves it
# local dev: npm run dev (vite :5173 proxies /api → :8000) + uvicorn server:app :8000
```
Note: the repo has **no standalone local clone** in the working environment — deploys are
done by cloning `murphywenjun-del/critical-corporate-document-management`, syncing
`web-dashboard/src/*`, building, and pushing `main` (source) + `gh-pages` (dist).

## 3. Feature inventory (what works today)

| Feature | Status | Notes |
|---|---|---|
| Work Queue + 4-step process wizard | ✅ | AI-flagged action items; resolve loop with audit notes |
| Risk Register (42 flags across 13 contracts) | ✅ | L×I scoring, clickable matrix cells |
| Documents / centralized repository | ✅ | All 13 contracts (not just flagged), search, ACTIVE/EXPIRED status, storage location, related docs, amendment links |
| Full-text search (demo docs + on-disk archive) | ✅ | `GET /api/search` indexes .md/.txt/.csv/.json/.docx/.doc (python-docx); per-file RBAC gating — restricted archive files are hidden from roles below their level ("N hidden by role access"); offline fallback message when API down |
| RBAC (4 demo roles, 4 confidentiality levels) | ✅ (simulated) | Role switcher; hidden-doc banner; restricted panel with access-request paths; **edit/manage actions gated by `canManage` (legal only)**: Work Queue buttons, retention approvals, paper disposal. **Production SSO/RBAC = Phase 2** |
| Retention & disposal board | ✅ (demo rules) | `expiry + retentionYears` vs. reference date 2026-10-15; eligible/imminent/retained; approve-discard → Records Management; **paper-copy column + paper disposal sign-off** (5 contracts carry paper metadata, persisted to `sl_paper_disposed`). **Rules are assumptions until Southlake Retention Policy is mapped** |
| Template Match / AI comparison | ✅ (deterministic + local LLM) | 5 reference templates **or any past signed contract** (contract-vs-contract mode); type auto-classification; weighted clause similarity; "Needs Attention" shortlist; full clause diff; **AI Clause Review = real local Ollama** (`POST /api/llm-compare`, strict-JSON summary/findings/focus; degrades to the deterministic diff when Ollama is down) |
| Risk matrix + portfolio insights | ✅ (client taxonomy adopted) | 12-category Southlake/HIROC taxonomy (client register, Jul 2019) drives classification across register/KPI/work queue/CSV (`SOUTHLAKE_RISK_TAXONOMY` + `flagHiroc`); score bands still AI 5×5 L×I — **C×P scoring definitions pending**: the provided HIROC page contains taxonomy only, no scoring (its footnote points to a separate "Common Taxonomy" document, not yet provided). Systemic patterns (same field ≥3 contracts) + What-If top-3 |
| Smart Filing (AI upload → auto-classify → HIROC archive) | ✅ | Rule engine prototype; disk-verified folder tree |
| Cross-refs / Amendments closed loop | ✅ | Confirmed by client in 10-17 meeting — keep and extend |
| Deep links for testing | ✅ | `?demo=1&role=…&tab=…` |

## 4. Known limits (state these to stakeholders)

- **RBAC is a frontend simulation** (role personas + localStorage), not enforced auth.
- **Retention rules are assumptions** (`retentionYears` per contract type: PHI 10y, procurement 7y, superseded 1y…) — replace with the client's Retention Policy mapping when received.
- **Template similarity is deterministic clause-field alignment**; the deterministic diff is the system of record. The **AI Clause Review** panel adds real local-LLM judgment (summary / findings / focus) but is assistive only, and degrades gracefully to the deterministic diff when Ollama is unavailable. Similarity percentages are honest demo figures; "97%" from Luca is an illustrative example, not an accuracy target.
- **Demo date is frozen** (`DEMO_TODAY = 2026-10-15`) so retention/deadline states stay stable for the demo; production would use real dates.
- **13 synthetic contracts** — replace with de-identified real contracts (waiting on Alicia) for user testing.
- No cloud: all LLM inference must stay **local Ollama** in production (hard constraint).
- Deployment to Southlake internal environment (file storage, IT architecture, SSO) requires **Sam's IT team** — Matthew will connect them.

## 5. Open items & next steps

| Item | Status | Owner | Blocks what |
|---|---|---|---|
| Southlake internal risk register | Taxonomy chart (12 categories, HIROC Risk Register Jul 2019 page) received & adopted in v43 ✓; **C×P scoring definitions still pending** — verified: provided page contains NO scoring content (footnote points to a separate HIROC "Common Taxonomy" document, also not provided). Ask client for their internal Risk Scoring Framework | Client (Matthew → Brian) | Score-band alignment (classification already done) |
| Southlake Retention Policy mapping | Policy received per client, **file not yet in project repo** | Wenjun | Retention rule accuracy |
| De-identified real contracts | Waiting on Alicia | Client | Realistic user testing |
| Research agreement samples (CDA/CTA/DSA) | Client to provide samples | Tanya/Luca | Item 6 (research tracking) scope |
| LLM clause matching (local Ollama) | ✅ v45: `POST /api/llm-compare` (AI Clause Review) + Ollama structured extraction in classify-and-file; default engine gemma3:1b on 8GB RAM (`OLLAMA_MODEL` env to prefer a larger model; auto-fallback). **Open question: clause-TEXT-level matching (full document text vs. extracted fields)** | Team | Deeper template diffs |
| User test feedback log | After 11/10–17 session | Adriana (scheduling) + team | Final doc §6 |
| Production deployment | Phase 2 | Sam's IT | — |

## 6. Client test feedback log (fill during/after 11-10…17)

| Tester | Module | Feedback | Category (clear/useful/needs-fix/skip) | Actioned? | Target round |
|---|---|---|---|---|---|
| | | | | | |

## 7. How to continue (follow-on team)

1. **Read** `项目日志.md` (project root, append-only session log, newest on top) — it records every build round, decisions, and demo numbers.
2. **Run**: `cd web-dashboard && npm install && npm run dev` + `python3 server.py` (or `uvicorn server:app --port 8000`). For AI features: local Ollama (`ollama serve`, models `gemma3:1b` + optionally `llama3.1:latest`); without Ollama everything still works — the AI panel shows an offline notice and uploads degrade to rules-only.
3. **Code map**: UI = `App.tsx` (components are flat: `WorkQueueView`, `RiskRegisterTable`, `ContractList`, `TemplateMatchView`, `RetentionBoard`, `DocSearch`, `InsightsView`, …); domain + engines = `data.ts` (`ROLES`/`canView`/`canManage`, `retentionState`, `TEMPLATE_LIBRARY`/`matchTemplate`/`classifyType`/`contractToTemplateRef`, `ARCHIVE_FILE_CONF`/`archiveFileConf`, `RISK_FRAMEWORK`); API = `server.py` (disk endpoints + Ollama glue: `ollama_chat_fallback`, `/api/llm-compare`); rules engine = `test_framework.py` (self-contained shim — **keep its flag `field` keys in sync with `SOUTHLAKE_FLAG_MAP` in server.py and `FLAG_TO_HIROC` in data.ts**).
4. **Never** hardcode on-disk counts in UI; route through the API (client requirement).
5. **Never** use cloud LLM APIs; local Ollama only.
6. Test after changes: `npx tsc --noEmit && npm run build`, then headless-verify key tabs via deep links (`?demo=1&tab=…`).
